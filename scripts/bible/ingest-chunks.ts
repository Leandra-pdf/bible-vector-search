
/**
 * Ingests the King James Bible into ChromaDB for semantic search.
 *
 * Parses the source, creates five-verse chunks, generates embeddings
 * in batches, and streams the results into the project's collection.
 */

import { parseBible } from './parse.js';
import { chunkBibleVerses } from './chunk.js';
import { embedBibleChunks } from './embed.js';
import { storeEmbeddedBibleChunks } from './store.js';

/** Number of verses grouped into each chunk. */
const CHUNK_SIZE = 5;

/** Number of chunks embedded in each API request. */
const EMBEDDING_BATCH_SIZE = 100;

/** Number of records written to ChromaDB in each batch. */
const STORAGE_BATCH_SIZE = 100;

/** Path to the existing King James Bible source file. */
const BIBLE_FILE_PATH = 'data/bible/kjv.txt';

/**
 * Runs the full Bible ingestion pipeline.
 */
async function ingestBible(): Promise<void> {
  console.log('Parsing the King James Bible...');

  const verses = parseBible(BIBLE_FILE_PATH);
  console.log(`Parsed verses: ${verses.length}`);

  console.log(`Creating chunks of up to ${CHUNK_SIZE} verses...`);

  const chunks = chunkBibleVerses(verses, CHUNK_SIZE);
  console.log(`Chunks created: ${chunks.length}`);

  console.log('Generating embeddings and storing chunks...');

  const embeddedChunks = embedBibleChunks(
    chunks,
    EMBEDDING_BATCH_SIZE,
  );

  const storedCount = await storeEmbeddedBibleChunks(
    embeddedChunks,
    STORAGE_BATCH_SIZE,
  );

  console.log('Bible ingestion complete!');
  console.log(`Verses parsed: ${verses.length}`);
  console.log(`Chunks created: ${chunks.length}`);
  console.log(`Chunks stored: ${storedCount}`);
  console.log('Collection: bible_chunks_5verse');
}

/**
 * Runs ingestion and reports any errors.
 */
ingestBible().catch((error: unknown) => {
  console.error('Bible ingestion failed:', error);
  process.exitCode = 1;
});
