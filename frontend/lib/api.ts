/**
 * API client for CampusFlow
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Parse raw text into a structured notice via the backend AI.
 * Uses the Express backend (port 5000).
 */
export async function parseNotice(rawText: string) {
  const res = await fetch(`${API_BASE}/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawText }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Parse failed");
  }

  return json.data;
}

/**
 * Send a chat message to the Campus AI assistant.
 * Uses the local Next.js API route (/api/chat) so it works without the Express backend.
 */
export async function sendChatMessage(
  message: string,
  notices: Array<{ title: string; category: string; summary: string; date: string | null; time: string | null }>,
  history: Array<{ role: string; content: string }>
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, notices, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Chat failed");
  }

  return json.reply;
}
