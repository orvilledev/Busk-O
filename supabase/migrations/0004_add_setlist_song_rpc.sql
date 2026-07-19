-- Add a song to a setlist and compute its position in a single round trip,
-- instead of the client doing a SELECT max(position) then a separate INSERT.
create or replace function public.add_setlist_song(
  p_setlist_id uuid,
  p_song_id uuid
)
returns public.setlist_songs
language sql
security invoker
as $$
  insert into public.setlist_songs (setlist_id, song_id, position)
  select
    p_setlist_id,
    p_song_id,
    coalesce(max(position), -1) + 1
  from public.setlist_songs
  where setlist_id = p_setlist_id
  returning *;
$$;
