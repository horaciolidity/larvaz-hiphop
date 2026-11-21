import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/api-auth';
import { isUUID, resolveDbUserId, FALLBACK_USER_ID } from '@/lib/profile-server';
import { resolveIpfsUrl } from '@/lib/media-utils';
import { normalizeDisciplines } from '@/lib/disciplines';
import { toDbPostId } from '@/lib/post-id';

export const dynamic = 'force-dynamic';

function cleanAvatar(value: unknown): string {
  if (!value || typeof value !== 'string') return '';
  const resolved = resolveIpfsUrl(value.trim());
  if (resolved.startsWith('emoji:') || resolved.startsWith('/')) return resolved;
  try {
    const url = new URL(resolved);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function mapComment(row: any) {
  const profile = row.profiles || null;
  const snapshot =
    row.author_snapshot && typeof row.author_snapshot === 'object'
      ? row.author_snapshot
      : null;

  const base = snapshot || profile || {};
  return {
    id: String(row.id),
    post_id: String(row.post_id),
    user_id: snapshot?.id || row.user_id,
    content: row.content,
    is_hidden: Boolean(row.is_hidden),
    created_at: row.created_at,
    author: {
      id: base.id || row.user_id,
      username: base.username || 'artista',
      full_name: base.full_name || base.username || 'Artista Larvaz',
      avatar_url: base.avatar_url || '',
      location: base.location || '',
      artistic_disciplines: base.artistic_disciplines || '',
      disciplines: normalizeDisciplines(base.disciplines),
      role: base.role || profile?.role || 'user',
      is_banned: Boolean(base.is_banned ?? profile?.is_banned),
      created_at: base.created_at || row.created_at,
    },
  };
}

/**
 * Algunas bases todavía tienen `comments.post_id` con FK a `posts.id`.
 * Para que los comentarios de las publicaciones semilla (post-1, post-2...)
 * persistan igual, creamos una fila puente oculta en `posts`. No aparece en
 * el muro (is_hidden) y sólo existe para satisfacer la relación.
 */
async function ensureSeedPostRow(dbPostId: string) {
  try {
    const { data: existing } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('id', dbPostId)
      .maybeSingle();
    if (existing?.id) return;

    const { error } = await supabaseAdmin.from('posts').insert({
      id: dbPostId,
      user_id: FALLBACK_USER_ID,
      external_url: 'https://larvaz-hiphop.vercel.app',
      provider: 'generic',
      content_type: 'link',
      description: 'Publicación del muro comunitario',
      tags: ['hiphop'],
      is_hidden: true,
      created_at: new Date().toISOString(),
    });
    if (error && !/duplicate key/i.test(error.message || '')) {
      console.warn('[comments] No se pudo crear la fila puente del post:', error.message);
    }
  } catch {
    // Si falla, el insert del comentario devolverá el error real.
  }
}

function hasBearer(req: NextRequest): boolean {
  return /^Bearer\s+.+$/i.test(req.headers.get('authorization') || '');
}

/**
 * Columnas de comentarios con degradación progresiva: algunas bases todavía
 * no tienen `author_snapshot` ni `profiles.disciplines`. Probamos de la más
 * completa a la más compatible para no perder información.
 */
const COMMENT_SELECTS = [
  'id, post_id, user_id, content, is_hidden, created_at, author_snapshot, profiles(id, username, full_name, avatar_url, role, is_banned, created_at, artistic_disciplines, disciplines)',
  'id, post_id, user_id, content, is_hidden, created_at, author_snapshot, profiles(id, username, full_name, avatar_url, role, is_banned, created_at)',
  'id, post_id, user_id, content, is_hidden, created_at, profiles(id, username, full_name, avatar_url, role, is_banned, created_at)',
];

function isSchemaError(message: string | undefined): boolean {
  return /author_snapshot|disciplines|column .* does not exist|schema cache|could not find the .* column/i.test(
    message || ''
  );
}

async function fetchCommentById(id: string) {
  let lastError: string | undefined;
  for (const select of COMMENT_SELECTS) {
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(select)
      .eq('id', id)
      .maybeSingle();
    if (!error) return data as any;
    lastError = error.message;
    if (!isSchemaError(error.message)) break;
  }
  if (lastError) console.warn('[comments] No se pudo releer el comentario:', lastError);
  return null;
}

/**
 * Mantiene posts.comments_count alineado con la tabla de comentarios.
 * Antes dependía de un trigger que no siempre existe; así el número que ve
 * el resto de la comunidad es siempre el real.
 */
async function syncPostCommentCount(dbPostId: string) {
  try {
    const { count } = await supabaseAdmin
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', dbPostId)
      .eq('is_hidden', false);

    if (typeof count === 'number') {
      await supabaseAdmin
        .from('posts')
        .update({ comments_count: count })
        .eq('id', dbPostId);
    }
  } catch {
    // El conteo se recalcula en /api/feed de todos modos.
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id') || '';

    if (!postId) {
      return NextResponse.json({ comments: [] });
    }

    // Los posts semilla (post-1, post-2...) se guardan con un UUID
    // determinista para que sus comentarios también persistan.
    const dbPostId = toDbPostId(postId);

    let data: any[] | null = null;
    let error: { message?: string } | null = null;

    for (const select of COMMENT_SELECTS) {
      const result = await supabaseAdmin
        .from('comments')
        .select(select)
        .eq('post_id', dbPostId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });
      data = result.data as any;
      error = result.error;
      if (!error) break;
      if (!isSchemaError(error.message)) break;
    }

    if (error) {
      // comments.post_id todavía es UUID en bases sin migrar.
      if (/invalid input syntax for type uuid/i.test(error.message || '')) {
        return NextResponse.json({ comments: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        comments: (data || []).map((row: any) => ({
          ...mapComment(row),
          // Devolvemos siempre el id original del muro para que el cliente
          // sepa a qué publicación pertenece el comentario.
          post_id: postId,
        })),
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const postId = String(body?.post_id || '');
    const content = String(body?.content || '').trim();

    if (!postId) {
      return NextResponse.json({ error: 'Publicación inválida.' }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: 'Escribí un comentario.' }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: 'El comentario es demasiado largo (máx. 1000).' }, { status: 400 });
    }

    // 1. Si viene un token, la identidad la manda Supabase Auth.
    // 2. Si no viene token (cuentas locales de Larvaz), usamos el snapshot
    //    del autor que envía el cliente. Es el mismo criterio que usa /api/post.
    let authorId: string;
    let authorSnapshot: Record<string, any>;

    if (hasBearer(req)) {
      const auth = await requireUser(req);
      if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
      authorId = auth.user.id;
      authorSnapshot = {
        id: auth.user.id,
        username: auth.profile.username,
        full_name: auth.profile.full_name,
        avatar_url: auth.profile.avatar_url || '',
        location: auth.profile.location || '',
        artistic_disciplines: auth.profile.artistic_disciplines || '',
        disciplines: auth.profile.disciplines || [],
        role: auth.profile.role || 'user',
        created_at: auth.profile.created_at,
      };
    } else {
      const authorUsername = String(body?.author_username || body?.username || '').trim();
      authorId = await resolveDbUserId({
        user_id: body?.user_id,
        username: authorUsername,
        author_name: body?.author_name,
        author_avatar: body?.author_avatar,
        author_location: body?.author_location,
        author_disciplines: body?.author_disciplines,
      });
      authorSnapshot = {
        id: body?.user_id || authorId,
        username: authorUsername || 'artista',
        full_name: body?.author_name || authorUsername || 'Artista Larvaz',
        avatar_url: cleanAvatar(body?.author_avatar),
        location: body?.author_location || '',
        artistic_disciplines: body?.author_disciplines || '',
        disciplines: normalizeDisciplines(body?.author_disciplines_list),
        role: 'user',
      };
    }

    // La publicación debe existir cuando es un UUID real. Los posts de demo
    // (post-1, post-2...) viven en el store compartido y usan un UUID
    // determinista para que sus comentarios también se guarden.
    const dbPostId = toDbPostId(postId);
    let postUserId: string | null = null;
    if (isUUID(postId)) {
      const { data: post, error: postError } = await supabaseAdmin
        .from('posts')
        .select('id, user_id')
        .eq('id', postId)
        .maybeSingle();

      if (postError || !post) {
        return NextResponse.json({ error: 'La publicación no existe.' }, { status: 404 });
      }
      postUserId = post.user_id;
    }

    const baseCommentRow = { post_id: dbPostId, user_id: authorId, content };
    const rowWithSnapshot: Record<string, any> = {
      ...baseCommentRow,
      author_snapshot: authorSnapshot,
    };

    let withSnapshot = true;
    let insertResult = await supabaseAdmin
      .from('comments')
      .insert(rowWithSnapshot)
      .select('id')
      .single();

    // Base sin migrar: reintentamos sin author_snapshot.
    if (insertResult.error && isSchemaError(insertResult.error.message)) {
      withSnapshot = false;
      insertResult = await supabaseAdmin
        .from('comments')
        .insert(baseCommentRow)
        .select('id')
        .single();
    }

    // Bases donde comments.post_id todavía tiene FK a posts(id): creamos la
    // fila puente oculta sólo si la relación realmente lo exige. Después de
    // aplicar la migración esto nunca se ejecuta.
    if (insertResult.error && /foreign key|comments_post_id_fkey/i.test(insertResult.error.message || '')) {
      await ensureSeedPostRow(dbPostId);
      insertResult = await supabaseAdmin
        .from('comments')
        .insert(withSnapshot ? rowWithSnapshot : baseCommentRow)
        .select('id')
        .single();
    }

    if (insertResult.error) {
      return NextResponse.json({ error: insertResult.error.message }, { status: 500 });
    }

    const insertedId = String((insertResult.data as any)?.id || '');
    const savedRow =
      (insertedId && (await fetchCommentById(insertedId))) || {
        id: insertedId,
        ...baseCommentRow,
        is_hidden: false,
        created_at: new Date().toISOString(),
        author_snapshot: withSnapshot ? authorSnapshot : null,
      };
    const data = savedRow;

    void syncPostCommentCount(dbPostId);

    // Notificación para el autor (sin bloquear la respuesta si falla).
    if (postUserId && postUserId !== authorId && isUUID(postUserId)) {
      void (async () => {
        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: postUserId,
            actor_id: authorId,
            type: 'comment',
            post_id: postId,
          });
        } catch {
          // la notificación es opcional
        }
      })();
    }

    return NextResponse.json({
      success: true,
      comment: { ...mapComment(data), post_id: postId },
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    const localUserId = searchParams.get('user_id') || '';

    if (!isUUID(id)) {
      return NextResponse.json({ error: 'Comentario inválido.' }, { status: 400 });
    }

    let requesterId: string | null = null;
    let requesterRole = 'user';
    if (hasBearer(req)) {
      const auth = await requireUser(req);
      if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
      requesterId = auth.user.id;
      requesterRole = auth.profile.role || 'user';
    } else if (localUserId) {
      requesterId = localUserId;
    }

    if (!requesterId) {
      return NextResponse.json({ error: 'Necesitás iniciar sesión.' }, { status: 401 });
    }

    const commentSelect = 'id, user_id, post_id, author_snapshot';
    const commentLegacySelect = 'id, user_id, post_id';

    let { data: comment, error: findError } = await supabaseAdmin
      .from('comments')
      .select(commentSelect)
      .eq('id', id)
      .maybeSingle();

    // Base sin migrar: la columna author_snapshot todavía no existe.
    if (findError && /author_snapshot|column .* does not exist/i.test(findError.message || '')) {
      const retry = await supabaseAdmin
        .from('comments')
        .select(commentLegacySelect)
        .eq('id', id)
        .maybeSingle();
      comment = retry.data as any;
      findError = retry.error;
    }

    if (findError || !comment) {
      return NextResponse.json({ error: 'El comentario no existe.' }, { status: 404 });
    }

    const snapshotId = (comment as any)?.author_snapshot?.id;
    const canDelete =
      comment.user_id === requesterId ||
      snapshotId === requesterId ||
      requesterRole === 'admin' ||
      requesterRole === 'super_admin';

    if (!canDelete) {
      return NextResponse.json({ error: 'No podés eliminar este comentario.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('comments').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const deletedPostId = String((comment as any).post_id || '');
    if (deletedPostId) void syncPostCommentCount(deletedPostId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
