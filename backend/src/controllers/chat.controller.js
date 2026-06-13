/**
 * Chat Controller
 * Handles HTTP logic for the /api/chat endpoint.
 */

const { chatWithAI } = require("../services/chat.service");

/**
 * POST /api/chat
 * Accepts { message: string, notices?: array, history?: array }
 * Returns { success: true, reply: string }
 */
async function handleChat(req, res) {
  try {
    const { message, notices = [], history = [] } = req.body;

    // Input validation
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing or empty 'message' field.",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Message too long. Please keep it under 1000 characters.",
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "GROQ_API_KEY is not set in backend/.env — add your key from console.groq.com/keys",
      });
    }

    const reply = await chatWithAI(message.trim(), notices, history);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("[ChatController] Error:", error.message);

    if (error.message.includes("timeout") || error.code === "ETIMEDOUT") {
      return res.status(504).json({
        success: false,
        error: "AI response timed out. Please try again.",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit reached. Please wait a moment.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Failed to get a response. Please try again.",
    });
  }
}

module.exports = { handleChat };
