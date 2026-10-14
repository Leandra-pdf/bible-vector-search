
/**
 * Tests OpenAI embedding generation with a small set of Bible chunks.
 * Verifies that embeddings are returned and paired with their references.
 */

import assert from 'node:assert/strict';
import { embedBibleChunks } from '../bible/embed.js';
import type { BibleChunk } from '../bible/chunk.js';

/**
 * Runs a small integration test against the OpenAI embeddings API.
 */
async function testEmbeddingGeneration(): Promise<void> {
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

  // We should receive one embedded result for each input chunk.
  assert.equal(embeddedChunks.length, 2);

  // Each result should preserve its original reference and text.
  assert.equal(embeddedChunks[0]?.chunk.reference, 'Genesis 1:1');
  assert.equal(embeddedChunks[0]?.chunk.text, sampleChunks[0]?.text);

  assert.equal(embeddedChunks[1]?.chunk.reference, 'John 3:16');
  assert.equal(embeddedChunks[1]?.chunk.text, sampleChunks[1]?.text);

  // Each embedding should contain 1,536 numbers.
  assert.equal(embeddedChunks[0]?.embedding.length, 1536);
  assert.equal(embeddedChunks[1]?.embedding.length, 1536);

  console.log('OpenAI embedding test passed!');
  console.log(`Chunks embedded: ${embeddedChunks.length}`);
  console.log(`Dimensions per embedding: ${embeddedChunks[0]?.embedding.length}`);
}

testEmbeddingGeneration().catch((error: unknown) => {
  console.error('OpenAI embedding test failed:', error);
  process.exitCode = 1;
});
