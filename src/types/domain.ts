/** Core domain types mirroring the Supabase schema (see supabase/migrations). */

import type { Role } from "@/lib/roles";

export interface Profile {
  id: string;
  email: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  user_id: string; // who added it to the shared pool
  title: string;
  artist: string | null;
  original_key: string | null;
  tempo: number | null;
  time_signature: string | null;
  ccli_number: string | null;
  body: string; // ChordPro source
  tags: string[];
  /**
   * Client-derived: whether the current user has starred this song. Favorites
   * live in the per-user `song_favorites` table now, not on the songs row —
   * the sync pull fills this in so the UI can keep reading `song.favorite`.
   */
  favorite: boolean;
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
