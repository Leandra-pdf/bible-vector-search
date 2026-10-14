/**
 * Groups parsed Bible verses into chunks for generating embeddings
 * and performing semantic search.
 *
 * Supports configurable chunk sizes while preserving the original
 * book, chapter, and verse references. 
 */

import type { BibleVerse } from './parse.js';

/**
 * Represents a chunk of Bible text and its original Bible reference.
 */
export interface BibleChunk {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  reference: string;
  text: string;
}

/**
 * Groups Bible verses into chunks of the requested size without
 * crossing chapter boundaries or repeating verses between chunks.
 *
 * @param verses - The parsed Bible verses in their original order.
 * @param chunkSize - The maximum number of verses in each chunk.
 * @returns An array of Bible chunks with combined text and verse references.
 */
export function chunkBibleVerses(
  verses: BibleVerse[],
  chunkSize: number,
): BibleChunk[] {
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new Error('Chunk size must be a positive integer.');
  }

  const chunks: BibleChunk[] = [];
  let index = 0;

  while (index < verses.length) {
    const firstVerse = verses[index];

    if (firstVerse === undefined) {
      break;
    }

    const chunkVerses: BibleVerse[] = [];

    while (
      index < verses.length &&
      chunkVerses.length < chunkSize
    ) {
      const verse = verses[index];

      if (verse === undefined) {
        break;
      }

      if (
        verse.book !== firstVerse.book ||
        verse.chapter !== firstVerse.chapter
      ) {
        break;
      }

      chunkVerses.push(verse);
      index++;
    }

    const lastVerse = chunkVerses[chunkVerses.length - 1];

    if (lastVerse === undefined) {
      break;
    }

    chunks.push({
      book: firstVerse.book,
      chapter: firstVerse.chapter,
      startVerse: firstVerse.verse,
      endVerse: lastVerse.verse,
      reference:
        firstVerse.verse === lastVerse.verse
          ? `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`
          : `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`,
      text: chunkVerses.map((verse) => verse.text).join(' '),
    });
  }

  return chunks;
}