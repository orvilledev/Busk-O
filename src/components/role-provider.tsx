"use client";

import { createContext, useContext } from "react";
import { canEditSongs, canManageRoles, type Role } from "@/lib/roles";

const RoleContext = createContext<Role>("user");

/** Provides the signed-in user's role, fetched once in the app layout. */
export function RoleProvider({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole(): Role {
  return useContext(RoleContext);
}

/** True for admins and the superadmin. */
export function useCanEditSongs(): boolean {
  return canEditSongs(useContext(RoleContext));
}

/** True only for the superadmin. */
export function useCanManageRoles(): boolean {
  return canManageRoles(useContext(RoleContext));
}
