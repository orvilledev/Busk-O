import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SetlistHeader } from "@/components/setlists/setlist-header";
import { SetlistBuilder } from "@/components/setlists/setlist-builder";
import type { Setlist, SetlistSongWithSong } from "@/types/domain";

export default async function SetlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: setlist }, { data: items }, { data: songs }] =
    await Promise.all([
      supabase.from("setlists").select("*").eq("id", id).single(),
      supabase
        .from("setlist_songs")
        .select("*, song:songs(*)")
        .eq("setlist_id", id)
        .order("position", { ascending: true }),
      supabase.from("songs").select("id, title, artist").order("title"),
    ]);

  if (!setlist) notFound();

  const initialItems = (items ?? []) as SetlistSongWithSong[];
  // Remount the builder when the server's song set changes (e.g. after adding
  // a song + router.refresh) so its local state re-initializes from fresh data.
  const builderKey = initialItems.map((i) => i.id).join("-") || "empty";

  return (
    <div>
      <Link
        href="/setlists"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Setlists
      </Link>
      <SetlistHeader setlist={setlist as Setlist} />
      <SetlistBuilder
        key={builderKey}
        setlistId={id}
        setlistName={setlist.name}
        eventDate={setlist.event_date}
        initialItems={initialItems}
        availableSongs={songs ?? []}
      />
    </div>
  );
}
