
/**
 * Searches Bible verses or five-verse chunks in ChromaDB
 * using semantic similarity.
 */

/**
 * Searches Bible collections in ChromaDB using OpenAI embeddings.
 */

import { ChromaClient } from 'chromadb';
import { createEmbedding } from '../../lib/openai';

/** Collection containing individual Bible verses. */
const VERSE_COLLECTION = 'bible_verses';

/** Collection containing chunks of up to five verses. */
const CHUNK_COLLECTION = 'bible_chunks_5verse';

/** Maximum cosine distance allowed for a search result. */
const MAX_DISTANCE = 0.6;

/**
 * Searches a Bible collection for passages related to a question.
 *
 * @param question - The natural-language question to search.
 * @param collectionName - The ChromaDB collection to search.
 * @param resultCount - Maximum number of passages to return.
 * @returns Matching passages with their references, text, and distances.
 */
export async function searchBible(
  question: string,
  collectionName: string = VERSE_COLLECTION,
  resultCount: number = 3,
) {
  if (question.trim().length === 0) {
    throw new Error('Search question cannot be empty.');
  }

  if (!Number.isInteger(resultCount) || resultCount < 1) {
    throw new Error('Result count must be a positive integer.');
  }

  if (
    collectionName !== VERSE_COLLECTION &&
    collectionName !== CHUNK_COLLECTION
  ) {
    throw new Error('Unknown Bible collection.');
  }

  const client = new ChromaClient({
    host: 'localhost',
    port: 8000,
    ssl: false,
  });

  const collection = await client.getCollection({
    name: collectionName,
  });

  const queryEmbedding = await createEmbedding(question);
  const collectionCount = await collection.count();

  if (collectionCount === 0) {
    return [];
  }

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: Math.min(resultCount, collectionCount),
    include: ['documents', 'metadatas', 'distances'],
  });

  const documents = results.documents[0] ?? [];
  const metadatas = results.metadatas[0] ?? [];
  const distances = results.distances?.[0] ?? [];

  const matches: {
    reference: string;
    text: string;
    distance: number;
    score: number;
  }[] = [];

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    const distance = distances[i];
    const metadata = metadatas[i];

    if (
      document === null ||
      typeof document !== 'string' ||
      typeof distance !== 'number' ||
      distance > MAX_DISTANCE
    ) {
      continue;
    }

    matches.push({
      reference:
        typeof metadata?.reference === 'string'
          ? metadata.reference
          : 'Unknown reference',
      text: document,
      distance,
      score: 1 - distance,
    });
  }

  return matches;
}
