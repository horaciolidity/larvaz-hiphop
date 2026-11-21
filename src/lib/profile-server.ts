import { supabaseAdmin } from '@/lib/supabase/admin';

export const FALLBACK_USER_ID = '00000000-0000-0000-0000-000000000001';

export function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value || '');
}

/**
 * Resuelve el perfil de Supabase que puede firmar una publicación/comentario.
 * - Si el id es UUID y existe, lo usa.
 * - Si no, busca por username.
 * - Si no existe, crea el perfil y, si la FK lo impide, cae al usuario comunitario.
 */
export async function resolveDbUserId(params: {
  user_id?: string;
  username?: string;
  author_name?: string;
  author_avatar?: string;
  author_location?: string;
  author_disciplines?: string;
}): Promise<string> {
  const cleanUsername = (params.username || '').toLowerCase().trim();
  let finalUserId: string | null = null;

  if (params.user_id && isUUID(params.user_id)) {
    finalUserId = params.user_id;
  }

  if (!finalUserId && cleanUsername) {
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (prof?.id) {
      finalUserId = prof.id;
    }
  }

  if (finalUserId && finalUserId !== FALLBACK_USER_ID) {
    const { data: existingProf } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', finalUserId)
      .maybeSingle();

    if (!existingProf) {
      const autoName = params.author_name || cleanUsername || 'Artista Larvaz';
      const autoUser = cleanUsername || 'user_' + finalUserId.substring(0, 6);
      const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
        id: finalUserId,
        username: autoUser,
        full_name: autoName,
        avatar_url: params.author_avatar || '',
        location: params.author_location || 'Mendoza, Argentina',
        artistic_disciplines: params.author_disciplines || 'Cultura Hip-Hop',
        role: 'user',
        is_banned: false,
        created_at: new Date().toISOString(),
      });
      if (profErr) {
        console.warn('[profile-server] Auto-creación de perfil falló, usando fallback UUID:', profErr.message);
        finalUserId = FALLBACK_USER_ID;
      }
    }
  } else if (!finalUserId) {
    finalUserId = FALLBACK_USER_ID;
  }

  return finalUserId;
}
