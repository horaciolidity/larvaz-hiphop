import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ensureAnonymousProfiles } from '@/lib/anonymous-users';
import {
  getSuggestedNpcComments,
  randomSeed,
  TestCommentTone,
} from '@/lib/test-comments';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TONES: TestCommentTone[] = ['mixed', 'positive', 'interest', 'refutation'];

const LIMITS = {
  likes: 5000,
  comments: 60,
  shares: 5000,
  saves: 5000,
  views: 100000,
};

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function clampInt(value: unknown, max: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(max, Math.floor(num));
}

function readRawMetadata(row: any): Record<string, any> {
  const meta = Array.isArray(row?.post_metadata) ? row.post_metadata[0] : row?.post_metadata;
  const raw = meta?.raw_metadata;
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json().catch(() => ({}));
    const postId = String(body?.post_id || '');

    if (!isUUID(postId)) {
      return NextResponse.json({ error: 'Seleccioná una publicación válida.' }, { status: 400 });
    }

    const likes = clampInt(body?.likes, LIMITS.likes);
    const comments = clampInt(body?.comments, LIMITS.comments);
    const shares = clampInt(body?.shares, LIMITS.shares);
    const saves = clampInt(body?.saves, LIMITS.saves);
    const views = clampInt(body?.views, LIMITS.views);
    const tone: TestCommentTone = TONES.includes(body?.tone) ? body.tone : 'mixed';

    if (likes + comments + shares + saves + views === 0) {
      return NextResponse.json(
        { error: 'Indicá al menos una cantidad mayor a cero.' },
        { status: 400 }
      );
    }

    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, likes_count, comments_count, post_metadata(*)')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }
    if (!post) {
      return NextResponse.json({ error: 'La publicación no existe.' }, { status: 404 });
    }

    let likesCount = Number(post.likes_count || 0);

    // ── Likes (Props) ────────────────────────────────────────────────────
    if (likes > 0) {
      likesCount += likes;
      const { error } = await supabaseAdmin
        .from('posts')
        .update({ likes_count: likesCount })
        .eq('id', postId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // ── Comentarios anónimos ─────────────────────────────────────────────
    const insertedComments: Array<{
      id: string;
      content: string;
      author_name: string;
      username: string;
      persona_id: string;
      persona_label: string;
    }> = [];
    let commentsCount = Number(post.comments_count || 0);

    if (comments > 0) {
      const anonymous = await ensureAnonymousProfiles();
      if (anonymous.length === 0) {
        return NextResponse.json(
          { error: 'No se pudieron preparar los perfiles anónimos de prueba.' },
          { status: 500 }
        );
      }

      const suggestions = getSuggestedNpcComments(comments, tone, randomSeed());
      const byPersona = new Map(anonymous.map((profile) => [profile.persona_id, profile]));
      const byId = new Map(anonymous.map((profile) => [profile.id, profile]));

      const rows = suggestions.map((suggestion, index) => {
        const author =
          byPersona.get(suggestion.persona_id) || anonymous[index % anonymous.length];
        return {
          post_id: postId,
          user_id: author.id,
          content: suggestion.text,
        };
      });

      for (let i = 0; i < rows.length; i += 25) {
        const chunk = rows.slice(i, i + 25);
        const { data, error } = await supabaseAdmin
          .from('comments')
          .insert(chunk)
          .select('id, content, user_id');

        if (error) {
          return NextResponse.json(
            { error: `No se pudieron insertar los comentarios: ${error.message}` },
            { status: 500 }
          );
        }

        for (const inserted of data || []) {
          const author = byId.get(String(inserted.user_id));
          insertedComments.push({
            id: String(inserted.id),
            content: String(inserted.content),
            author_name: author?.full_name || 'Anónimo',
            username: author?.username || 'anonimo_muro',
            persona_id: author?.persona_id || 'callejero',
            persona_label: author?.persona_label || 'Callejero',
          });
        }
      }

      // Recontamos para que el número del feed coincida con las filas reales.
      const { count } = await supabaseAdmin
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('is_hidden', false);

      if (typeof count === 'number') {
        commentsCount = count;
        await supabaseAdmin
          .from('posts')
          .update({ comments_count: commentsCount })
          .eq('id', postId);
      } else {
        commentsCount += insertedComments.length;
      }
    }

    // ── Compartidos, guardados y vistas (post_metadata.raw_metadata) ─────
    const metaRow = Array.isArray(post.post_metadata)
      ? post.post_metadata[0]
      : post.post_metadata;
    const rawMetadata = readRawMetadata(post);
    const viewsCount = Number(rawMetadata.views_count || 0) + views;
    const sharesCount = Number(rawMetadata.shares_count || 0) + shares;
    const bookmarksCount = Number(rawMetadata.bookmarks_count || 0) + saves;

    if (shares > 0 || saves > 0 || views > 0) {
      const nextRawMetadata = {
        ...rawMetadata,
        views_count: viewsCount,
        shares_count: sharesCount,
        bookmarks_count: bookmarksCount,
        last_test_reactions_at: new Date().toISOString(),
        last_test_reactions_by: auth.profile.username,
      };

      if (metaRow?.id) {
        const { error } = await supabaseAdmin
          .from('post_metadata')
          .update({ raw_metadata: nextRawMetadata })
          .eq('id', metaRow.id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        const { error } = await supabaseAdmin.from('post_metadata').insert({
          post_id: postId,
          raw_metadata: nextRawMetadata,
        });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      applied: { likes, comments, shares, saves, views, tone },
      counters: {
        likes_count: likesCount,
        comments_count: commentsCount,
        views_count: viewsCount,
        shares_count: sharesCount,
        bookmarks_count: bookmarksCount,
      },
      comments: insertedComments,
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
