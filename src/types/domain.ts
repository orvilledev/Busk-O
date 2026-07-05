/** Core domain types mirroring the Supabase schema (see supabase/migrations). */

export interface Song {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  original_key: string | null;
  tempo: number | null;
  time_signature: string | null;
  ccli_number: string | null;
  body: string; // ChordPro source
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Setlist {
  id: string;
  user_id: string;
  name: string;
  event_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  transpose_key: string | null;
  capo: number | null;
  notes: string | null;
  created_at: string;
}

/** A setlist entry joined with its song, as rendered in the builder/stage. */
export interface SetlistSongWithSong extends SetlistSong {
  song: Song;
}
