import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const CHAT_RELAY_POST_ID = '36f632cc-0195-46fb-ae22-ce2dea03376c';

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sender_id, sender_username, recipient_id, recipient_username, text, conv_id } = body;

    if (!sender_id || !recipient_id || !text?.trim()) {
      return NextResponse.json({ error: 'sender_id, recipient_id y text son requeridos' }, { status: 400 });
    }

    // Ensure database comment row has a valid UUID for the foreign key
    let dbUserId = isUUID(sender_id) ? sender_id : null;
    if (!dbUserId && sender_username) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('username', sender_username.trim())
        .maybeSingle();
      if (prof?.id && isUUID(prof.id)) dbUserId = prof.id;
    }
    if (!dbUserId) {
      dbUserId = '00000000-0000-0000-0000-000000000001';
    }

    const msg_id = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const payload = {
      msg_id,
      conv_id: conv_id || [sender_id, recipient_id].sort().join('_'),
      sender_id,
      sender_username,
      recipient_id,
      recipient_username,
      text: text.trim(),
      ts: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: CHAT_RELAY_POST_ID,
        user_id: dbUserId,
        content: JSON.stringify(payload),
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[API /chat] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      msg_id,
      comment_id: data.id,
      ts: data.created_at,
      message: payload,
    });
  } catch (err: any) {
    console.error('[API /chat] Unexpected error:', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conv_id = searchParams.get('conv_id');
    const user_id = searchParams.get('user_id');
    const username = searchParams.get('username')?.toLowerCase()?.trim();
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Fetch messages from the relay
    const { data, error } = await supabaseAdmin
      .from('comments')
      .select('id, content, created_at')
      .eq('post_id', CHAT_RELAY_POST_ID)
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse messages
    let messages = (data || [])
      .map((row: any) => {
        try {
          const parsed = JSON.parse(row.content);
          return {
            ...parsed,
            comment_id: row.id,
            db_ts: row.created_at,
            // Normalizar text y ts si el mensaje viejo tenía content/created_at
            text: parsed.text || parsed.content || '',
            ts: parsed.ts || parsed.created_at || row.created_at,
          };
        } catch {
          return null;
        }
      })
      .filter((m: any) => m && m.conv_id && m.text);

    // Filter by conv_id if provided
    if (conv_id && conv_id !== 'all') {
      messages = messages.filter((m: any) => m.conv_id === conv_id);
    }

    // Filter by user_id or username if provided (sender or recipient)
    if (user_id || username) {
      messages = messages.filter((m: any) => {
        const matchId =
          user_id &&
          (m.sender_id === user_id || m.recipient_id === user_id);
        const matchUsername =
          username &&
          (m.sender_username?.toLowerCase() === username ||
            m.recipient_username?.toLowerCase() === username);
        return matchId || matchUsername;
      });
    }

    // Return in chronological order (oldest first for display)
    messages = messages.slice(0, limit).reverse();

    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

