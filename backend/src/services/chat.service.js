/**
 * Chat Service
 * Handles AI chat conversations using Groq.
 */

const Groq = require("groq-sdk");
const { CHAT_SYSTEM_PROMPT } = require("../prompts/chat.prompt");

let groq = null;

function getClient() {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Send a chat message with notice context and get an AI response.
 *
 * @param {string} userMessage - The user's question
 * @param {object[]} noticesContext - Array of current notices for context
 * @param {object[]} chatHistory - Previous messages for conversation continuity
 * @returns {string} AI response text
 */
async function chatWithAI(userMessage, noticesContext = [], chatHistory = []) {
  // Build context from notices
  const contextStr = noticesContext.length > 0
    ? `\n\nCURRENT NOTICES:\n${noticesContext.map((n) => `- [${n.category}] ${n.title}: ${n.summary} (Date: ${n.date || "N/A"}, Time: ${n.time || "N/A"})`).join("\n")}`
    : "";

  const systemWithContext = CHAT_SYSTEM_PROMPT + contextStr;

  // Build messages array with history
  const messages = [
    { role: "system", content: systemWithContext },
    ...chatHistory.slice(-6), // Keep last 6 messages for context window
    { role: "user", content: userMessage },
  ];

  const completion = await getClient().chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 256,
  });

  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from Groq API");
  }

  return content.trim();
}

module.exports = { chatWithAI };
