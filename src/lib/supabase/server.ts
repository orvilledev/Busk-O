import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { canEditSongs, canManageRoles, type Role } from "@/lib/roles";

/** Supabase client for Server Components, Route Handlers, and Server Actions. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — cookies are read-only here.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/** Ensure user is authenticated. Throws if not logged in. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

/** The current user's role. Defaults to "user" when there's no profile row. */
export async function getRole(): Promise<Role> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "user";
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return (data?.role as Role) ?? "user";
}

/** Require an editor (admin or superadmin). Throws otherwise. */
export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (data?.role as Role) ?? "user";
  if (!canEditSongs(role)) throw new Error("Forbidden: admin access required.");
  return { supabase, user, role };
}

/** Require the superadmin. Throws otherwise. */
export async function requireSuperadmin() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (data?.role as Role) ?? "user";
  if (!canManageRoles(role))
    throw new Error("Forbidden: superadmin access required.");
  return { supabase, user, role };
}
