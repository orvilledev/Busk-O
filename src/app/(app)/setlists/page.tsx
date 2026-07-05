import Link from "next/link";
import { Calendar, ListMusic, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { createSetlist } from "./actions";

export default async function SetlistsPage() {
  const supabase = await createClient();
  const { data: setlists } = await supabase
    .from("setlists")
    .select("id, name, event_date, setlist_songs(count)")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const list = setlists ?? [];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Setlists</h1>

      <form
        action={createSetlist}
        className="mb-6 flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-3"
      >
        <input
          name="name"
          required
          placeholder="Sunday Morning, Park Busk…"
          className="min-w-48 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <input
          name="event_date"
          type="date"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <Button type="submit">
          <Plus className="h-4 w-4" /> New setlist
        </Button>
      </form>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <ListMusic className="mb-3 h-8 w-8 text-muted" />
          <p className="font-medium">No setlists yet</p>
          <p className="mt-1 text-sm text-muted">
            Create one above to start building a set.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {list.map((s) => {
            const count =
              (s.setlist_songs as unknown as { count: number }[])?.[0]?.count ??
              0;
            return (
              <li key={s.id}>
                <Link
                  href={`/setlists/${s.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ListMusic className="h-4 w-4 shrink-0 text-muted" />
                    <span className="truncate font-medium">{s.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                    {s.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {s.event_date}
                      </span>
                    )}
                    <span>
                      {count} {count === 1 ? "song" : "songs"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
