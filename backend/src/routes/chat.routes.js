/**
 * Chat Routes
 * Defines API endpoints for the AI chat assistant.
 */

const { Router } = require("express");
const { handleChat } = require("../controllers/chat.controller");

const router = Router();

// POST /api/chat — send a message and get an AI response
router.post("/chat", handleChat);

module.exports = router;
