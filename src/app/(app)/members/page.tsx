import { redirect } from "next/navigation";
import { createClient, getRole } from "@/lib/supabase/server";
import { canManageRoles } from "@/lib/roles";
import type { Profile } from "@/types/domain";
import { MembersList } from "./members-list";

/** Superadmin-only: manage who is an admin. */
export default async function MembersPage() {
  if (!canManageRoles(await getRole())) redirect("/songs");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: members } = await supabase
    .from("profiles")
    .select("*")
    .order("email", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-bold">Members</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Admins can add, edit, and delete songs. Users can only build their own
        setlists from the shared library.
      </p>
      <MembersList
        members={(members ?? []) as Profile[]}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
