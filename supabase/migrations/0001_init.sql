-- Busk-O initial schema: songs, setlists, and setlist ordering.
-- Every table is scoped to the owning user via RLS from day one.

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at fresh on writes.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- songs: the ChordPro library.
-- ---------------------------------------------------------------------------
create table public.songs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  title          text not null,
  artist         text,
  original_key   text,                       -- e.g. "G", "F#m"
  tempo          int,
  time_signature text,
  ccli_number    text,                        -- worship licensing reference
  body           text not null default '',    -- ChordPro source
  tags           text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index songs_user_id_idx on public.songs (user_id);
create index songs_title_idx on public.songs (user_id, title);
create index songs_tags_idx on public.songs using gin (tags);

create trigger songs_set_updated_at
  before update on public.songs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- setlists.
-- ---------------------------------------------------------------------------
create table public.setlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  event_date date,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index setlists_user_id_idx on public.setlists (user_id);

create trigger setlists_set_updated_at
  before update on public.setlists
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- setlist_songs: ordered join with per-set key/capo overrides.
-- ---------------------------------------------------------------------------
create table public.setlist_songs (
  id            uuid primary key default gen_random_uuid(),
  setlist_id    uuid not null references public.setlists (id) on delete cascade,
  song_id       uuid not null references public.songs (id) on delete cascade,
  position      int not null default 0,
  transpose_key text,                          -- per-setlist key override
  capo          int,
  notes         text,
  created_at    timestamptz not null default now()
);

create index setlist_songs_setlist_id_idx
  on public.setlist_songs (setlist_id, position);
create index setlist_songs_song_id_idx on public.setlist_songs (song_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security.
-- ---------------------------------------------------------------------------
alter table public.songs enable row level security;
alter table public.setlists enable row level security;
alter table public.setlist_songs enable row level security;

-- songs: owner-only.
create policy "songs are owner-scoped"
  on public.songs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- setlists: owner-only.
create policy "setlists are owner-scoped"
  on public.setlists for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- setlist_songs: access follows ownership of the parent setlist.
create policy "setlist_songs follow setlist ownership"
  on public.setlist_songs for all
  using (
    exists (
      select 1 from public.setlists s
      where s.id = setlist_songs.setlist_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.setlists s
      where s.id = setlist_songs.setlist_id and s.user_id = auth.uid()
    )
  );
