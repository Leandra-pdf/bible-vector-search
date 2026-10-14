
/**
 * Configures the OpenAI client and provides functions for generating
 * text embeddings used by the Bible semantic-search pipeline.
 */

import 'dotenv/config';
import OpenAI from 'openai';

/**
 * The number of dimensions returned for each embedding.
 * All stored Bible vectors and query vectors must use this size.
 */
export const EMBEDDING_DIMENSIONS = 1536;

const EMBEDDING_MODEL = 'text-embedding-3-small';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates an embedding for one text string.
 *
 * @param text - The text to convert into a numerical vector.
 * @returns The embedding as an array of numbers.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const result = response.data[0];

  if (result === undefined) {
    throw new Error('OpenAI did not return an embedding.');
  }

  return result.embedding;
}

/**
 * Generates embeddings for multiple text strings in one API request.
 *
 * The returned embeddings follow the same order as the input texts.
 *
 * @param texts - The text strings to convert into numerical vectors.
 * @returns An array containing one numerical embedding per input string.
 */
export async function createEmbeddings(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const orderedResults = response.data.sort(
    (a, b) => a.index - b.index,
  );

  if (orderedResults.length !== texts.length) {
    throw new Error(
      'The number of embeddings returned does not match the number of inputs.',
    );
  }

  return orderedResults.map((result) => result.embedding);
}
