/**
 * Runs sample semantic searches against the Bible verse and passage collections.
 * Edit QUESTIONS to test how well retrieval answers different kinds of questions.
 */

import { searchBible } from '../bible/search.js';

const VERSE_COLLECTION = 'bible_verses';
const CHUNK_COLLECTION = 'bible_chunks_5verse';

const QUESTIONS: string[] = [
  'What does the Bible say about being afraid?',
  'What did Aaron help Moses do?',
  'List the Ten Commandments.',
];

const RESULT_COUNT = 3;

/**
 * Runs each test question against both collections and prints the results.
 */
async function runSearchTests(): Promise<void> {
  for (const question of QUESTIONS) {
    console.log('\n========================================');
    console.log(`Question: ${question}`);
    console.log('========================================');

    console.log('\n--- Individual verses ---');
    const verseMatches = await searchBible(
      question,
      VERSE_COLLECTION,
      RESULT_COUNT,
    );

    for (const match of verseMatches) {
      console.log(`\n${match.reference}`);
      console.log(match.text);
    }

    console.log('\n--- Five-verse chunks ---');
    const chunkMatches = await searchBible(
      question,
      CHUNK_COLLECTION,
      RESULT_COUNT,
    );

    for (const match of chunkMatches) {
      console.log(`\n${match.reference}`);
      console.log(match.text);
    }
  }
}

runSearchTests().catch((error: unknown) => {
  console.error('Bible search tests failed:', error);
  process.exitCode = 1;
});
