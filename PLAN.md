# Busk-O — Build Plan

Chord & lyrics app for worship singers, musicians, and buskers: manage songs, build setlists, view charts on stage, export lineups.

## Core architectural decisions (made once, up front)

1. **ChordPro is the canonical song format.** Every song body is stored as ChordPro text (`[G]Amazing [C]grace`). `chordsheetjs` parses it for rendering, transposition, and importing from other formats (chords-over-lyrics paste, OCR output). One format in the DB = simple everywhere else.
2. **Offline-first reads.** Buskers play where there's no signal. All songs/setlists are mirrored into IndexedDB (`idb`); the UI reads from IndexedDB and syncs with Supabase in the background. Supabase is the source of truth; local wins only while offline, then pushes up.
3. **Supabase RLS from day one.** Every table has `user_id` + row-level security so it's personal-library-safe immediately; team/sharing can come later without a schema rewrite.
4. **Stage view is a first-class route,** not a modal — big type, dark, wake-lock, swipe/foot-tap navigation.

## Data model

```sql
songs
  id uuid pk, user_id uuid → auth.users
  title text, artist text
  original_key text            -- e.g. "G", "F#m"
  tempo int null, time_signature text null
  ccli_number text null        -- worship licensing reference
  body text                    -- ChordPro source
  tags text[]                  -- "hymn", "fast", "communion"...
  created_at, updated_at timestamptz

setlists
  id uuid pk, user_id uuid
  name text, event_date date null, notes text null
  created_at, updated_at

setlist_songs
  id uuid pk, setlist_id → setlists (cascade)
  song_id → songs
  position int                 -- ordering
  transpose_key text null      -- per-setlist key override
  capo int null, notes text null
```

RLS on all three: `user_id = auth.uid()` (setlist_songs via join to setlists).

## Route map (App Router)

```
/                      → redirect: /songs (authed) or /login
/login                 → Supabase auth (email/password + magic link)
/songs                 → library: search, tag filter, sort
/songs/new             → editor
/songs/[id]            → chart view (transpose, capo, font size)
/songs/[id]/edit       → editor
/setlists              → list
/setlists/[id]         → builder: add/reorder/per-song key
/setlists/[id]/play    → STAGE MODE: fullscreen, swipe between songs
/import                → paste text / OCR from image
```

---

## Phase 1 — Foundation & auth (the skeleton)

**Goal: deployed app you can log into.**

- [ ] `create-next-app` (TS, Tailwind 4, App Router, ESLint), add all deps
- [ ] `cn()` helper (clsx + tailwind-merge), base layout, dark-mode-first theme (stage use = dark default)
- [ ] Supabase project: schema above via SQL migration, RLS policies
- [ ] Supabase clients: browser client + server client (`@supabase/ssr` pattern), auth middleware
- [ ] `/login` — email/password + magic link, protected route redirects
- [ ] GitHub repo, Vercel project, env vars — **deploy now**, deploy every phase
- [ ] Vitest wired up with one smoke test

**Done when:** you can sign up, log in, and see an empty `/songs` page on the Vercel URL.

## Phase 2 — Songs CRUD + ChordPro rendering (the heart)

**Goal: add a song, see a beautiful chart.**

- [ ] `lib/chordpro.ts` — wrap chordsheetjs: parse, render to HTML, detect key; unit-test with real worship songs (verses, chorus, bridge, `{soc}/{eoc}` sections)
- [ ] `/songs/new` + edit — two-pane editor: ChordPro textarea left, live preview right (stacked on mobile)
- [ ] Chart renderer component — chords above lyrics, section labels styled (Chorus indented/bold), monospace-free proportional layout
- [ ] `/songs` library — search by title/artist, tag filter chips
- [ ] **Transpose** (chordsheetjs `transpose`) + **capo** display ("Play in G, capo 2, sounds A") + font-size control — persist per song
- [ ] Import from "chords over lyrics" paste (chordsheetjs `ChordsOverWordsParser` → ChordPro)
- [ ] Unit tests: parsing, transposition edge cases (flats/sharps, minor keys)

**Done when:** you can paste in a song either format, save it, transpose it, and it looks good on a phone.

## Phase 3 — Setlists (the point of the app)

**Goal: build a Sunday/busking set and flip through it.**

- [ ] Setlists CRUD, `/setlists/[id]` builder: search-and-add songs, drag/reorder (position int), remove
- [ ] Per-setlist-song key override + capo + notes ("acoustic intro", "repeat bridge x2")
- [ ] **Stage mode** `/setlists/[id]/play`:
  - fullscreen, max font, high contrast
  - swipe / arrow keys / big prev-next tap zones to move between songs
  - Screen Wake Lock API so the phone doesn't sleep mid-song
  - song x/y indicator, quick-jump list
- [ ] Duplicate setlist (reuse last week's set)

**Done when:** you can build a 5-song set, put your phone on a stand, and play through it without touching anything but next.

## Phase 4 — Offline (the busker phase)

**Goal: works in a park with zero bars.**

- [ ] `lib/db.ts` — idb stores: `songs`, `setlists`, `setlist_songs`, `pending_mutations`
- [ ] Read path: hydrate UI from IndexedDB instantly, revalidate from Supabase when online
- [ ] Write path: write to IndexedDB + queue mutation; flush queue on reconnect (`online` event); last-write-wins on `updated_at`
- [ ] Online/offline indicator + "synced / pending changes" badge
- [ ] PWA manifest + icons so it installs to the home screen
- [ ] Test: airplane mode → browse songs, play a setlist, edit a note → reconnect → verify sync

**Done when:** airplane mode is a non-event.

## Phase 5 — Exports & OCR import (the power tools)

**Goal: get songs in from photos, get lineups out to the team.**

- [ ] **PPTX export** (pptxgenjs): setlist → lyrics-only slides for projection (worship team use) — title slide per song, one section per slide, configurable theme; plus a one-slide "lineup" summary (song, key, notes)
- [ ] Plain-text / ChordPro export of a setlist (share with the band)
- [ ] **OCR import** `/import` (tesseract.js, client-side): upload photo of a chart → recognize → heuristic cleanup → chords-over-lyrics parser → editable ChordPro preview → save. Set expectations in UI: OCR output always lands in the editor for review, never saved blind.

**Done when:** photo of a paper chart becomes a song, and a setlist becomes a .pptx download.

## Phase 6 — Polish & quality

- [ ] Autoscroll in stage mode (adjustable speed) — huge for buskers
- [ ] Chord diagrams on tap (optional), Nashville numbers toggle if desired
- [ ] Loading/empty/error states everywhere, keyboard shortcuts in editor
- [ ] Lighthouse pass (PWA, a11y, performance), Vitest coverage of lib/ code
- [ ] README + seed script with a few public-domain hymns

---

## Suggested project structure

```
src/
  app/                 (routes above)
  components/
    songs/  setlists/  stage/  ui/
  lib/
    supabase/          client.ts server.ts middleware.ts
    chordpro.ts        db.ts (idb)  sync.ts  utils.ts (cn)
  types/               database.ts (generated), domain.ts
supabase/
  migrations/
```

## Phase order rationale

Auth/deploy first so every later phase ships to a real URL. Songs before setlists (setlists reference songs). Offline before OCR/exports because it touches the data layer everywhere — retrofitting it later is the expensive mistake. OCR last: it's the flashiest but least essential, and it feeds the editor you built in Phase 2.
