import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const ROLES = new Set(['user', 'moderator', 'admin', 'super_admin']);

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const userId = String(body?.user_id || '');
    const role = body?.role === undefined ? undefined : String(body.role);
    const isBanned = body?.is_banned === undefined ? undefined : Boolean(body.is_banned);

    if (!isUUID(userId)) {
      return NextResponse.json({ error: 'Usuario inválido.' }, { status: 400 });
    }
    if (userId === auth.user.id) {
      return NextResponse.json(
        { error: 'No podés cambiar tu propio rol o suspender tu propia cuenta.' },
        { status: 400 }
      );
    }
    if (role !== undefined && !ROLES.has(role)) {
      return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 });
    }

    const { data: target, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, is_banned')
      .eq('id', userId)
      .maybeSingle();

    if (findError || !target) {
      return NextResponse.json({ error: 'El usuario no existe.' }, { status: 404 });
    }
    if (target.role === 'super_admin' && auth.profile.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Solo un Super Admin puede modificar a otro Super Admin.' },
        { status: 403 }
      );
    }

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (role !== undefined) patch.role = role;
    if (isBanned !== undefined) patch.is_banned = isBanned;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
