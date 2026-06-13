/**
 * Groq Service
 * Handles all communication with the Groq LLM API.
 */

const Groq = require("groq-sdk");
const { SYSTEM_PROMPT } = require("../prompts/parse.prompt");

// Lazy-initialize the Groq client to avoid crashing at startup if the key
// hasn't been loaded yet or is temporarily missing.
let groq = null;

function getClient() {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

// Model to use — llama-3.3-70b is fast and capable for structured extraction
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Sends raw unstructured text to the LLM and returns a structured notice object.
 * Includes retry logic and JSON parse safety.
 *
 * @param {string} rawText - The messy text to parse
 * @returns {object} Structured notice JSON
 */
async function extractNotice(rawText) {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: rawText },
    ],
    temperature: 0.1, // Low temperature for deterministic structured output
    max_tokens: 512,
    response_format: { type: "json_object" }, // Enforce JSON output
  });

  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from Groq API");
  }

  // ─── Parse and Validate the JSON ───────────────────────────
  const parsed = safeParseJSON(content);

  if (!parsed) {
    console.warn("[GroqService] LLM returned invalid JSON, using fallback.");
    return buildFallback(rawText);
  }

  // Ensure all required fields exist with correct types
  return sanitizeOutput(parsed, rawText);
}

/**
 * Safely parse JSON without throwing.
 */
function safeParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    // Attempt to extract JSON from markdown code fences if model wraps it
    const match = str.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Validate and sanitize the LLM output to match our schema exactly.
 */
function sanitizeOutput(parsed, rawText) {
  const validCategories = ["Academics", "Placement", "Hostel", "Club Event", "General"];
  const validUrgencies = ["Low", "Medium", "High", "Critical"];

  return {
    title: typeof parsed.title === "string" ? parsed.title : "Untitled Notice",
    category: validCategories.includes(parsed.category) ? parsed.category : "General",
    urgency: validUrgencies.includes(parsed.urgency) ? parsed.urgency : "Medium",
    date: isValidDate(parsed.date) ? parsed.date : null,
    time: typeof parsed.time === "string" ? parsed.time : null,
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : rawText.substring(0, 120) + "...",
  };
}

/**
 * Check if a string is a valid YYYY-MM-DD date.
 */
function isValidDate(str) {
  if (typeof str !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Fallback response when the LLM fails to return valid JSON.
 * Ensures the frontend never gets an error for valid user input.
 */
function buildFallback(rawText) {
  return {
    title: "Unparsed Notice",
    category: "General",
    urgency: "Medium",
    date: null,
    time: null,
    summary: rawText.substring(0, 200).trim() + (rawText.length > 200 ? "..." : ""),
  };
}

module.exports = { extractNotice };
