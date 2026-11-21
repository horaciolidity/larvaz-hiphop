import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isUUID, resolveDbUserId } from '@/lib/profile-server';

export const dynamic = 'force-dynamic';

const PLACEHOLDER_URL = 'https://larvaz-hiphop.vercel.app';

/**
 * Incrementa un contador guardado en post_metadata.raw_metadata.
 * La tabla posts no tiene columnas de vistas/compartidos/guardados.
 */
async function bumpRawMetadataCounter(
  postId: string,
  key: 'views_count' | 'shares_count' | 'bookmarks_count',
  amount = 1
): Promise<{ value: number } | { error: string; status: number }> {
  const { data: row, error } = await supabaseAdmin
    .from('posts')
    .select('id, post_metadata(*)')
    .eq('id', postId)
    .maybeSingle();

  if (error) return { error: error.message, status: 500 };
  if (!row) return { error: 'La publicación no existe.', status: 404 };

  const meta = Array.isArray((row as any).post_metadata)
    ? (row as any).post_metadata[0]
    : (row as any).post_metadata;
  const raw =
    meta?.raw_metadata && typeof meta.raw_metadata === 'object' ? meta.raw_metadata : {};
  const value = Math.max(0, Number(raw[key] || 0) + amount);
  const nextRawMetadata = { ...raw, [key]: value };

  if (meta?.id) {
    const { error: updateError } = await supabaseAdmin
      .from('post_metadata')
      .update({ raw_metadata: nextRawMetadata })
      .eq('id', meta.id);
    if (updateError) return { error: updateError.message, status: 500 };
  } else {
    const { error: insertError } = await supabaseAdmin
      .from('post_metadata')
      .insert({ post_id: postId, raw_metadata: nextRawMetadata });
    if (insertError) return { error: insertError.message, status: 500 };
  }

  return { value };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !isUUID(id)) {
      return NextResponse.json({ error: 'id UUID válido requerido' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('posts')
      .select(
        '*, profiles(*), post_metadata(*), comments(id, post_id, user_id, content, is_hidden, created_at, profiles(id, username, full_name, avatar_url, role))'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Publicación no encontrada' }, { status: 404 });
    }

    return NextResponse.json(
      { post: data },
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      user_id,
      username,
      author_username,
      author_name,
      author_avatar,
      author_location,
      author_disciplines,
      disciplines,
      description,
      content_type,
      tags,
      external_url,
      normalized_url,
      provider,
      metadata,
      created_at,
    } = body;

    const cleanDesc = (description || '').trim();
    const rawExternalUrl = (external_url || '').trim();
    const hasRealExternalUrl = Boolean(rawExternalUrl && rawExternalUrl !== PLACEHOLDER_URL);

    if (!cleanDesc && !hasRealExternalUrl) {
      return NextResponse.json({ error: 'Se requiere una descripción o enlace multimedia' }, { status: 400 });
    }

    const cleanUsername = (author_username || username || '').toLowerCase().trim();
    const finalUserId = await resolveDbUserId({
      user_id,
      username: cleanUsername,
      author_name,
      author_avatar,
      author_location,
      author_disciplines,
    });

    // public.posts tiene CHECK (content_type IN ('music', 'video', 'visual_art', 'link'))
    const allowedDbTypes = ['music', 'video', 'visual_art', 'link'];
    const dbContentType = allowedDbTypes.includes(content_type) ? content_type : 'link';
    const realContentType = content_type || (hasRealExternalUrl ? 'link' : 'text');

    const insertPayload: Record<string, any> = {
      user_id: finalUserId,
      description: cleanDesc || `Compartiendo: ${rawExternalUrl}`,
      content_type: dbContentType,
      tags: Array.isArray(tags) ? tags : ['hiphop'],
      external_url: hasRealExternalUrl ? rawExternalUrl : PLACEHOLDER_URL,
      normalized_url: hasRealExternalUrl ? (normalized_url || rawExternalUrl) : null,
      provider: provider || 'generic',
    };

    if (id && isUUID(id)) {
      insertPayload.id = id;
    }
    if (created_at) {
      insertPayload.created_at = created_at;
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('posts')
      .upsert(insertPayload, { onConflict: 'id' })
      .select('*, profiles(*)')
      .single();

    if (error) {
      console.error('[API /post] Supabase posts insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Guardar metadatos y snapshot del autor real en public.post_metadata
    // Esto garantiza que cualquier publicación (texto o multimedia, usuario Supabase o local)
    // conserve su autor real, avatar, bandera de ubicación y tipo de contenido para TODOS los usuarios.
    const rawMetaPayload = {
      ...(metadata || {}),
      real_content_type: realContentType,
      has_external_url: hasRealExternalUrl,
      location: author_location || metadata?.location || 'Mendoza, Argentina',
      disciplines: Array.isArray(disciplines) ? disciplines : undefined,
      author: {
        id: user_id || finalUserId,
        username: cleanUsername || inserted?.profiles?.username || 'artista',
        full_name: author_name || inserted?.profiles?.full_name || cleanUsername || 'Artista Larvaz',
        avatar_url: author_avatar || inserted?.profiles?.avatar_url || '',
        location: author_location || inserted?.profiles?.location || metadata?.location || 'Mendoza, Argentina',
        artistic_disciplines: author_disciplines || inserted?.profiles?.artistic_disciplines || '',
        disciplines: Array.isArray(disciplines)
          ? disciplines
          : inserted?.profiles?.disciplines || undefined,
        role: inserted?.profiles?.role || 'user',
      },
    };

    const { data: metaRow, error: metaErr } = await supabaseAdmin
      .from('post_metadata')
      .upsert(
        {
          post_id: inserted.id,
          title: metadata?.title || null,
          author_name: metadata?.author_name || author_name || cleanUsername || null,
          thumbnail_url: metadata?.thumbnail_url || null,
          description: metadata?.description || null,
          embed_url: metadata?.embed_url || null,
          raw_metadata: rawMetaPayload,
        },
        { onConflict: 'post_id' }
      )
      .select('*')
      .maybeSingle();

    if (metaErr) {
      console.warn('[API /post] Error guardando post_metadata:', metaErr.message);
    }

    return NextResponse.json({
      success: true,
      post: {
        ...inserted,
        post_metadata: metaRow || {
          post_id: inserted.id,
          title: metadata?.title || null,
          author_name: metadata?.author_name || null,
          thumbnail_url: metadata?.thumbnail_url || null,
          embed_url: metadata?.embed_url || null,
          raw_metadata: rawMetaPayload,
        },
      },
    });
  } catch (err: any) {
    console.error('[API /post] Unexpected error:', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, action, user_id, username, author_name, author_avatar, content } = body;

    if (!post_id || !isUUID(post_id)) {
      return NextResponse.json({ error: 'post_id UUID válido es requerido' }, { status: 400 });
    }

    if (action === 'view' || action === 'share') {
      const key = action === 'view' ? 'views_count' : 'shares_count';
      const result = await bumpRawMetadataCounter(post_id, key, 1);
      if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(
        action === 'view'
          ? { success: true, views_count: result.value }
          : { success: true, shares_count: result.value }
      );
    }

    if (action === 'like' || action === 'unlike') {
      const { data: current } = await supabaseAdmin
        .from('posts')
        .select('likes_count')
        .eq('id', post_id)
        .maybeSingle();

      const nextLikes =
        action === 'like'
          ? (current?.likes_count || 0) + 1
          : Math.max(0, (current?.likes_count || 1) - 1);

      const { data: updated, error } = await supabaseAdmin
        .from('posts')
        .update({ likes_count: nextLikes })
        .eq('id', post_id)
        .select('id, likes_count')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, likes_count: updated.likes_count });
    }

    if (action === 'comment' && content?.trim()) {
      const finalUserId = await resolveDbUserId({
        user_id,
        username,
        author_name,
        author_avatar,
      });

      const { data: insertedComment, error } = await supabaseAdmin
        .from('comments')
        .insert({
          post_id,
          user_id: finalUserId,
          content: content.trim(),
        })
        .select('*, profiles(*)')
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, comment: insertedComment });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !isUUID(id)) {
      return NextResponse.json({ error: 'id UUID válido requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
