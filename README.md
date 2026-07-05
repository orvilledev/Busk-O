# Busk-O

Chords, lyrics, and setlists for worship singers, musicians, and buskers.
Store songs as ChordPro, build setlists, transpose on the fly, and play through
them hands-free on a dark, dim-stage-friendly interface — online or off.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript 5**
- **Tailwind CSS 4** · lucide-react · clsx + tailwind-merge
- **Supabase** — auth + Postgres (row-level security)
- **idb** — offline IndexedDB mirror
- **chordsheetjs** · **pptxgenjs** · **tesseract.js** (domain libraries)
- **Vitest 4** · ESLint 9 · deployed on **Vercel**

## Getting started

1. **Install**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com), then
   run the SQL in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   in the project's SQL editor.

3. **Configure env** — copy `.env.example` to `.env.local` and fill in your
   Project URL and anon key (Supabase → Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command              | Description               |
| -------------------- | ------------------------- |
| `npm run dev`        | Start the dev server      |
| `npm run build`      | Production build          |
| `npm test`           | Run the Vitest suite once |
| `npm run test:watch` | Watch-mode tests          |
| `npm run lint`       | ESLint                    |

## Build roadmap

See [`PLAN.md`](PLAN.md) for the full phased plan. Current status:

- **Phase 1 — Foundation & auth** ✅ (scaffold, theme, Supabase clients + RLS
  migration, email/password + magic-link login, protected app shell, `/songs`).
- Phase 2 — Songs CRUD + ChordPro rendering (next)
- Phase 3 — Setlists + stage mode
- Phase 4 — Offline / PWA
- Phase 5 — PPTX export + OCR import
- Phase 6 — Polish
