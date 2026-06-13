/**
 * CampusFlow Backend — Entry Point
 * Wires up middleware, routes, and starts the Express server.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const parseRoutes = require("./src/routes/parse.routes");
const chatRoutes = require("./src/routes/chat.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10kb" })); // cap body size for safety

// ─── Health Check ─────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "campusflow-backend", uptime: process.uptime() });
});

// ─── Routes ───────────────────────────────────────────────────
app.use("/api", parseRoutes);
app.use("/api", chatRoutes);

// ─── Global Error Handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Global Error]", err.message);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 CampusFlow backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
