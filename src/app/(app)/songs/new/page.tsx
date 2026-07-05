import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SongEditor } from "@/components/songs/song-editor";
import { createSong } from "../actions";

export default function NewSongPage() {
  return (
    <div>
      <Link
        href="/songs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Songs
      </Link>
      <h1 className="mb-6 text-xl font-bold">New song</h1>
      <SongEditor action={createSong} />
    </div>
  );
}
