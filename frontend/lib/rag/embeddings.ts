/**
 * Text Embeddings for RAG
 *
 * Production-ready: uses a lightweight TF-IDF-inspired vector approach
 * that works on any serverless platform without downloading ML models.
 *
 * Generates 384-dimensional vectors using hashed word features.
 * Not as good as transformer embeddings but works everywhere instantly.
 */

const VECTOR_DIM = 384;

/**
 * Simple tokenizer — splits into lowercase words, removes stop words
 */
function tokenize(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "each",
    "every", "both", "few", "more", "most", "other", "some", "such", "no",
    "nor", "not", "only", "own", "same", "so", "than", "too", "very",
    "just", "because", "but", "and", "or", "if", "while", "that", "this",
    "it", "its", "he", "she", "they", "them", "his", "her", "their",
    "what", "which", "who", "whom", "these", "those", "i", "me", "my",
    "we", "our", "you", "your",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/**
 * Hash a string to a deterministic integer
 */
function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generate a 384-dimensional embedding vector for text.
 * Uses hashed n-gram features for a lightweight semantic representation.
 */
export async function embed(text: string): Promise<number[]> {
  const tokens = tokenize(text);
  const vector = new Float32Array(VECTOR_DIM).fill(0);

  // Unigrams
  for (const token of tokens) {
    const idx = hashStr(token) % VECTOR_DIM;
    vector[idx] += 1;
  }

  // Bigrams (captures word order context)
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = tokens[i] + "_" + tokens[i + 1];
    const idx = hashStr(bigram) % VECTOR_DIM;
    vector[idx] += 0.5;
  }

  // Normalize to unit vector
  let magnitude = 0;
  for (let i = 0; i < VECTOR_DIM; i++) {
    magnitude += vector[i] * vector[i];
  }
  magnitude = Math.sqrt(magnitude);

  if (magnitude > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vector[i] /= magnitude;
    }
  }

  return Array.from(vector);
}

/**
 * Generate embeddings for multiple texts in batch.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embed(text));
  }
  return results;
}
