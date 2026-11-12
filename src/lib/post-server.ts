import { supabaseAdmin } from '@/lib/supabase/admin';
import { INITIAL_POSTS } from '@/lib/data-store';
import { mapDbPostToPost } from '@/lib/post-mapper';
import { resolveIpfsUrl } from '@/lib/media-utils';
import type { Post } from '@/types';

export function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Carga una publicación desde Supabase o, si es de demo, desde el store inicial. */
export async function loadPostForServer(id: string): Promise<Post | null> {
  if (isUUID(id)) {
    try {
      const { data } = await supabaseAdmin
        .from('posts')
        .select('*, profiles(*), post_metadata(*)')
        .eq('id', id)
        .maybeSingle();

      if (data) return mapDbPostToPost(data);
    } catch {
      // sigue con los datos locales
    }
  }

  return INITIAL_POSTS.find((p) => p.id === id) || null;
}

/** URL absoluta de la portada de una publicación (o null). */
export function getPostCoverUrl(post: Post, siteUrl: string): string | null {
  const media = post.media || [];
  const raw =
    post.metadata?.thumbnail_url ||
    media.find((m) => m.type === 'image')?.url ||
    media.find((m) => m.poster)?.poster ||
    '';

  if (!raw || raw.startsWith('data:')) return null;

  const resolved = resolveIpfsUrl(raw);
  if (!resolved) return null;
  if (resolved.startsWith('https://') || resolved.startsWith('http://')) return resolved;
  if (resolved.startsWith('/')) return `${siteUrl.replace(/\/+$/, '')}${resolved}`;
  return null;
}
