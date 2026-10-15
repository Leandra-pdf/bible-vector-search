
'use client';

/**
 * Provides a simple UI for searching Bible passages.
 * Displays individual verses and multi-verse chunks separately.
 */

import { useState } from 'react';

/** Represents a Bible passage returned by the search API. */
type BibleChunk = {
  reference: string;
  text: string;
  score: number;
  distance: number;
};

/** Represents the successful response from POST /search. */
type SearchResponse = {
  query: string;
  individualVerses: BibleChunk[];
  multiVerseChunks: BibleChunk[];
};

/**
 * Renders the search form and displays results from both collections.
 */
export default function Home() {
  const [query, setQuery] = useState('');
  const [individualVerses, setIndividualVerses] = useState<BibleChunk[]>([]);
  const [multiVerseChunks, setMultiVerseChunks] = useState<BibleChunk[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  /**
   * Sends the query to the search API and stores both result sets.
   */
  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setIndividualVerses([]);
    setMultiVerseChunks([]);
    setSearched(false);

    try {
      const response = await fetch('/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        if (
          typeof data === 'object' &&
          data !== null &&
          'error' in data &&
          typeof data.error === 'string'
        ) {
          setError(data.error);
        } else {
          setError('Something went wrong. Please try again.');
        }

        return;
      }

      const result = data as SearchResponse;

      setIndividualVerses(result.individualVerses);
      setMultiVerseChunks(result.multiVerseChunks);
      setSearched(true);
    } catch {
      setError('Unable to connect to the search API. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: '760px',
        margin: '60px auto',
        padding: '0 24px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>Bible Passage Search</h1>
      <p>Ask a question to find related Bible passages.</p>

      <form onSubmit={handleSearch}>
        <label
          htmlFor="query"
          style={{ display: 'block', marginBottom: '8px' }}
        >
          Your question
        </label>

        <textarea
          id="query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What did Aaron help Moses do?"
          rows={3}
          style={{
            boxSizing: 'border-box',
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            resize: 'vertical',
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '12px',
            padding: '10px 18px',
            fontSize: '16px',
            cursor: loading ? 'wait' : 'pointer',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#245b45',
            color: 'white',
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          style={{
            marginTop: '24px',
            padding: '12px',
            color: '#b42318',
            backgroundColor: '#fef3f2',
            borderRadius: '6px',
          }}
        >
          {error}
        </p>
      )}

      {searched && (
        <>
          <section style={{ marginTop: '32px' }}>
            <h2>
              Individual Bible Verses ({individualVerses.length} results)
            </h2>

            {individualVerses.length === 0 ? (
              <p>No individual verses passed the distance threshold.</p>
            ) : (
              individualVerses.map((verse, index) => (
                <article
                  key={`${verse.reference}-${index}`}
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>{verse.reference}</h3>
                  <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
                    {verse.text}
                  </p>
                  <p>Similarity score: {verse.score.toFixed(3)}</p>
                  <p>Cosine distance: {verse.distance.toFixed(3)}</p>
                </article>
              ))
            )}
          </section>

          <section style={{ marginTop: '32px' }}>
            <h2>
              Multiple Bible Verse Chunks ({multiVerseChunks.length} results)
            </h2>

            {multiVerseChunks.length === 0 ? (
              <p>No multi-verse chunks passed the distance threshold.</p>
            ) : (
              multiVerseChunks.map((chunk, index) => (
                <article
                  key={`${chunk.reference}-${index}`}
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>{chunk.reference}</h3>
                  <p style={{ lineHeight: 1.6, marginBottom: 0 }}>
                    {chunk.text}
                  </p>
                  <p>Similarity score: {chunk.score.toFixed(3)}</p>
                  <p>Cosine distance: {chunk.distance.toFixed(3)}</p>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}
