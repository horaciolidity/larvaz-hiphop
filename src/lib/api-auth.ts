import { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type ApiAuthResult =
  | { ok: true; user: User; profile: any }
  | { ok: false; status: number; error: string };

function bearerToken(req: NextRequest): string {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

/** Verifica el token de Supabase enviado por el cliente y devuelve el perfil. */
export async function requireUser(req: NextRequest): Promise<ApiAuthResult> {
  const token = bearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: 'Necesitás iniciar sesión.' };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401, error: 'Sesión inválida o vencida.' };
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile) {
    return { ok: false, status: 403, error: 'No encontramos tu perfil de Larvaz.' };
  }
  if (profile.is_banned) {
    return { ok: false, status: 403, error: 'Tu cuenta está suspendida.' };
  }

  return { ok: true, user: data.user, profile };
}

/** Solo admin y super_admin. */
export async function requireAdmin(req: NextRequest): Promise<ApiAuthResult> {
  const result = await requireUser(req);
  if (!result.ok) return result;

  if (result.profile.role !== 'admin' && result.profile.role !== 'super_admin') {
    return { ok: false, status: 403, error: 'Permisos de administrador requeridos.' };
  }

  return result;
}
