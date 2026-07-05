/**
 * Whether Supabase credentials are present. When they're missing (e.g. someone
 * just wants to try the app locally), Busk-O runs in a backend-free "try" mode:
 * no auth, no sync — just the chord/lyric/transpose experience.
 */
export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
