-- Favorites: a per-song star, owner-scoped like everything else.
alter table public.songs
  add column if not exists favorite boolean not null default false;

-- Partial index so the favorites list stays fast as the library grows.
create index if not exists songs_favorite_idx
  on public.songs (user_id) where favorite;
