import { redirect } from "next/navigation";
import { supabaseConfigured } from "@/lib/supabase/config";

// With a backend: middleware sends guests to /login; the app lives at /songs.
// Without one: land on the backend-free "try" playground.
export default function Home() {
  redirect(supabaseConfigured ? "/songs" : "/try");
}
