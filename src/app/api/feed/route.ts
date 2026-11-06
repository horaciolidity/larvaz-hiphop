import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CHAT_RELAY_POST_ID = '36f632cc-0195-46fb-ae22-ce2dea03376c';

export async function GET(req: NextRequest) {
  try {
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(
        '*, profiles(*), post_metadata(*), comments(id, post_id, user_id, content, is_hidden, created_at, profiles(id, username, full_name, avatar_url, role))'
      )
      .neq('id', CHAT_RELAY_POST_ID) // excluir el relay de chat
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(150);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { posts: posts || [] },
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
