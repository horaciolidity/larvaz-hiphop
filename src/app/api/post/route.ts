import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, description, content_type, tags, external_url, normalized_url, provider, metadata } = body;

    if (!user_id || !description) {
      return NextResponse.json({ error: 'user_id y description son requeridos' }, { status: 400 });
    }

    const allowedTypes = ['music', 'video', 'visual_art', 'link'];
    const safeContentType = allowedTypes.includes(content_type) ? content_type : 'link';

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id,
        description,
        content_type: safeContentType,
        tags: tags || [],
        external_url: external_url || 'https://larvaz-hiphop.vercel.app',
        normalized_url: normalized_url || null,
        provider: provider || 'generic',
        metadata: metadata || null,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[API /post] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id, created_at: data.created_at });
  } catch (err: any) {
    console.error('[API /post] Unexpected error:', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

