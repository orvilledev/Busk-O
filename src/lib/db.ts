import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Setlist, SetlistSong, Song } from "@/types/domain";

/**
 * Local IndexedDB mirror. Supabase is the source of truth; this store lets the
 * UI read instantly and keep working with zero signal (the busker case).
 * Writes made offline are appended to the `outbox` and replayed on reconnect.
 */

export type OutboxOp =
  | { table: "songs"; type: "upsert"; row: Song }
  | { table: "songs"; type: "delete"; id: string }
  | { table: "setlists"; type: "upsert"; row: Setlist }
  | { table: "setlists"; type: "delete"; id: string }
  | { table: "setlist_songs"; type: "upsert"; row: SetlistSong }
  | { table: "setlist_songs"; type: "delete"; id: string };

export interface OutboxEntry {
  /** Local monotonic id (autoincrement). */
  seq?: number;
  /** When the mutation was queued — used for ordering and conflict checks. */
  queuedAt: number;
  op: OutboxOp;
}

interface BuskoDB extends DBSchema {
  songs: { key: string; value: Song };
  setlists: { key: string; value: Setlist };
  setlist_songs: {
    key: string;
    value: SetlistSong;
    indexes: { by_setlist: string };
  };
  outbox: { key: number; value: OutboxEntry };
  meta: { key: string; value: unknown };
}

const DB_NAME = "busk-o";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BuskoDB>> | null = null;

export function getDB() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this environment.");
  }
  if (!dbPromise) {
    dbPromise = openDB<BuskoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("songs", { keyPath: "id" });
        db.createObjectStore("setlists", { keyPath: "id" });
        const ss = db.createObjectStore("setlist_songs", { keyPath: "id" });
        ss.createIndex("by_setlist", "setlist_id");
        db.createObjectStore("outbox", { keyPath: "seq", autoIncrement: true });
        db.createObjectStore("meta");
      },
    });
  }
  return dbPromise;
}

// --- Reads -----------------------------------------------------------------

export async function getSongs(): Promise<Song[]> {
  return (await getDB()).getAll("songs");
}

export async function getSong(id: string): Promise<Song | undefined> {
  return (await getDB()).get("songs", id);
}

export async function getSetlists(): Promise<Setlist[]> {
  return (await getDB()).getAll("setlists");
}

export async function getSetlistSongs(setlistId: string): Promise<SetlistSong[]> {
  const rows = await (await getDB()).getAllFromIndex(
    "setlist_songs",
    "by_setlist",
    setlistId,
  );
  return rows.sort((a, b) => a.position - b.position);
}

// --- Mirror writes (from a server pull) ------------------------------------

export async function replaceAll(data: {
  songs: Song[];
  setlists: Setlist[];
  setlist_songs: SetlistSong[];
}) {
  const db = await getDB();
  const tx = db.transaction(
    ["songs", "setlists", "setlist_songs", "meta"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("songs").clear(),
    tx.objectStore("setlists").clear(),
    tx.objectStore("setlist_songs").clear(),
  ]);
  await Promise.all([
    ...data.songs.map((s) => tx.objectStore("songs").put(s)),
    ...data.setlists.map((s) => tx.objectStore("setlists").put(s)),
    ...data.setlist_songs.map((s) => tx.objectStore("setlist_songs").put(s)),
  ]);
  tx.objectStore("meta").put(Date.now(), "lastSync");
  await tx.done;
}

export async function getLastSync(): Promise<number | null> {
  const v = await (await getDB()).get("meta", "lastSync");
  return typeof v === "number" ? v : null;
}

// --- Outbox ----------------------------------------------------------------

export async function enqueue(op: OutboxOp) {
  await (await getDB()).add("outbox", { op, queuedAt: Date.now() });
}

export async function getOutbox(): Promise<OutboxEntry[]> {
  const rows = await (await getDB()).getAll("outbox");
  return rows.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

export async function removeFromOutbox(seq: number) {
  await (await getDB()).delete("outbox", seq);
}

export async function clearAll() {
  const db = await getDB();
  const tx = db.transaction(
    ["songs", "setlists", "setlist_songs", "outbox", "meta"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("songs").clear(),
    tx.objectStore("setlists").clear(),
    tx.objectStore("setlist_songs").clear(),
    tx.objectStore("outbox").clear(),
    tx.objectStore("meta").clear(),
  ]);
  await tx.done;
}
