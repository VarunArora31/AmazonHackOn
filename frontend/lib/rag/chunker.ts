/**
 * Text Chunking Utility
 *
 * Splits documents into overlapping chunks for better retrieval.
 */

export interface TextChunk {
  text: string;
  index: number;
}

/**
 * Split text into chunks of approximately `chunkSize` characters,
 * with `overlap` characters of overlap between consecutive chunks.
 *
 * Splits on paragraph boundaries when possible, falls back to sentence boundaries.
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): TextChunk[] {
  const chunks: TextChunk[] = [];

  // First try splitting by paragraphs
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    // If adding this paragraph exceeds chunk size, save current and start new
    if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push({ text: currentChunk.trim(), index: chunkIndex++ });

      // Keep overlap from end of previous chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + " " + paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({ text: currentChunk.trim(), index: chunkIndex });
  }

  // If we ended up with just one big chunk, split by sentences
  if (chunks.length === 1 && chunks[0].text.length > chunkSize * 2) {
    return splitBySentences(text, chunkSize, overlap);
  }

  return chunks;
}

function splitBySentences(
  text: string,
  chunkSize: number,
  overlap: number
): TextChunk[] {
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  const chunks: TextChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push({ text: currentChunk.trim(), index: chunkIndex++ });
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + " " + sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({ text: currentChunk.trim(), index: chunkIndex });
  }

  return chunks;
}
