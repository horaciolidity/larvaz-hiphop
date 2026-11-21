import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHAT_RELAY_POST_ID = '36f632cc-0195-46fb-ae22-ce2dea03376c';

export async function GET(req: NextRequest) {
  try {
    const selects = [
      '*, profiles(*), post_metadata(*), comments(id, post_id, user_id, content, is_hidden, created_at, author_snapshot, profiles(id, username, full_name, avatar_url, role, artistic_disciplines, disciplines))',
      '*, profiles(*), post_metadata(*), comments(id, post_id, user_id, content, is_hidden, created_at, author_snapshot, profiles(id, username, full_name, avatar_url, role))',
      '*, profiles(*), post_metadata(*), comments(id, post_id, user_id, content, is_hidden, created_at, profiles(id, username, full_name, avatar_url, role))',
    ];

    let posts: any[] | null = null;
    let error: { message?: string } | null = null;

    for (const select of selects) {
      const result = await supabaseAdmin
        .from('posts')
        .select(select)
        .neq('id', CHAT_RELAY_POST_ID) // excluir el relay de chat
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(150);
      posts = result.data as any;
      error = result.error;
      if (!error) break;
      if (!/author_snapshot|disciplines|column .* does not exist|schema cache|could not find the .* column/i.test(error.message || '')) {
        break;
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Contador global de comentarios por publicación. Incluye los posts de
    // demo (post-1, post-2...) que no viven en la tabla posts: así el número
    // de comentarios también se actualiza para todos los usuarios.
    const commentCounts: Record<string, number> = {};
    try {
      const { data: allComments } = await supabaseAdmin
        .from('comments')
        .select('post_id')
        .eq('is_hidden', false)
        .limit(5000);
      for (const row of allComments || []) {
        const key = String((row as any).post_id);
        commentCounts[key] = (commentCounts[key] || 0) + 1;
      }
    } catch {
      // Si la migración aún no está aplicada seguimos sin contadores extra.
    }

    const normalizedPosts = (posts || []).map((post: any) => ({
      ...post,
      // El conteo real manda sobre el valor que pueda estar desactualizado
      // en posts.comments_count.
      comments_count: commentCounts[String(post.id)] ?? 0,
    }));

    return NextResponse.json(
      { posts: normalizedPosts, comment_counts: commentCounts },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
