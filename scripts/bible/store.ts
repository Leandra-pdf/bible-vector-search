
/**
 * Stores embedded Bible chunks in ChromaDB.
 *
 * Each record contains the original Bible text, its human-readable
 * reference, searchable metadata, and its numerical embedding.
 */

import { ChromaClient } from 'chromadb';
import type { EmbeddedBibleChunk } from './embed.js';

/** The name of the ChromaDB collection containing Bible chunks. */
const COLLECTION_NAME = 'bible_chunks';

/** The number of records to write to ChromaDB in one batch. */
const DEFAULT_BATCH_SIZE = 100;

/**
 * Connects to the local ChromaDB server.
 *
 * @returns A client for communicating with ChromaDB.
 */
export function createChromaClient(): ChromaClient {
  return new ChromaClient({
    path: 'http://localhost:8000',
  });
}

/**
 * Creates the Bible collection if necessary, or retrieves it if it exists.
 *
 * Cosine distance is used to compare semantic embeddings.
 *
 * @param client - The ChromaDB client.
 * @returns The collection used to store Bible chunks.
 */
export async function getBibleCollection(
  client: ChromaClient,
) {
  return client.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: {
      'hnsw:space': 'cosine',
    },
  });
}

/**
 * Stores embedded Bible chunks in batches.
 *
 * The Bible text is saved as the document, references and locations
 * are saved as metadata, and embeddings are saved as vectors.
 * Existing records with the same IDs are updated.
 *
 * @param chunks - Bible chunks paired with their embeddings.
 * @param batchSize - Maximum records to write per batch.
 * @returns The number of chunks processed.
 */
export async function storeEmbeddedBibleChunks(
  chunks: EmbeddedBibleChunk[],
  batchSize: number = DEFAULT_BATCH_SIZE,
): Promise<number> {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('Batch size must be a positive integer.');
  }

  const client = createChromaClient();
  const collection = await getBibleCollection(client);

  for (
    let startIndex = 0;
    startIndex < chunks.length;
    startIndex += batchSize
  ) {
    const batch = chunks.slice(startIndex, startIndex + batchSize);

    const ids: string[] = [];
    const documents: string[] = [];
    const metadatas: Array<{
      reference: string;
      book: string;
      chapter: number;
      startVerse: number;
      endVerse: number;
    }> = [];
    const embeddings: number[][] = [];

    for (const item of batch) {
      const chunk = item.chunk;

      ids.push(
        `${chunk.book}-${chunk.chapter}-${chunk.startVerse}-${chunk.endVerse}`,
      );

      documents.push(chunk.text);

      metadatas.push({
        reference: chunk.reference,
        book: chunk.book,
        chapter: chunk.chapter,
        startVerse: chunk.startVerse,
        endVerse: chunk.endVerse,
      });

      embeddings.push(item.embedding);
    }

    await collection.upsert({
      ids,
      documents,
      metadatas,
      embeddings,
    });
  }

  return chunks.length;
}
