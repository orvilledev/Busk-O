import type { Metadata } from "next";
import { supabaseConfigured } from "@/lib/supabase/config";
import { Landing } from "@/components/marketing/landing";

export const metadata: Metadata = {
  title: "Busk-O — Chords, lyrics & setlists for the stage",
};

// The site root is the marketing landing page. Signed-in visitors are sent
// straight to /songs by the auth middleware; guests (and backend-free "try"
// mode) land here.
export default function Home() {
  return <Landing configured={supabaseConfigured} />;
}
