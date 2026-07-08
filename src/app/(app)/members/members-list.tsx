"use client";

import { useState, useTransition } from "react";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/roles";
import type { Profile } from "@/types/domain";
import { setUserRole } from "./actions";

export function MembersList({
  members,
  currentUserId,
}: {
  members: Profile[];
  currentUserId: string;
}) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {members.map((m) => (
        <MemberRow key={m.id} member={m} isSelf={m.id === currentUserId} />
      ))}
    </ul>
  );
}

function MemberRow({ member, isSelf }: { member: Profile; isSelf: boolean }) {
  const [role, setRole] = useState<Role>(member.role);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function change(next: Role) {
    const prev = role;
    setRole(next); // optimistic
    setError("");
    startTransition(async () => {
      try {
        await setUserRole(member.id, next);
      } catch (e) {
        setRole(prev); // revert
        setError(e instanceof Error ? e.message : "Failed to update role.");
      }
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate font-medium">
          {member.email ?? member.id}
          {isSelf && <span className="ml-2 text-xs text-muted">(you)</span>}
        </div>
        {error && <div className="text-xs text-danger">{error}</div>}
      </div>
      <select
        value={role}
        disabled={isSelf || pending}
        onChange={(e) => change(e.target.value as Role)}
        className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent disabled:opacity-50"
        title={isSelf ? "You can't change your own role" : "Change role"}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
    </li>
  );
}
