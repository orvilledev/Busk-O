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
   in the project's SQL editor. After you've signed up in the app once, you can
   optionally load a few public-domain hymns with
   [`supabase/seed.sql`](supabase/seed.sql).

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

## Features

- **Songs** — ChordPro editor with live preview, chords-over-lyrics paste
  conversion, search + tag filtering.
- **Charts** — chords stacked over lyrics, live transpose, capo hints
  ("play G, capo 2, sounds A"), adjustable font size.
- **Setlists** — drag/reorder builder, per-song key/capo/notes overrides,
  duplicate a set.
- **Stage mode** — fullscreen dark player with keyboard / swipe / tap
  navigation, screen wake-lock, hands-free auto-scroll, and a quick-jump list.
- **Offline / PWA** — installable, works with no signal; local IndexedDB mirror
  and a service worker cache pending changes sync on reconnect.
- **Export** — setlist → PowerPoint lyric slides, plain-text lyrics, or ChordPro.
- **Import** — OCR a photo of a chart (Tesseract) into an editable song.

## Build roadmap

All six phases are complete — see [`PLAN.md`](PLAN.md) for the detailed plan.

1. **Foundation & auth** ✅ — scaffold, theme, Supabase + RLS, login, app shell.
2. **Songs + ChordPro rendering** ✅ — editor, chart renderer, transpose/capo.
3. **Setlists + stage mode** ✅ — builder, overrides, hands-free player.
4. **Offline / PWA** ✅ — IndexedDB mirror, outbox sync, service worker.
5. **Export + OCR import** ✅ — PPTX/text/ChordPro export, Tesseract import.
6. **Polish** ✅ — stage auto-scroll, a11y labels, seed hymns.
