/**
 * Provides the POST /search API endpoint for Bible semantic search.
 * Accepts a question and returns individual-verse and multi-verse search results.
 */

import { NextResponse } from 'next/server';
import { searchBible } from '../../scripts/bible/search';

/**
 * Handles a Bible search request and returns results from both collections.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== 'object' ||
      body === null ||
      !('query' in body) ||
      typeof body.query !== 'string' ||
      body.query.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'Request body must contain a non-empty query string.' },
        { status: 400 },
      );
    }

    const query = body.query.trim();

    const [verseResults, chunkResults] = await Promise.all([
      searchBible(query, 'bible_verses', 3),
      searchBible(query, 'bible_chunks_5verse', 3),
    ]);

    return NextResponse.json({
      query,
      individualVerses: verseResults.map((result) => ({
        reference: result.reference,
        text: result.text,
      })),
      multiVerseChunks: chunkResults.map((result) => ({
        reference: result.reference,
        text: result.text,
      })),
    });
  } catch (error: unknown) {
    console.error('Bible search endpoint failed:', error);

    return NextResponse.json(
      { error: 'Unable to search the Bible right now.' },
      { status: 500 },
    );
  }
}
