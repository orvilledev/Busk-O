/** App roles, highest privilege last. Mirrors the `user_role` DB enum. */
export type Role = "user" | "admin" | "superadmin";

export const ROLES: readonly Role[] = ["user", "admin", "superadmin"];

/** Can add / edit / delete songs in the shared pool. */
export function canEditSongs(role: Role): boolean {
  return role === "admin" || role === "superadmin";
}

/** Can manage other users' roles. */
export function canManageRoles(role: Role): boolean {
  return role === "superadmin";
}

export const ROLE_LABEL: Record<Role, string> = {
  user: "User",
  admin: "Admin",
  superadmin: "Superadmin",
};
