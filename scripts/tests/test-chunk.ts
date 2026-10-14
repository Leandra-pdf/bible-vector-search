/**
 * Tests Bible chunking with different chunk sizes and chapter boundaries.
 */

import assert from 'node:assert/strict';
import { chunkBibleVerses } from '../chunk.js';
import { parseBible } from '../bible/parse.js';
import type { BibleVerse } from '../bible/parse.js';

const sampleVerses: BibleVerse[] = [
  { book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning.' },
  { book: 'Genesis', chapter: 1, verse: 2, text: 'God created.' },
  { book: 'Genesis', chapter: 1, verse: 3, text: 'The earth was empty.' },
  { book: 'Genesis', chapter: 1, verse: 4, text: 'There was light.' },
  { book: 'Genesis', chapter: 1, verse: 5, text: 'God saw the light.' },
  { book: 'Genesis', chapter: 1, verse: 6, text: 'Let there be a firmament.' },
  { book: 'Genesis', chapter: 2, verse: 1, text: 'The heavens were finished.' },
];

// Test chunks of 5 verses.
const fiveVerseChunks = chunkBibleVerses(sampleVerses, 5);

assert.equal(fiveVerseChunks.length, 3);

const firstChunk = fiveVerseChunks[0];
const secondChunk = fiveVerseChunks[1];
const thirdChunk = fiveVerseChunks[2];

assert.ok(firstChunk);
assert.ok(secondChunk);
assert.ok(thirdChunk);

assert.equal(firstChunk.startVerse, 1);
assert.equal(firstChunk.endVerse, 5);
assert.equal(firstChunk.text.split(' ').length, 16);

// The remaining verse in chapter 1 should form its own chunk.
assert.equal(secondChunk.chapter, 1);
assert.equal(secondChunk.startVerse, 6);
assert.equal(secondChunk.endVerse, 6);

// Chapter 2 must start a new chunk.
assert.equal(thirdChunk.chapter, 2);
assert.equal(thirdChunk.startVerse, 1);
assert.equal(thirdChunk.endVerse, 1);

// Test chunks of 1 verse.
const singleVerseChunks = chunkBibleVerses(sampleVerses, 1);

assert.equal(singleVerseChunks.length, 7);

const firstSingleChunk = singleVerseChunks[0];
const secondSingleChunk = singleVerseChunks[1];

assert.ok(firstSingleChunk);
assert.ok(secondSingleChunk);

assert.equal(firstSingleChunk.startVerse, 1);
assert.equal(firstSingleChunk.endVerse, 1);
assert.equal(secondSingleChunk.startVerse, 2);
assert.equal(secondSingleChunk.endVerse, 2);

// Test references
assert.equal(firstChunk.reference, 'Genesis 1:1-5');
assert.equal(secondChunk.reference, 'Genesis 1:6');
assert.equal(thirdChunk.reference, 'Genesis 2:1');
assert.equal(firstSingleChunk.reference, 'Genesis 1:1');
assert.equal(secondSingleChunk.reference, 'Genesis 1:2');

// Test empty input.
assert.deepEqual(chunkBibleVerses([], 5), []);

// Test invalid chunk size.
assert.throws(() => chunkBibleVerses(sampleVerses, 0));
assert.throws(() => chunkBibleVerses(sampleVerses, -1));


/**
 * Test chunking against the complete parsed Bible.
 */

// Parse the full Bible from the source file.
const allVerses = parseBible('data/bible/kjv.txt');

// Test the full Bible with a chunk size of 5.
const fullBibleChunks = chunkBibleVerses(allVerses, 5);

// Test the full Bible with a chunk size of 1.
const fullBibleSingleChunks = chunkBibleVerses(allVerses, 1);

// Every verse should have its own chunk when the size is 1.
assert.equal(fullBibleSingleChunks.length, allVerses.length);

// Walk through the size-5 chunks and compare them with the
// original parsed verses, in order.
let verseIndex = 0;

for (const chunk of fullBibleChunks) {
  const firstVerse = allVerses[verseIndex];

  assert.ok(firstVerse);

  // A chunk must start at the expected verse.
  assert.equal(chunk.book, firstVerse.book);
  assert.equal(chunk.chapter, firstVerse.chapter);
  assert.equal(chunk.startVerse, firstVerse.verse);

  // Build the verses that belong in this chunk.
  const expectedVerses: BibleVerse[] = [];

  while (expectedVerses.length < 5 && verseIndex < allVerses.length) {
    const verse = allVerses[verseIndex];

    assert.ok(verse);

    // Stop if the next verse belongs to a different chapter or book.
    if (
      verse.book !== firstVerse.book ||
      verse.chapter !== firstVerse.chapter
    ) {
      break;
    }

    expectedVerses.push(verse);
    verseIndex++;
  }

  const lastVerse = expectedVerses[expectedVerses.length - 1];

  assert.ok(lastVerse);

  // Check the ending reference and the combined text.
  assert.equal(chunk.endVerse, lastVerse.verse);
  assert.equal(
    chunk.text,
    expectedVerses.map((verse) => verse.text).join(' '),
  );
  assert.equal(
    chunk.reference,
    firstVerse.verse === lastVerse.verse
      ? `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`
      : `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`,
  );
}

// Every original verse must have been accounted for.
assert.equal(verseIndex, allVerses.length);

// The chunks must contain exactly the same total number of verses
// as the original Bible.
let totalVersesInChunks = 0;

for (const chunk of fullBibleChunks) {
  totalVersesInChunks += chunk.endVerse - chunk.startVerse + 1;
}

assert.equal(totalVersesInChunks, allVerses.length);

console.log('Full Bible chunking tests passed!');
console.log('All Bible chunking tests passed!');