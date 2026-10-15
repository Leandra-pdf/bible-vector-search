/**
 * Provides the POST /search API endpoint for Bible semantic search.
 * Validates requests before searching individual verses and five-verse chunks.
 */


import { NextResponse } from 'next/server';
import { searchBible } from '../../scripts/bible/search';

/**
 * Handles Bible search requests and returns matching passages.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON. Please send a valid JSON request body.' },
      { status: 400 },
    );
  }

  if (typeof body !== 'object' || body === null || !('query' in body)) {
    return NextResponse.json(
      { error: 'Request body must contain a query string.' },
      { status: 400 },
    );
  }

  if (typeof body.query !== 'string' || body.query.trim().length === 0) {
    return NextResponse.json(
      { error: 'Query must be a non-empty string.' },
      { status: 400 },
    );
  }

  const query = body.query.trim();

  // Reject queries containing no letters, such as ";/.;" or "[]{.,@#$".
  if (!/\p{L}/u.test(query)) {
    return NextResponse.json(
      { error: 'Query must contain at least one letter.' },
      { status: 400 },
    );
  }

  let k = 3;

  if ('k' in body) {
    if (
      typeof body.k !== 'number' ||
      !Number.isInteger(body.k) ||
      body.k < 1
    ) {
      return NextResponse.json(
        { error: 'k must be a positive integer.' },
        { status: 400 },
      );
    }

    k = body.k;
  }

  try {
    const [verseResults, chunkResults] = await Promise.all([
      searchBible(query, 'bible_verses', k),
      searchBible(query, 'bible_chunks_5verse', k),
    ]);

    return NextResponse.json({
      query,
      k,
      individualVerses: verseResults,
      multiVerseChunks: chunkResults,
    });
  } catch (error: unknown) {
    console.error('Bible search endpoint failed:', error);

    return NextResponse.json(
      { error: 'Unable to search the Bible right now.' },
      { status: 500 },
    );
  }
}
