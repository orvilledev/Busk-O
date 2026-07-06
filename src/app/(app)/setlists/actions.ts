"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SetlistSong } from "@/types/domain";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createSetlist(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("setlists")
    .insert({
      user_id: user.id,
      name,
      event_date: eventDate || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/setlists");
  redirect(`/setlists/${data.id}`);
}

export async function updateSetlist(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!name) throw new Error("Name is required.");

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("setlists")
    .update({ name, event_date: eventDate || null, notes: notes || null })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/setlists");
  revalidatePath(`/setlists/${id}`);
}

export async function deleteSetlist(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("setlists").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/setlists");
  redirect("/setlists");
}

/** Deep-copy a setlist and all its songs — "reuse last week's set". */
export async function duplicateSetlist(id: string) {
  const { supabase, user } = await requireUser();

  const { data: original, error: readErr } = await supabase
    .from("setlists")
    .select("name, event_date, notes, setlist_songs(*)")
    .eq("id", id)
    .single();
  if (readErr || !original) throw new Error(readErr?.message ?? "Not found.");

  const { data: copy, error: copyErr } = await supabase
    .from("setlists")
    .insert({
      user_id: user.id,
      name: `${original.name} (copy)`,
      event_date: original.event_date,
      notes: original.notes,
    })
    .select("id")
    .single();
  if (copyErr) throw new Error(copyErr.message);

  const rows = (original.setlist_songs ?? []).map(
    (s: {
      song_id: string;
      position: number;
      transpose_key: string | null;
      capo: number | null;
      notes: string | null;
    }) => ({
      setlist_id: copy.id,
      song_id: s.song_id,
      position: s.position,
      transpose_key: s.transpose_key,
      capo: s.capo,
      notes: s.notes,
    }),
  );
  if (rows.length > 0) {
    const { error } = await supabase.from("setlist_songs").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/setlists");
  redirect(`/setlists/${copy.id}`);
}

export async function addSongToSetlist(setlistId: string, songId: string) {
  const { supabase } = await requireUser();

  // Append after the current last position.
  const { data: last } = await supabase
    .from("setlist_songs")
    .select("position")
    .eq("setlist_id", setlistId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (last?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from("setlist_songs")
    .insert({ setlist_id: setlistId, song_id: songId, position })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/setlists/${setlistId}`);
  return data as SetlistSong;
}

export async function removeSetlistSong(
  setlistSongId: string,
  setlistId: string,
) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("setlist_songs")
    .delete()
    .eq("id", setlistSongId);
  if (error) throw new Error(error.message);
  revalidatePath(`/setlists/${setlistId}`);
}

/** Persist a new ordering; `orderedIds` are setlist_songs ids in display order. */
export async function reorderSetlistSongs(
  setlistId: string,
  orderedIds: string[],
) {
  const { supabase } = await requireUser();
  const updates = orderedIds.map((id, position) =>
    supabase.from("setlist_songs").update({ position }).eq("id", id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidatePath(`/setlists/${setlistId}`);
}

export async function updateSetlistSong(
  setlistSongId: string,
  setlistId: string,
  patch: { transpose_key?: string | null; capo?: number | null; notes?: string | null },
) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("setlist_songs")
    .update(patch)
    .eq("id", setlistSongId);
  if (error) throw new Error(error.message);
  revalidatePath(`/setlists/${setlistId}`);
}
