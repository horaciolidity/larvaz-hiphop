import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function mapComment(row: any) {
  const profile = row.profiles || null;
  return {
    id: String(row.id),
    post_id: String(row.post_id),
    user_id: row.user_id,
    content: row.content,
    is_hidden: Boolean(row.is_hidden),
    created_at: row.created_at,
    author: profile
      ? {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url || '',
          role: profile.role || 'user',
          is_banned: Boolean(profile.is_banned),
          created_at: profile.created_at || row.created_at,
        }
      : {
          id: row.user_id,
          username: 'artista',
          full_name: 'Artista Larvaz',
          avatar_url: '',
          role: 'user',
          is_banned: false,
          created_at: row.created_at,
        },
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('post_id') || '';

    if (!isUUID(postId)) {
      return NextResponse.json({ comments: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('comments')
      .select(
        'id, post_id, user_id, content, is_hidden, created_at, profiles(id, username, full_name, avatar_url, role, is_banned, created_at)'
      )
      .eq('post_id', postId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { comments: (data || []).map(mapComment) },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const postId = String(body?.post_id || '');
    const content = String(body?.content || '').trim();

    if (!isUUID(postId)) {
      return NextResponse.json(
        { error: 'Esta publicación de demostración no admite comentarios persistentes.' },
        { status: 400 }
      );
    }
    if (!content) {
      return NextResponse.json({ error: 'Escribí un comentario.' }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: 'El comentario es demasiado largo (máx. 1000).' }, { status: 400 });
    }

    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      return NextResponse.json({ error: 'La publicación no existe.' }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: postId,
        user_id: auth.user.id,
        content,
      })
      .select(
        'id, post_id, user_id, content, is_hidden, created_at, profiles(id, username, full_name, avatar_url, role, is_banned, created_at)'
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notificación para el autor (sin bloquear la respuesta si falla).
    if (post.user_id && post.user_id !== auth.user.id) {
      void (async () => {
        try {
          await supabaseAdmin.from('notifications').insert({
            user_id: post.user_id,
            actor_id: auth.user.id,
            type: 'comment',
            post_id: postId,
          });
        } catch {
          // la notificación es opcional
        }
      })();
    }

    return NextResponse.json({ success: true, comment: mapComment(data) });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';

    if (!isUUID(id)) {
      return NextResponse.json({ error: 'Comentario inválido.' }, { status: 400 });
    }

    const { data: comment, error: findError } = await supabaseAdmin
      .from('comments')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (findError || !comment) {
      return NextResponse.json({ error: 'El comentario no existe.' }, { status: 404 });
    }

    const canDelete =
      comment.user_id === auth.user.id ||
      auth.profile.role === 'admin' ||
      auth.profile.role === 'super_admin';

    if (!canDelete) {
      return NextResponse.json({ error: 'No podés eliminar este comentario.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from('comments').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
