
/**
 * Stores embedded Bible chunks in ChromaDB.
 *
 * Each record contains the original Bible text, its human-readable
 * reference, searchable metadata, and its numerical embedding.
 */

import { ChromaClient } from 'chromadb';
import type { EmbeddedBibleChunk } from './embed.js';

/** The collection reserved for this project's five-verse chunks. */
const COLLECTION_NAME = 'bible_chunks_5verse';

/** The maximum number of records written in one database request. */
const DEFAULT_BATCH_SIZE = 100;

/**
 * Connects to the local ChromaDB server.
 *
 * @returns A client for communicating with ChromaDB.
 */
export function createChromaClient(): ChromaClient {
  return new ChromaClient({
    host: 'localhost',
    port: 8000,
    ssl: false,
  });
}

/**
 * Opens a collection, creating it if needed.
 *
 * The cosine distance metric compares semantic embeddings.
 *
 * @param client - The ChromaDB client.
 * @param collectionName - The destination collection name.
 * @returns The collection used to store Bible chunks.
 */
export async function getBibleCollection(
  client: ChromaClient,
  collectionName: string = COLLECTION_NAME,
) {
  return client.getOrCreateCollection({
    name: collectionName,
    metadata: {
      'hnsw:space': 'cosine',
    },
    embeddingFunction: null,
  });
}

/**
 * Writes one batch of embedded chunks to ChromaDB.
 *
 * @param collection - The destination collection.
 * @param batch - The chunks and vectors to save.
 */
async function storeBatch(
  collection: Awaited<ReturnType<typeof getBibleCollection>>,
  batch: EmbeddedBibleChunk[],
): Promise<void> {
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

/**
 * Stores an async stream of embedded Bible chunks in batches.
 *
 * @param chunks - An async iterable yielding chunks with embeddings.
 * @param batchSize - Maximum records per database request.
 * @returns The number of chunks processed.
 */
export async function storeEmbeddedBibleChunks(
  chunks: AsyncIterable<EmbeddedBibleChunk>,
  batchSize: number = DEFAULT_BATCH_SIZE,
  collectionName: string = COLLECTION_NAME,
): Promise<number> {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('Batch size must be a positive integer.');
  }

  const client = createChromaClient();
  const collection = await getBibleCollection(client, collectionName);

  let batch: EmbeddedBibleChunk[] = [];
  let storedCount = 0;

  for await (const item of chunks) {
    batch.push(item);

    if (batch.length >= batchSize) {
      await storeBatch(collection, batch);
      storedCount += batch.length;
      batch = [];

      console.log(`Stored ${storedCount} chunks...`);
    }
  }

  if (batch.length > 0) {
    await storeBatch(collection, batch);
    storedCount += batch.length;
  }

  return storedCount;
}
