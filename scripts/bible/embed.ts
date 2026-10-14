
/**
 * Generates OpenAI embeddings for Bible text chunks.
 *
 * Processes chunks in batches and preserves their Bible references
 * so the embeddings can later be stored and searched in ChromaDB.
 */


import { createEmbeddings } from '../../lib/openai.js';
import type { BibleChunk } from './chunk.js';

/**
 * Represents a Bible chunk paired with its numerical embedding.
 */
export interface EmbeddedBibleChunk {
  chunk: BibleChunk;
  embedding: number[];
}

const DEFAULT_BATCH_SIZE = 100;

/**
 * Generates embeddings for Bible chunks in batches.
 *
 * @param chunks - The Bible chunks to embed.
 * @param batchSize - The number of chunks to send per API request.
 * @returns An async stream of chunks paired with their embeddings.
 */
export async function* embedBibleChunks(
  chunks: BibleChunk[],
  batchSize: number = DEFAULT_BATCH_SIZE,
): AsyncGenerator<EmbeddedBibleChunk> {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('Batch size must be a positive integer.');
  }

  for (
    let startIndex = 0;
    startIndex < chunks.length;
    startIndex += batchSize
  ) {
    const batch = chunks.slice(startIndex, startIndex + batchSize);

    const texts: string[] = [];

    for (const chunk of batch) {
      texts.push(chunk.text);
    }

    const embeddings = await createEmbeddings(texts);

    if (embeddings.length !== batch.length) {
      throw new Error(
        'The number of embeddings returned does not match the number of chunks.',
      );
    }

    for (let index = 0; index < batch.length; index++) {
      const chunk = batch[index];
      const embedding = embeddings[index];

      if (chunk === undefined || embedding === undefined) {
        throw new Error(`Missing chunk or embedding at batch index ${index}.`);
      }

      yield {
        chunk,
        embedding,
      };
    }
  }
}
