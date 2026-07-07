"use client";

import { useState, useTransition } from "react";
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
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const update = updateSetlist.bind(null, setlist.id);
  const duplicate = duplicateSetlist.bind(null, setlist.id);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteSetlist(setlist.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete setlist");
      }
    });
  };

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
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold">{setlist.name}</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            {setlist.event_date && <span>{setlist.event_date}</span>}
            {setlist.notes && <span>· {setlist.notes}</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <form action={duplicate}>
            <Button type="submit" variant="secondary" size="sm">
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
          </form>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger/10"
            onClick={handleDelete}
            disabled={pending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}
    </>
  );
}
