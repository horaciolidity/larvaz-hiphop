import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getStorageStats, readPlatformSettings } from '@/lib/settings-store';

export const dynamic = 'force-dynamic';

async function countRows(table: string, filter?: (query: any) => any): Promise<number> {
  try {
    let query = supabaseAdmin.from(table).select('id', { count: 'exact', head: true });
    if (filter) query = filter(query);
    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [users, posts, comments, events, pendingReports, storage, settings] = await Promise.all([
      countRows('profiles'),
      countRows('posts', (q) => q.eq('is_hidden', false)),
      countRows('comments'),
      countRows('events'),
      countRows('reports', (q) => q.eq('status', 'pending')),
      getStorageStats(),
      readPlatformSettings(),
    ]);

    return NextResponse.json(
      {
        counts: { users, posts, comments, events, pendingReports },
        storage,
        settings,
        generatedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
