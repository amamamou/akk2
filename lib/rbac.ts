/** Shared role helpers for frontend RBAC gates. */

export function normalizeRole(role?: string | null): string {
  return String(role ?? "").trim().toUpperCase();
}

export function isSuperAdminRole(role?: string | null): boolean {
  return normalizeRole(role) === "SUPER_ADMIN";
}

export function isManagerRole(role?: string | null): boolean {
  return normalizeRole(role) === "MANAGER";
}

/** Player provisioning is restricted to Super Admins (server enforces the same). */
export function canProvisionPlayers(role?: string | null): boolean {
  return isSuperAdminRole(role);
}
