/**
 * Chronological sorting utility for CampusFlow events and notices.
 *
 * Parses `date` (YYYY-MM-DD) and `time` (HH:mm or human-readable) fields
 * to produce a strict ascending chronological sort.
 *
 * Edge cases handled:
 * - Missing/null time → treated as "00:00" (top of day / "All Day")
 * - Missing/null date → treated as epoch 0 (pushed to very top as fallback)
 * - Non-standard time formats like "14:30", "2:00 PM", "23:59"
 * - Items with identical timestamps maintain stable relative order
 */

/**
 * Extract a numeric timestamp (ms since epoch) from an event-like object.
 * Works with any object that has optional `date` and `time` string fields.
 */
function getTimestamp(event: { date?: string | null; time?: string | null }): number {
  // Parse date — default to epoch if missing
  let dateMs = 0;
  if (event.date) {
    const parsed = new Date(event.date);
    if (!isNaN(parsed.getTime())) {
      dateMs = parsed.getTime();
    }
  }

  // Parse time — default to 00:00 (top of day) if missing
  let timeMs = 0;
  if (event.time) {
    timeMs = parseTimeToMs(event.time);
  }

  return dateMs + timeMs;
}

/**
 * Parse a time string into milliseconds offset from midnight.
 * Supports:
 * - "HH:mm" (24h): "14:30" → 52200000
 * - "H:mm AM/PM": "2:00 PM" → 50400000
 * - "HH:mm - HH:mm" ranges: uses start time
 * - Bare hour: "8" → 28800000
 */
function parseTimeToMs(timeStr: string): number {
  const cleaned = timeStr.trim();

  // Handle range format "09:00 - 10:30" → use start time
  const rangePart = cleaned.split("-")[0].trim();

  // Try 24h format: "14:30" or "09:00"
  const match24 = rangePart.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return (hours * 60 + minutes) * 60 * 1000;
  }

  // Try 12h format: "2:00 PM", "9:30 AM", "11:00AM"
  const match12 = rangePart.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2] || "0", 10);
    const period = match12[3].toLowerCase();

    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    return (hours * 60 + minutes) * 60 * 1000;
  }

  // Try bare number (hour only): "8", "14"
  const bareHour = parseInt(rangePart, 10);
  if (!isNaN(bareHour) && bareHour >= 0 && bareHour <= 23) {
    return bareHour * 60 * 60 * 1000;
  }

  // Unparseable → treat as midnight (top of day)
  return 0;
}

/**
 * Sort an array of events chronologically in ascending order.
 *
 * Works with ANY object shape that has optional `date` and `time` fields.
 * Items without a time default to the top of their day ("All Day" events).
 * Items without a date sort before dated items.
 *
 * Returns a new sorted array (does not mutate the original).
 *
 * @example
 * const sorted = sortEventsByTime(notices);
 * const sorted = sortEventsByTime(calendarEvents);
 * const sorted = sortEventsByTime([...official, ...personal]);
 */
export function sortEventsByTime<
  T extends { date?: string | null; time?: string | null }
>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const tsA = getTimestamp(a);
    const tsB = getTimestamp(b);
    return tsA - tsB;
  });
}
