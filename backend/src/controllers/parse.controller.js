/**
 * Parse Controller
 * Handles HTTP request/response logic for the /api/parse endpoint.
 */

const { extractNotice } = require("../services/groq.service");

/**
 * POST /api/parse
 * Accepts { rawText: string } and returns a structured notice object.
 */
async function parseNotice(req, res) {
  try {
    const { rawText } = req.body;

    // ─── Input Validation ───────────────────────────────────
    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing or empty 'rawText' field. Please provide the text to parse.",
      });
    }

    // Cap input length to avoid excessive token usage
    if (rawText.length > 5000) {
      return res.status(400).json({
        success: false,
        error: "Input too long. Please limit to 5000 characters.",
      });
    }

    // ─── Check API key is configured ────────────────────────
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "GROQ_API_KEY is not set in backend/.env — add your key from console.groq.com/keys",
      });
    }

    // ─── Call Groq Service ──────────────────────────────────
    const result = await extractNotice(rawText.trim());

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[ParseController] Error:", error.message);

    // Handle specific Groq timeout errors
    if (error.message.includes("timeout") || error.code === "ETIMEDOUT") {
      return res.status(504).json({
        success: false,
        error: "AI processing timed out. Please try again.",
      });
    }

    // Handle invalid API key
    if (error.status === 401) {
      return res.status(503).json({
        success: false,
        error: "Invalid GROQ_API_KEY. Check your backend/.env file.",
      });
    }

    // Handle rate limiting
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit reached. Please wait a moment and try again.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to process the text. Please try again.",
    });
  }
}

module.exports = { parseNotice };
