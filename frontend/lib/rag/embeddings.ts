/**
 * Local Embeddings using @xenova/transformers
 *
 * Uses all-MiniLM-L6-v2 (384 dimensions) for semantic similarity.
 * Model is downloaded once and cached.
 */

// @ts-ignore
import { pipeline } from "@xenova/transformers";

let embedder: any = null;

/**
 * Get or initialize the embedding pipeline.
 * First call downloads the model (~30MB), subsequent calls are instant.
 */
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

/**
 * Generate an embedding vector for a piece of text.
 * Returns a 384-dimensional float array.
 */
export async function embed(text: string): Promise<number[]> {
  const model = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
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
