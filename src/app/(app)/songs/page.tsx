import { SongsScreen } from "@/components/songs/songs-screen";

// Local-first: the screen renders instantly from the IndexedDB mirror and
// refreshes from Supabase in the background — no server fetch on navigation.
export default function SongsPage() {
  return <SongsScreen />;
}
