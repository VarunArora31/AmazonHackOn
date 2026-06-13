/**
 * Parse Routes
 * Defines API endpoints for text parsing.
 */

const { Router } = require("express");
const { parseNotice } = require("../controllers/parse.controller");

const router = Router();

// POST /api/parse — accepts raw unstructured text, returns structured notice JSON
router.post("/parse", parseNotice);

module.exports = router;
