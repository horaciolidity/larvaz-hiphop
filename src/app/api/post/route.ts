import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      username,
      author_username,
      description,
      content_type,
      tags,
      external_url,
      normalized_url,
      provider,
      metadata,
    } = body;

    if (!description?.trim()) {
      return NextResponse.json({ error: 'description es requerida' }, { status: 400 });
    }

    const cleanUsername = (author_username || username || '').toLowerCase().trim();
    let finalUserId: string | null = null;

    // 1. If user_id is already a valid UUID, verify or use it
    if (user_id && isUUID(user_id)) {
      finalUserId = user_id;
    }

    // 2. If not a valid UUID, resolve by username in profiles table
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

    // 3. Fallback: if still no UUID, use the system admin/community UUID
    if (!finalUserId) {
      finalUserId = '00000000-0000-0000-0000-000000000001';
    }

    const allowedTypes = ['music', 'video', 'visual_art', 'link'];
    const safeContentType = allowedTypes.includes(content_type) ? content_type : 'link';

    const { data: inserted, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: finalUserId,
        description: description.trim(),
        content_type: safeContentType,
        tags: Array.isArray(tags) ? tags : [],
        external_url: external_url || 'https://larvaz-hiphop.vercel.app',
        normalized_url: normalized_url || null,
        provider: provider || 'generic',
        metadata: metadata || null,
      })
      .select('*, profiles(*)')
      .single();

    if (error) {
      console.error('[API /post] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: inserted });
  } catch (err: any) {
    console.error('[API /post] Unexpected error:', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}


