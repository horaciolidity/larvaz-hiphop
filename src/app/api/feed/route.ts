import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const CHAT_RELAY_POST_ID = '36f632cc-0195-46fb-ae22-ce2dea03376c';

export async function GET(req: NextRequest) {
  try {
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('*, profiles(*)')
      .neq('id', CHAT_RELAY_POST_ID)         // excluir el relay de chat
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

