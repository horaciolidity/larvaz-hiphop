import type { UserRole } from '@/types';

/**
 * La tabla profiles del proyecto tiene un CHECK que solo acepta
 * user/moderator/admin. Mientras se aplique la migración de Supabase,
 * este allowlist garantiza que la cuenta fundadora conserve el rango
 * de Super Admin en la aplicación.
 */
const SUPERADMIN_USERNAMES = new Set(['horaciowalter']);

export function isSuperAdminIdentity(username?: string | null): boolean {
  return Boolean(username && SUPERADMIN_USERNAMES.has(String(username).toLowerCase()));
}

/** Devuelve el perfil con el rol efectivo de la aplicación. */
export function withEffectiveRole<T extends { username?: string; role?: string }>(
  profile: T
): T & { role: UserRole } {
  if (isSuperAdminIdentity(profile?.username)) {
    return { ...profile, role: 'super_admin' as UserRole };
  }
  return { ...profile, role: (profile?.role as UserRole) || 'user' };
}
