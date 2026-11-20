# Rekkferga Web

The ferry board at [rekkferga.no](https://rekkferga.no): pick a ferry quay (or a place, resolved
to the first quay on the way) and see the margin between your estimated arrival and the next
departures.

Next.js 15 (App Router, React 19) with Tailwind CSS v4, built as a **static export** (`out/`) and
served by a Cloudflare Worker as static assets (`wrangler.jsonc`). There is no Next.js server:
no API routes, server actions or image optimisation. Live data comes from the Flask API in
`packages/api`.

## Development

Run from the repository root (see the root `CLAUDE.md` for the full command list):

```bash
npm run dev:web        # Next.js on :3000
npm run dev:api        # the API it talks to, on :5000
npm run check          # vitest + web lint + web type-check
```

The API URL comes from `NEXT_PUBLIC_API_URL` in `packages/web/.env.local` (copy `.env.example`).
It is inlined when the dev server starts, so restart `dev:web` after changing it.

## Layout

| Path | What |
|---|---|
| `app/` | `layout.tsx` (providers, header), `page.tsx` (the ferry board), `globals.css` (design tokens) |
| `components/` | UI: `QuayPanel`, `DriveMode`, `DepartureCard`, `HomeLists`, `SearchResults`, `List` (shared list parts), `icons` |
| `hooks/` | Data and device state: position, drive times, departures polling, favourites' next departures, place search |
| `lib/` | Pure logic: margin tiers, Plan B, departure identity (`departures.ts`), quay names, view transitions |
| `contexts/` | Language and favourites (both stored in `localStorage`) |

Shared types, utilities, API clients and the en/no/nn strings live in `/shared`.

## Styling

Colours are CSS variables in `app/globals.css`, redefined under `.dark` (next-themes puts the
class on `<html>`). The ones used from markup are exposed to Tailwind (`bg-surface`,
`text-text-secondary`, `shadow-raised`, …); the tier colours (`--margin-*`) are applied inline
because they depend on data.
