## Overview

The frontend is a minimal operator console that talks to the FastAPI backend in `../backend`. It exposes:

- A health panel that polls `/health` every 15 seconds.
- An engine classifier form that posts to `/predict/engine`.
- A naval degradation form that posts to `/predict/naval`.

The layout is intentionally monochrome (white surface, black accents) with rounded cards and separated React components for maintainability.

## Prerequisites

- Node 18+ (or the version required by Next.js 16)
- pnpm, npm, bun, or yarn
- A running FastAPI backend. The UI defaults to `http://localhost:8000` but you can override it.

## Configuration

Expose the backend location to the browser by setting `NEXT_PUBLIC_API_BASE` before starting the dev server:

```bash
$env:NEXT_PUBLIC_API_BASE="http://localhost:8000" # PowerShell example
```

If the variable is omitted the UI will try `http://localhost:8000`.

## Development

Install dependencies (example with pnpm) and start the dev server:

```bash
pnpm install
pnpm dev
```

Visit `http://localhost:3000` and send sample payloads using the "Use sample" buttons. Every form field is required before submitting.

## Production build

```bash
pnpm build
pnpm start
```

## Notes

- Component source lives under `src/components` for clarity.
- `src/lib/api.ts` centralizes the fetch helpers so endpoints share the same error handling.
- Styling relies on Tailwind classes plus a custom `Card` wrapper to keep things consistent.
