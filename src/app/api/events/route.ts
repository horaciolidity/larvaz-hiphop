import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_USER_ID = '00000000-0000-0000-0000-000000000001';

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function resolveOrganizerId(params: {
  organizer_id?: string;
  organizer_username?: string;
  organizer_name?: string;
  organizer_avatar?: string;
}): Promise<string> {
  const cleanUsername = (params.organizer_username || '').toLowerCase().trim();
  let finalUserId: string | null = null;

  if (params.organizer_id && isUUID(params.organizer_id)) {
    finalUserId = params.organizer_id;
  }

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

  if (finalUserId && finalUserId !== FALLBACK_USER_ID) {
    const { data: existingProf } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', finalUserId)
      .maybeSingle();

    if (!existingProf) {
      const autoName = params.organizer_name || cleanUsername || 'Organizador Larvaz';
      const autoUser = cleanUsername || 'user_' + finalUserId.substring(0, 6);
      const { error: profErr } = await supabaseAdmin.from('profiles').upsert({
        id: finalUserId,
        username: autoUser,
        full_name: autoName,
        avatar_url: params.organizer_avatar || '',
        role: 'user',
        is_banned: false,
        created_at: new Date().toISOString(),
      });
      if (profErr) {
        finalUserId = FALLBACK_USER_ID;
      }
    }
  } else if (!finalUserId) {
    finalUserId = FALLBACK_USER_ID;
  }

  return finalUserId;
}

export async function GET() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*, profiles(*)')
      .order('start_date', { ascending: true })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { events: events || [] },
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
      organizer_id,
      organizer_username,
      organizer_name,
      organizer_avatar,
      title,
      slug,
      description,
      flyer_url,
      start_date,
      end_date,
      timezone,
      location,
      is_online,
      ticket_url,
      tags,
      created_at,
    } = body;

    if (!title?.trim() || !description?.trim() || !start_date || !location?.trim()) {
      return NextResponse.json(
        { error: 'title, description, start_date y location son requeridos' },
        { status: 400 }
      );
    }

    const finalOrganizerId = await resolveOrganizerId({
      organizer_id,
      organizer_username,
      organizer_name,
      organizer_avatar,
    });

    const cleanSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
        '-' +
        Date.now().toString().slice(-4);

    const insertPayload: Record<string, any> = {
      organizer_id: finalOrganizerId,
      title: title.trim(),
      slug: cleanSlug,
      description: description.trim(),
      flyer_url:
        flyer_url?.trim() ||
        'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=1000&fit=crop',
      start_date,
      end_date: end_date || null,
      timezone: timezone || 'America/Argentina/Buenos_Aires',
      location: location.trim(),
      is_online: Boolean(is_online),
      organizer_name: (organizer_name || organizer_username || 'Comunidad Larvaz').trim(),
      ticket_url: ticket_url?.trim() || null,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : ['hiphop', 'cultura'],
    };

    if (id && isUUID(id)) {
      insertPayload.id = id;
    }
    if (created_at) {
      insertPayload.created_at = created_at;
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('events')
      .upsert(insertPayload, { onConflict: 'slug' })
      .select('*, profiles(*)')
      .single();

    if (error) {
      console.error('[API /events] Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: inserted });
  } catch (err: any) {
    console.error('[API /events] Unexpected error:', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (id && isUUID(id)) {
      const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (slug) {
      const { error } = await supabaseAdmin.from('events').delete().eq('slug', slug);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'id o slug requerido' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

