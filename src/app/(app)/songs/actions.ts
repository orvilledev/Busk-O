"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/supabase/server";

export interface SongInput {
  title: string;
  artist: string;
  original_key: string;
  tempo: number | null;
  tags: string[];
  body: string;
}

/** Turn a comma/whitespace tag string into a clean array. */
function parseTags(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function readForm(formData: FormData): SongInput {
  const tempoRaw = String(formData.get("tempo") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    artist: String(formData.get("artist") ?? "").trim(),
    original_key: String(formData.get("original_key") ?? "").trim(),
    tempo: tempoRaw ? Number(tempoRaw) : null,
    tags: parseTags(String(formData.get("tags") ?? "")),
    // Browsers submit textarea values with CRLF; store LF so character
    // offsets in the editor (which the DOM normalizes to LF) line up.
    body: String(formData.get("body") ?? "").replace(/\r\n?/g, "\n"),
  };
}

export async function createSong(formData: FormData) {
  const input = readForm(formData);
  if (!input.title) throw new Error("Title is required.");

  // Only admins/superadmin may add to the shared pool (RLS enforces this too).
  const { supabase, user } = await requireAdmin();

  const { data, error } = await supabase
    .from("songs")
    .insert({ ...input, user_id: user.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/songs");
  redirect(`/songs/${data.id}`);
}

export async function updateSong(id: string, formData: FormData) {
  const input = readForm(formData);
  if (!input.title) throw new Error("Title is required.");

  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("songs").update(input).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/songs");
  revalidatePath(`/songs/${id}`);
  redirect(`/songs/${id}`);
}

export async function deleteSong(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("songs").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/songs");
  redirect("/songs");
}

/** Star/unstar a song for the current user (personal, not shared). */
export async function toggleFavorite(id: string, favorite: boolean) {
  const { supabase, user } = await requireUser();

  const { error } = favorite
    ? await supabase
        .from("song_favorites")
        .upsert({ user_id: user.id, song_id: id }, { onConflict: "user_id,song_id" })
    : await supabase
        .from("song_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("song_id", id);

  if (error) throw new Error(error.message);

  // Revalidate all pages that might show this song's favorite state
  revalidatePath("/songs");
  revalidatePath("/favorites");
  revalidatePath(`/songs/${id}`);
}
