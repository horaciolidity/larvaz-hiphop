import { supabaseAdmin } from '@/lib/supabase/admin';
import { NPC_PERSONAS, type NpcPersona } from '@/lib/npc-personas';

/**
 * Identidades anónimas para las pruebas de interacción.
 *
 * La tabla comments exige un user_id que exista en profiles, y profiles
 * referencia auth.users. Por eso el modo de pruebas crea (una sola vez)
 * estas cuentas técnicas sin acceso real: no se publican credenciales y
 * se usan únicamente para firmar comentarios anónimos.
 *
 * Cada cuenta tiene una personalidad propia (ver npc-personas.ts).
 */
export interface AnonymousProfile {
  id: string;
  username: string;
  full_name: string;
  persona_id: string;
  persona_label: string;
}

const IDENTITIES = NPC_PERSONAS.map((persona) => ({
  persona,
  email: persona.email,
  location: persona.location,
}));

let cache: AnonymousProfile[] | null = null;

function isMissingTableError(message?: string): boolean {
  return Boolean(message && /does not exist|schema cache/i.test(message));
}

function toAnonymousProfile(profile: any, persona: NpcPersona): AnonymousProfile {
  return {
    id: String(profile.id),
    username: String(profile.username),
    full_name: String(profile.full_name || persona.fullName),
    persona_id: persona.id,
    persona_label: persona.label,
  };
}

/**
 * Garantiza que existan los perfiles anónimos, sincroniza su personalidad
 * visible y los devuelve. Si Supabase no está disponible devuelve [].
 */
export async function ensureAnonymousProfiles(): Promise<AnonymousProfile[]> {
  if (cache && cache.length > 0) return cache;

  const usernames = NPC_PERSONAS.map((persona) => persona.username);
  const { data: existing, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name')
    .in('username', usernames);

  if (error && !isMissingTableError(error.message)) {
    console.warn('[anonymous-users] No se pudieron leer los perfiles:', error.message);
  }

  const found = new Map<string, any>(
    (existing || []).map((profile: any) => [
      String(profile.username).toLowerCase(),
      profile,
    ])
  );

  const missing = IDENTITIES.filter(
    (identity) => !found.has(identity.persona.username.toLowerCase())
  );

  if (missing.length > 0) {
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const authByEmail = new Map(
      (authList?.users || []).map((user) => [String(user.email || '').toLowerCase(), user])
    );

    for (const identity of missing) {
      let authUser = authByEmail.get(identity.email.toLowerCase());

      if (!authUser) {
        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: identity.email,
          password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
          email_confirm: true,
          user_metadata: {
            username: identity.persona.username,
            full_name: identity.persona.fullName,
            anonymous_test: true,
            npc_persona: identity.persona.id,
          },
        });

        if (createError || !created.user) {
          console.warn(
            `[anonymous-users] No se pudo crear ${identity.persona.username}:`,
            createError?.message
          );
          continue;
        }
        authUser = created.user;
      }

      found.set(identity.persona.username.toLowerCase(), {
        id: authUser.id,
        username: identity.persona.username,
        full_name: identity.persona.fullName,
      });
    }
  }

  // Sincronizamos nombre, bio y personalidad de todos los perfiles técnicos.
  const profiles: AnonymousProfile[] = [];
  for (const identity of IDENTITIES) {
    const persona = identity.persona;
    const profile = found.get(persona.username.toLowerCase());
    if (!profile?.id) continue;

    const { data: saved, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: profile.id,
          username: persona.username,
          full_name: persona.fullName,
          bio: persona.description,
          avatar_url: '',
          location: identity.location,
          artistic_disciplines: 'Cultura Hip-Hop',
          role: 'user',
          is_banned: false,
        },
        { onConflict: 'id' }
      )
      .select('id, username, full_name')
      .single();

    if (profileError || !saved) {
      console.warn(
        `[anonymous-users] No se pudo guardar el perfil ${persona.username}:`,
        profileError?.message
      );
      continue;
    }

    profiles.push(toAnonymousProfile(saved, persona));
  }

  cache = profiles;
  return cache;
}
