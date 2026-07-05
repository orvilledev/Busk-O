import type { SupabaseClient } from "@supabase/supabase-js";
import type { Setlist, SetlistSong, Song } from "@/types/domain";
import {
  enqueue,
  getOutbox,
  removeFromOutbox,
  replaceAll,
  type OutboxOp,
} from "./db";

/** Something with an `updated_at` timestamp we can compare for conflicts. */
interface Timestamped {
  id: string;
  updated_at?: string;
}

/**
 * Last-write-wins: return whichever row was updated most recently. A missing
 * timestamp is treated as oldest so a real update always wins over a stub.
 * Pure and side-effect free so it's unit-testable.
 */
export function pickNewer<T extends Timestamped>(a: T, b: T): T {
  const ta = a.updated_at ? Date.parse(a.updated_at) : 0;
  const tb = b.updated_at ? Date.parse(b.updated_at) : 0;
  return tb > ta ? b : a;
}

/**
 * Merge a local list with an incoming server list by id, keeping the newer of
 * any conflicting pair. Used when reconciling the mirror after a pull.
 */
export function mergeById<T extends Timestamped>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of local) byId.set(row.id, row);
  for (const row of remote) {
    const existing = byId.get(row.id);
    byId.set(row.id, existing ? pickNewer(existing, row) : row);
  }
  return [...byId.values()];
}

/** Pull the full library from Supabase into the local mirror. */
export async function pull(supabase: SupabaseClient): Promise<void> {
  const [songs, setlists, setlistSongs] = await Promise.all([
    supabase.from("songs").select("*"),
    supabase.from("setlists").select("*"),
    supabase.from("setlist_songs").select("*"),
  ]);

  if (songs.error) throw songs.error;
  if (setlists.error) throw setlists.error;
  if (setlistSongs.error) throw setlistSongs.error;

  await replaceAll({
    songs: (songs.data ?? []) as Song[],
    setlists: (setlists.data ?? []) as Setlist[],
    setlist_songs: (setlistSongs.data ?? []) as SetlistSong[],
  });
}

/** Queue a mutation locally to be replayed when back online. */
export async function queue(op: OutboxOp): Promise<void> {
  await enqueue(op);
}

async function applyOp(supabase: SupabaseClient, op: OutboxOp): Promise<void> {
  if (op.type === "delete") {
    const { error } = await supabase.from(op.table).delete().eq("id", op.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from(op.table)
    .upsert(op.row as never, { onConflict: "id" });
  if (error) throw error;
}

/**
 * Replay every queued mutation in order. Stops at the first failure so we don't
 * drop mutations on a flaky connection; the rest stay queued for next time.
 * Returns the number of mutations successfully flushed.
 */
export async function flushOutbox(supabase: SupabaseClient): Promise<number> {
  const entries = await getOutbox();
  let flushed = 0;
  for (const entry of entries) {
    try {
      await applyOp(supabase, entry.op);
      if (entry.seq !== undefined) await removeFromOutbox(entry.seq);
      flushed += 1;
    } catch {
      break;
    }
  }
  return flushed;
}

/** Flush pending writes, then refresh the mirror. Safe to call on reconnect. */
export async function sync(supabase: SupabaseClient): Promise<void> {
  await flushOutbox(supabase);
  await pull(supabase);
}
