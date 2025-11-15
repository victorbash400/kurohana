# Frontend Guide

Next.js 14 + React 19 single-page interface living in `kuronaha-frontend/` with Tailwind CSS styling and lucide-react icons.

## Environment

- Node.js 20+
- PNPM (preferred)

Install dependencies:

```pwsh
cd kuronaha-frontend
pnpm install
```

## Development

```pwsh
cd kuronaha-frontend
pnpm dev
```

Key UI pieces (in `src/`):

- `app/page.tsx`: page scaffolding.
- `components/TopBar.tsx`: displays live backend health + last refresh timestamp.
- `components/HealthPanel.tsx`: shows model/explainer readiness per domain.
- `components/EnginePredictor.tsx` and `components/NavalPredictor.tsx`: forms with preset buttons that queue log entries when submitted.
- `components/EnginePredictor.tsx`: interacts with `/predict/engine`.
- `components/NavalPredictor.tsx`: interacts with `/predict/naval`.
- `components/ErrorTerminal.tsx`: in-app terminal streaming API/log messages (uses `queueMicrotask` to avoid React warnings).

Tailwind styles live in `app/globals.css`; ESLint rules configured in `eslint.config.mjs`.

## API Integration

HTTP helpers: `src/lib/api.ts` exports `predictEngine` and `predictNaval` functions, each returning `{ status, data }`. Update `NEXT_PUBLIC_API_BASE_URL` if the backend runs on a different host.

## Testing and Linting

```pwsh
pnpm lint
pnpm test # if you decide to add vitest/testing-library
```

Lint already catches React hooks usage, unused vars, and Tailwind class issues.
