"use client";

import { useState } from "react";
import { Check, Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Setlist } from "@/types/domain";
import {
  deleteSetlist,
  duplicateSetlist,
  updateSetlist,
} from "@/app/(app)/setlists/actions";

export function SetlistHeader({ setlist }: { setlist: Setlist }) {
  const [editing, setEditing] = useState(false);

  const update = updateSetlist.bind(null, setlist.id);
  const duplicate = duplicateSetlist.bind(null, setlist.id);
  const remove = deleteSetlist.bind(null, setlist.id);

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await update(fd);
          setEditing(false);
        }}
        className="mb-6 flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
      >
        <input
          name="name"
          required
          defaultValue={setlist.name}
          className="rounded-lg border border-border bg-background px-3 py-2 text-lg font-bold outline-none focus:border-accent"
        />
        <div className="flex flex-wrap gap-2">
          <input
            name="event_date"
            type="date"
            defaultValue={setlist.event_date ?? ""}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            name="notes"
            defaultValue={setlist.notes ?? ""}
            placeholder="Notes for the set…"
            className="min-w-48 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm">
            <Check className="h-4 w-4" /> Save
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h1 className="text-2xl font-bold">{setlist.name}</h1>
        <div className="mt-0.5 flex items-center gap-2 text-sm text-muted">
          {setlist.event_date && <span>{setlist.event_date}</span>}
          {setlist.notes && <span>· {setlist.notes}</span>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
        <form action={duplicate}>
          <Button type="submit" variant="secondary" size="sm">
            <Copy className="h-4 w-4" /> Duplicate
          </Button>
        </form>
        <form action={remove}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
