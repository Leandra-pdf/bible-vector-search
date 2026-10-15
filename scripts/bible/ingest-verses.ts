
/**
 * Ingests individual King James Bible verses into ChromaDB.
 *
 * Each verse receives its own embedding and is stored separately
 * from the five-verse chunks for comparison during semantic search.
 */

import { parseBible } from './parse.js';
import { chunkBibleVerses } from './chunk.js';
import { embedBibleChunks } from './embed.js';
import { storeEmbeddedBibleChunks } from './store.js';

/** Each chunk contains exactly one verse. */
const CHUNK_SIZE = 1;

/** Number of verses embedded in each API request. */
const EMBEDDING_BATCH_SIZE = 100;

/** Number of records written in each database request. */
const STORAGE_BATCH_SIZE = 100;

/** Path to the existing King James Bible source file. */
const BIBLE_FILE_PATH = 'data/bible/kjv.txt';

/** Destination collection for individual verses. */
const COLLECTION_NAME = 'bible_verses';

/**
 * Parses, embeds, and stores every Bible verse.
 */
async function ingestVerses(): Promise<void> {
  console.log('Parsing the King James Bible...');

  const verses = parseBible(BIBLE_FILE_PATH);
  console.log(`Parsed verses: ${verses.length}`);

  console.log('Creating individual-verse chunks...');

  const chunks = chunkBibleVerses(verses, CHUNK_SIZE);
  console.log(`Verse chunks created: ${chunks.length}`);

  console.log('Generating embeddings and storing verses...');

  const embeddedChunks = embedBibleChunks(
    chunks,
    EMBEDDING_BATCH_SIZE,
  );

  const storedCount = await storeEmbeddedBibleChunks(
    embeddedChunks,
    STORAGE_BATCH_SIZE,
    COLLECTION_NAME,
  );

  console.log('Individual-verse ingestion complete!');
  console.log(`Verses parsed: ${verses.length}`);
  console.log(`Verse records stored: ${storedCount}`);
  console.log(`Collection: ${COLLECTION_NAME}`);
}

/**
 * Runs ingestion and reports any errors.
 */
ingestVerses().catch((error: unknown) => {
  console.error('Individual-verse ingestion failed:', error);
  process.exitCode = 1;
});
