/**
 * WhatsApp Autonomous Scheduling Agent
 *
 * Uses Groq's tool-calling to detect scheduling intent,
 * extract structured data, insert into Supabase, and return
 * a natural language confirmation.
 */

import Groq from "groq-sdk";
import { getSupabaseAdmin, type WhatsAppTaskInsert } from "@/lib/supabase/server";

// ─── Groq Client ────────────────────────────────────────────────

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");
    groq = new Groq({ apiKey });
  }
  return groq;
}

// ─── Tool Definition ────────────────────────────────────────────

const SCHEDULE_TOOL: Groq.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "schedule_task",
    description:
      "Schedule a task or event for the student. Use this when the user wants to add something to their calendar or to-do list.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Short, clear title for the task (max 60 chars)",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Priority level based on urgency and deadline proximity",
        },
        scheduled_time: {
          type: "string",
          description:
            "ISO 8601 datetime string for when this should happen. If relative (tomorrow, next Monday), compute from current date June 2026.",
        },
      },
      required: ["title", "priority", "scheduled_time"],
    },
  },
};

// ─── System Prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an elite personal assistant for an Indian university student using CampusFlow. The current date is June 14, 2026.

RULES:
- If the user asks to schedule, remind, add, or plan something → ALWAYS use the schedule_task tool. Extract the title, priority, and scheduled_time.
- If a relative date is mentioned ("tomorrow", "next Monday", "tonight"), resolve it to an ISO 8601 datetime based on the current date.
- Priority: "high" if it's urgent/deadline-related, "medium" for general tasks, "low" for casual/optional things.
- If the user is just chatting or asking questions, reply normally in a friendly, concise way (2-3 sentences max).
- Keep responses short and energetic. Use Indian English.`;

// ─── Agent Function ─────────────────────────────────────────────

export interface AgentResult {
  /** The text reply to send back to the user */
  reply: string;
  /** Whether a task was scheduled */
  taskScheduled: boolean;
  /** The scheduled task details (if created) */
  task?: {
    title: string;
    priority: string;
    scheduled_time: string;
  };
}

/**
 * Process a WhatsApp message through the Groq agent.
 * Handles both conversational replies and autonomous task scheduling.
 *
 * @param message - The raw WhatsApp message text
 * @param phoneNumber - The sender's phone number (used as user ID)
 * @returns AgentResult with the reply text and task details if scheduled
 */
export async function whatsappAgent(
  message: string,
  phoneNumber: string
): Promise<AgentResult> {
  // 1. Call Groq with tool-calling enabled
  const completion = await getGroq().chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message },
    ],
    tools: [SCHEDULE_TOOL],
    tool_choice: "auto",
    temperature: 0.4,
    max_tokens: 512,
  });

  const choice = completion.choices[0];
  const assistantMessage = choice.message;

  // 2. Check if the model wants to call a tool
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    const toolCall = assistantMessage.tool_calls[0];

    if (toolCall.function.name === "schedule_task") {
      // Parse the tool arguments
      let args: { title: string; priority: string; scheduled_time: string };
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        return {
          reply: "I tried to schedule that but couldn't parse the details. Could you rephrase?",
          taskScheduled: false,
        };
      }

      // 3. Insert into Supabase
      const taskData: WhatsAppTaskInsert = {
        phone_number: phoneNumber,
        title: args.title,
        description: null,
        priority: (args.priority as "low" | "medium" | "high") || "medium",
        scheduled_time: args.scheduled_time,
      };

      try {
        const { error } = await getSupabaseAdmin()
          .from("whatsapp_tasks")
          .insert(taskData as any);

        if (error) {
          console.error("[WhatsAppAgent] Supabase insert error:", error);
          return {
            reply: "I understood your task but couldn't save it. Please try again in a moment.",
            taskScheduled: false,
          };
        }
      } catch (dbErr: any) {
        console.error("[WhatsAppAgent] DB error:", dbErr.message);
        return {
          reply: "Database is temporarily unavailable. Try again shortly!",
          taskScheduled: false,
        };
      }

      // 4. Generate a friendly confirmation
      // Call Groq again with the tool result for a natural confirmation
      const confirmCompletion = await getGroq().chat.completions.create({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
          assistantMessage,
          {
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              success: true,
              title: args.title,
              priority: args.priority,
              scheduled_time: args.scheduled_time,
            }),
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const confirmReply =
        confirmCompletion.choices[0]?.message?.content?.trim() ||
        `Done! I've scheduled "${args.title}" (${args.priority} priority) for ${formatTime(args.scheduled_time)}.`;

      return {
        reply: confirmReply,
        taskScheduled: true,
        task: args,
      };
    }
  }

  // 5. No tool call — just a conversational reply
  const textReply =
    assistantMessage.content?.trim() ||
    "I'm not sure how to help with that. Try asking me to schedule something!";

  return {
    reply: textReply,
    taskScheduled: false,
  };
}

// ─── Helper ─────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}
