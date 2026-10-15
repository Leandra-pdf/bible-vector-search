
/**
 * Tests storing and retrieving a small number of embedded Bible chunks.
 */

import assert from 'node:assert/strict';
import {
  createChromaClient,
  getBibleCollection,
  storeEmbeddedBibleChunks,
} from '../bible/store.js';
import { embedBibleChunks } from '../bible/embed.js';
import type { BibleChunk } from '../bible/chunk.js';

/**
 * Embeds two sample verses, stores them, and verifies the saved records.
 */
async function testBibleStorage(): Promise<void> {
  const sampleChunks: BibleChunk[] = [
    {
      book: 'Genesis',
      chapter: 1,
      startVerse: 1,
      endVerse: 1,
      reference: 'Genesis 1:1',
      text: 'In the beginning God created the heaven and the earth.',
    },
    {
      book: 'John',
      chapter: 3,
      startVerse: 16,
      endVerse: 16,
      reference: 'John 3:16',
      text: 'For God so loved the world, that he gave his only begotten Son.',
    },
  ];

  const embeddedChunks = [];

  for await (const result of embedBibleChunks(sampleChunks)) {
    embeddedChunks.push(result);
  }

  const storedCount = await storeEmbeddedBibleChunks(
    embedBibleChunks(sampleChunks),
  );

  assert.equal(storedCount, 2);

  const client = createChromaClient();
  const collection = await getBibleCollection(client);

  const results = await collection.get({
    ids: ['Genesis-1-1-1', 'John-3-16-16'],
    include: ['documents', 'metadatas', 'embeddings'],
  });

  assert.equal(results.ids.length, 2);

  const genesisIndex = results.ids.indexOf('Genesis-1-1-1');
  const johnIndex = results.ids.indexOf('John-3-16-16');

  assert.notEqual(genesisIndex, -1);
  assert.notEqual(johnIndex, -1);

  assert.equal(
    results.documents[genesisIndex],
    sampleChunks[0]?.text,
  );
  assert.equal(
    results.documents[johnIndex],
    sampleChunks[1]?.text,
  );

  assert.equal(
    results.metadatas[genesisIndex]?.reference,
    'Genesis 1:1',
  );
  assert.equal(
    results.metadatas[johnIndex]?.reference,
    'John 3:16',
  );

  assert.equal(results.embeddings?.[genesisIndex]?.length, 1536);
  assert.equal(results.embeddings?.[johnIndex]?.length, 1536);

  console.log('ChromaDB storage test passed!');
  console.log(`Records retrieved: ${results.ids.length}`);
  console.log('Bible text and references were preserved.');
  console.log('Embeddings were stored successfully.');
}

testBibleStorage().catch((error: unknown) => {
  console.error('ChromaDB storage test failed:', error);
  process.exitCode = 1;
});
