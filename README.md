# Bible Vector Search

A TypeScript proof of concept (POC) for semantic search over the King James Version (KJV) of the Bible. The project parses Bible text, creates passage chunks, generates vector embeddings, stores them in ChromaDB, and exposes a search API and web interface.

## Overview

This project demonstrates an end-to-end semantic search pipeline:

1. Parse the KJV Bible text into individual verses.
2. Group verses into chunks of up to five verses.
3. Generate vector embeddings using OpenAI's `text-embedding-3-small` model.
4. Store embeddings and passage metadata in a locally run ChromaDB vector database.
5. Search the stored passages using natural-language queries.
6. Display matching individual verses and multi-verse chunks in a web interface.

The search endpoint queries two collections: `bible_verses` and `bible_chunks_5verse`. Each collection can return up to `k` candidates, with `k` defaulting to `3`, subject to a cosine-distance threshold of `0.6`.

## Tech Stack

- **TypeScript** — application and data-processing logic
- **Next.js and React** — API endpoint and web interface
- **OpenAI API** — text embeddings
- **ChromaDB** — vector storage and similarity search
- **Node.js and npm** — runtime and package management

## Data Source

The source text is the *King James Version of the Bible*, obtained from Project Gutenberg.

- Source: https://www.gutenberg.org/ebooks/10
- Local source file: `data/bible/kjv.txt`

The parsing script handles the source text's introductory material and book formatting to extract the Bible verses.

## Chunking Strategy

The project uses two levels of retrieval:

- **Individual verses:** Each verse is stored as its own document in `bible_verses`.
- **Multi-verse chunks:** Up to five consecutive verses from the same chapter are grouped into one document in `bible_chunks_5verse`.

The multi-verse chunks do not overlap. Each chunk contains its passage text and metadata, including its book, chapter, starting verse, ending verse, and human-readable reference (for example, `Genesis 1:1-5`).

This strategy supports both precise verse-level retrieval and broader passage-level retrieval. Keeping chunks within chapter boundaries prevents a chunk from combining unrelated chapters.

## Prerequisites

Before running the project, install or obtain:

- **Node.js and npm**
- **An OpenAI-compatible API endpoint** that supports the `text-embedding-3-small` embedding model with 1,536 dimensions
- **An API key** for that endpoint
- **The local KJV source file** at `data/bible/kjv.txt`

ChromaDB is installed as a project dependency and can be started using the included npm script.

## Setup

### 1. Clone the repository and install dependencies

```bash
git clone <repository-url>
cd bible-vector-search
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=your_api_base_url_here
```

Use the API key and base URL provided by your embedding provider. The project uses `text-embedding-3-small` with 1,536 dimensions.

Do not commit `.env` or expose your credentials.

### 3. Verify the source Bible text

Ensure the KJV text file exists at:

```text
data/bible/kjv.txt
```

If it is not included in the repository, obtain it from [Project Gutenberg](https://www.gutenberg.org/ebooks/10).

### 4. Start ChromaDB

```bash
npm run chroma
```

Keep this terminal running. ChromaDB stores its local data in `data/chroma` and is accessed at `localhost:8000`.

### 5. Populate the vector database (initial setup only)

If the database collections have not already been populated, run the project's data-processing and ingestion commands as needed:

```bash
npm run bible:parse
npm run bible:chunk
npm run bible:embed
npm run bible:store
npm run bible:ingest-chunks
npm run bible:ingest-verses
```

These are separate npm commands for the data-preparation workflow. They are not run automatically when a user searches through the web interface.

The ingestion scripts populate the collections used by the search API:

- `bible_verses` — individual Bible verses
- `bible_chunks_5verse` — multi-verse Bible chunks

If these collections are already populated and the ChromaDB data is intact, skip this step. You do not need to reprocess or re-embed the Bible for each search.

Generating embeddings requires API access and may incur usage charges.

## Running the Application

Keep ChromaDB running in its own terminal. Open a second terminal in the project root and start Next.js:

```bash
npm run dev
```

Open the local application in your browser:

http://localhost:3000

Enter a natural-language question, such as:

- `What did Aaron help Moses do?`
- `Where does the Bible talk about patience?`
- `How many Marys are there?`

The interface includes a **K** field, requests per collection, which defaults to `3`. The interface displays results from both collections, including each passage's reference, text, similarity score, and cosine distance.

The query must contain at least one letter. The result count must be a positive whole number. Invalid input is rejected before the UI sends a search request.

## Search API

### Endpoint

```http
POST /search
Content-Type: application/json
```

### Request

The `query` field is required. The optional `k` field specifies the maximum number of candidates requested from each collection.

```json
{
  "query": "What did Aaron help Moses do?",
  "k": 5
}
```

If `k` is omitted, it defaults to `3`:

```json
{
  "query": "What did Aaron help Moses do?"
}
```

### Response

The endpoint returns separate arrays for individual verses and multi-verse chunks. Each result contains a human-readable reference, passage text, similarity score, and cosine distance.

Example response structure:

```json
{
  "query": "What did Aaron help Moses do?",
  "k": 1,
  "individualVerses": [
    {
      "reference": "Exodus 4:16",
      "text": "And he shall be thy spokesman unto the people...",
      "score": 0.72,
      "distance": 0.28
    }
  ],
  "multiVerseChunks": [
    {
      "reference": "Exodus 4:26-30",
      "text": "Passage text...",
      "score": 0.81,
      "distance": 0.19
    }
  ]
}
```

The passage text and numeric values above illustrate the response format; actual results depend on the query and stored data.

### Search behavior

- The `k` parameter controls the maximum number of candidates requested from **each collection**.
- Setting `"k": 5` requests up to five individual-verse candidates and five multi-verse-chunk candidates, for a maximum of ten returned results before threshold filtering.
- `k` must be a positive integer. Values such as `0`, `-1`, `2.5`, and `"five"` are rejected with HTTP `400`.
- A result is included only when its cosine distance is less than or equal to `0.6`.
- The threshold is applied after retrieving the top `k` candidates from each collection. If some candidates exceed the threshold, fewer than `k` results may be returned for that collection. The search does not fetch replacement candidates.
- The endpoint returns the requested `k` value in its response.

### Example API requests with curl

With ChromaDB and Next.js running, execute:

Request two candidates per collection

```bash
curl -s -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query":"love is patient","k":2}' \
  | jq .
```

Use the default of three candidates per collection:

```bash
curl -s -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query":"love is patient"}' \
  | jq .
```

Test query validation:

```bash
curl -i -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query":";/.;","k":3}'
```

Test `k` validation:

```bash
curl -i -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query":"love is patient","k":0}'
```

To test empty-query validation:

```bash
curl -i -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query":""}' \
  | jq
```

### Understanding the metrics

- **Cosine distance:** Measures how far apart the query embedding and a stored embedding are under the collection's cosine-distance metric. Lower values indicate closer matches.
- **Similarity score:** The project calculates this display value as `1 - distance`. Higher values indicate closer matches under this convention.

The similarity score is a derived ranking indicator, not a probability that a passage is relevant.

### Error handling

The API validates requests before performing a search.

| Condition | HTTP status | Behavior |
|---|---:|---|
| Malformed JSON request body | `400` | Returns an invalid JSON error |
| Missing `query` field | `400` | Explains that a query string is required |
| Empty or non-string query | `400` | Requires a non-empty string |
| Query contains no letters, such as `;/.;` | `400` | Requires at least one letter |
| `k` is not a number, is not an integer, or is less than `1` | `400` | Requires a positive integer |
| Unexpected search or server failure | `500` | Returns a generic server error |

The web interface performs query and result-count validation before sending a request. The API independently repeats validation so that invalid requests are rejected even when the endpoint is called directly.

Example error response:

```json
{
  "error": "Query must contain at least one letter."
}
```

Unexpected server-side failures return a generic error message without exposing internal details.

## Available npm Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the Next.js development server |
| `npm run chroma` | Starts ChromaDB using `data/chroma` |
| `npm run bible:parse` | Parses the source Bible text |
| `npm run bible:chunk` | Creates multi-verse chunks |
| `npm run bible:embed` | Generates embeddings |
| `npm run bible:store` | Runs the storage script |
| `npm run bible:ingest-chunks` | Ingests multi-verse chunks |
| `npm run bible:ingest-verses` | Ingests individual verses |
| `npm run bible:search` | Runs the Bible search script |
| `npm run test:parse` | Runs parsing tests |
| `npm run test:chunk` | Runs chunking tests |
| `npm run test:store` | Runs storage tests |
| `npm run test:search` | Runs search tests |

## Troubleshooting

**The application cannot connect to ChromaDB**

- Confirm that `npm run chroma` is running.
- Check that the server is available at `localhost:8000`.
- Confirm that the expected collections have been ingested.

**Embedding requests fail**

- Check that `.env` contains the correct `OPENAI_API_KEY` and `OPENAI_BASE_URL`.
- Confirm that the configured endpoint supports the embedding model.
- Check your provider's API usage limits and credentials.

**The search returns no results**

- Try a different natural-language query.
- Remember that results with cosine distance greater than `0.6` are excluded.
- Confirm that the relevant collection contains records.

**The browser shows an API error**

- Confirm that Next.js is running.
- Check the Next.js terminal for server-side errors.
- Confirm that ChromaDB is available and that embedding requests succeed.

## Security and Generated Data

- `.env` contains local credentials and must not be committed.
- `node_modules/` contains installed dependencies and must not be committed.
- `data/chroma/` contains local vector database data.
- `/data/security/` contains local security test fixtures and is excluded from the Git repository.

The vector database can be rebuilt by rerunning the project's processing and ingestion workflow.

## License and Source Attribution

The source text is from Project Gutenberg's *King James Version of the Bible*, eBook #10.

Source: https://www.gutenberg.org/ebooks/10

Consult the Project Gutenberg eBook and its included license for the applicable source terms and restrictions.
