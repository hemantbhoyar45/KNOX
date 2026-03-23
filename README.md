# Adaptive Learning Authenticity System

This project now includes an AI-assisted text authenticity detection pipeline for short student explanations after lesson videos.

## What it does

- Uses Cohere as the primary semantic analysis layer via a local API service.
- Extracts writing and behavior features (paste signal, response speed, lexical markers).
- Combines Cohere signals and local features using a logistic ML classifier.
- Produces an authenticity score, suspicion level, and rationale for adaptive feedback.

## Setup

1. Install dependencies.

```bash
npm install
```

2. Set your Cohere API key in environment variables.

```bash
COHERE_API_KEY=your_key_here
```

Optional:

```bash
COHERE_MODEL=command-r-plus
AUTH_API_PORT=8787
```

3. Run frontend + authenticity API together.

```bash
npm run dev:full
```

You can also run them separately:

```bash
npm run dev
npm run dev:api
```

## API Endpoint

- `POST /api/authenticity/analyze`
- Body: `answer`, `question`, `lessonTitle`, `courseName`
- Returns Cohere semantic scores used by the frontend ML authenticity classifier.

## Notes

- The API key stays server-side in `server/authenticity-api.mjs` and is never exposed to browser code.
- Vite dev server proxies `/api/*` to the authenticity API on port `8787`.
