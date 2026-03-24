/**
 * Client-side role hints from login (JWT payload mirrored in localStorage).
 * Backend remains authoritative; this is UX + defense in depth.
 */

export function getAuthUserRoles(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('auth_user')
    if (!raw) return []
    const u = JSON.parse(raw) as { roles?: unknown }
    return Array.isArray(u.roles) ? (u.roles as string[]) : []
  } catch {
    return []
  }
}

/** Full owner / admin access to dashboard (not staff-only). */
export function isStoreOwnerFromClient(): boolean {
  const roles = getAuthUserRoles()
  return roles.includes('STORE_OWNER') || roles.includes('SUPER_ADMIN')
}

/** Staff waiter without owner role — limited to orders handling, not settings/bills/catalog. */
export function isWaiterOnlyFromClient(): boolean {
  const roles = getAuthUserRoles()
  if (isStoreOwnerFromClient()) return false
  return roles.includes('WAITER')
}
