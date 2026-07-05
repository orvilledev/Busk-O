import { redirect } from "next/navigation";

// Middleware sends unauthenticated users to /login; the app lives at /songs.
export default function Home() {
  redirect("/songs");
}
