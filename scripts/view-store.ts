
/**
 * Displays stored Bible chunks from the ChromaDB collection.
 * Prints the Bible text and reference, not the numerical vectors.
 */

import {
  createChromaClient,
  getBibleCollection,
} from './bible/store.js';

/**
 * Retrieves and prints a sample of stored Bible records.
 */
async function viewStoredBibleChunks(): Promise<void> {
  const client = createChromaClient();
  const collection = await getBibleCollection(client);

  const results = await collection.get({
    limit: 10,
    include: ['documents', 'metadatas'],
  });

  console.log(`Total records in collection: ${await collection.count()}`);
  console.log('');

  for (let index = 0; index < results.ids.length; index++) {
    console.log(`ID: ${results.ids[index]}`);
    console.log(`Reference: ${results.metadatas[index]?.reference}`);
    console.log(`Text: ${results.documents[index]}`);
    console.log('---');
  }
}

/**
 * Runs the viewer and reports any errors.
 */
viewStoredBibleChunks().catch((error: unknown) => {
  console.error('Could not view Bible records:', error);
  process.exitCode = 1;
});
