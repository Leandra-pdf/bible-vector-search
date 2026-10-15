
'use client';

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
  k: number;
  individualVerses: BibleChunk[];
  multiVerseChunks: BibleChunk[];
};

/** Displays the Bible search form and matching passages. */
export default function Home() {
  const [query, setQuery] = useState('');
  const [k, setK] = useState('3');
  const [individualVerses, setIndividualVerses] = useState<BibleChunk[]>([]);
  const [multiVerseChunks, setMultiVerseChunks] = useState<BibleChunk[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  /** Sends the search query and requested result count to the API. */
  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setIndividualVerses([]);
    setMultiVerseChunks([]);
    setSearched(false);

    const trimmedQuery = query.trim();
    const resultCount = Number(k);

    if (!trimmedQuery) {
      setError('Please enter a question.');
      return;
    }

    if (!/\p{L}/u.test(trimmedQuery)) {
      setError('Your question must contain at least one letter.');
      return;
    }

    if (k.trim() === '' || !Number.isInteger(resultCount) || resultCount < 1) {
      setError('Results per collection must be a positive whole number.');
      return;
    }

    try {
      const response = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, k: Number(k) }),
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
          setError('Search failed. Please try again.');
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

  /** Renders a list of passages with their similarity scores and distances. */
  function renderResults(results: BibleChunk[]) {
    if (results.length === 0) {
      return <p>No matching passages found.</p>;
    }

    return (
      <div>
        {results.map((passage, index) => (
          <article
            key={`${passage.reference}-${index}`}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
            }}
          >
            <h3>{passage.reference}</h3>
            <p>{passage.text}</p>
            <p>
              <strong>Similarity score:</strong> {passage.score.toFixed(3)}
            </p>
            <p>
              <strong>Cosine distance:</strong> {passage.distance.toFixed(3)}
            </p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>Bible Vector Search</h1>
      <p>
        Search the King James Version of the Bible using semantic similarity.
      </p>

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
          required
          rows={4}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '6px',
          }}
        />

        <label
          htmlFor="k"
          style={{ display: 'block', marginTop: '16px', marginBottom: '8px' }}
        >
          K
        </label>

        <input
          id="k"
          type="number"
          min={1}
          step={1}
          required
          value={k}
          onChange={(event) => setK(event.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '6px',
          }}
        />

        <button
          type="submit"
          disabled={loading}   
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: loading ? '#9ca3af' : '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ color: 'red', marginTop: '16px' }}>
          {error}
        </p>
      )}

      {searched && (
        <section style={{ marginTop: '32px' }}>
          <h2>Individual Verse Results</h2>
          {renderResults(individualVerses)}

          <h2 style={{ marginTop: '32px' }}>Five-Verse Chunk Results</h2>
          {renderResults(multiVerseChunks)}
        </section>
      )}
    </main>
  );
}
