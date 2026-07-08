"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/supabase/server";
import { ROLES, type Role } from "@/lib/roles";

/** Superadmin-only: set another user's role. */
export async function setUserRole(userId: string, role: Role) {
  if (!ROLES.includes(role)) throw new Error("Invalid role.");

  const { supabase, user } = await requireSuperadmin();

  // Guard against the superadmin locking themselves out.
  if (userId === user.id)
    throw new Error("You can't change your own role.");

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/members");
}
