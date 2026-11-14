import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Identidades anónimas para las pruebas de interacción.
 *
 * La tabla comments exige un user_id que exista en profiles, y profiles
 * referencia auth.users. Por eso el modo de pruebas crea (una sola vez)
 * estas cuentas técnicas sin acceso real: no se publican credenciales y
 * se usan únicamente para firmar comentarios anónimos.
 */
const ANONYMOUS_IDENTITIES = [
  {
    username: 'anonimo_muro',
    fullName: 'Anónimo',
    email: 'anonimo.muro@larvaz.local',
    location: 'Comunidad Larvaz',
  },
  {
    username: 'anonima_muro',
    fullName: 'Anónima',
    email: 'anonima.muro@larvaz.local',
    location: 'Comunidad Larvaz',
  },
  {
    username: 'oyente_anonimo',
    fullName: 'Oyente anónimo',
    email: 'oyente.anonimo@larvaz.local',
    location: 'Comunidad Larvaz',
  },
  {
    username: 'barras_anonimas',
    fullName: 'Barras anónimas',
    email: 'barras.anonimas@larvaz.local',
    location: 'Comunidad Larvaz',
  },
];

export interface AnonymousProfile {
  id: string;
  username: string;
  full_name: string;
}

let cache: AnonymousProfile[] | null = null;

function isMissingTableError(message?: string): boolean {
  return Boolean(message && /does not exist|schema cache/i.test(message));
}

/**
 * Garantiza que existan los perfiles anónimos y los devuelve.
 * Si Supabase no está disponible devuelve una lista vacía.
 */
export async function ensureAnonymousProfiles(): Promise<AnonymousProfile[]> {
  if (cache && cache.length > 0) return cache;

  const usernames = ANONYMOUS_IDENTITIES.map((identity) => identity.username);
  const { data: existing, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name')
    .in('username', usernames);

  if (error && !isMissingTableError(error.message)) {
    console.warn('[anonymous-users] No se pudieron leer los perfiles:', error.message);
  }

  const found = new Map<string, AnonymousProfile>(
    (existing || []).map((profile: any) => [
      String(profile.username).toLowerCase(),
      {
        id: String(profile.id),
        username: String(profile.username),
        full_name: String(profile.full_name),
      },
    ])
  );

  const missing = ANONYMOUS_IDENTITIES.filter(
    (identity) => !found.has(identity.username.toLowerCase())
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
            username: identity.username,
            full_name: identity.fullName,
            anonymous_test: true,
          },
        });

        if (createError || !created.user) {
          console.warn(
            `[anonymous-users] No se pudo crear ${identity.username}:`,
            createError?.message
          );
          continue;
        }
        authUser = created.user;
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: authUser.id,
            username: identity.username,
            full_name: identity.fullName,
            bio: 'Comentario anónimo de prueba. Sin registro público.',
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

      if (profileError || !profile) {
        console.warn(
          `[anonymous-users] No se pudo guardar el perfil ${identity.username}:`,
          profileError?.message
        );
        continue;
      }

      found.set(identity.username.toLowerCase(), {
        id: String(profile.id),
        username: String(profile.username),
        full_name: String(profile.full_name),
      });
    }
  }

  cache = Array.from(found.values());
  return cache;
}
