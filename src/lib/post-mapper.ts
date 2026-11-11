import type { ContentType, Post, Profile } from '@/types';
import { normalizeMediaList } from './media-utils';

/**
 * Convierte una fila de Supabase (posts + profiles + post_metadata) al modelo Post
 * que consume toda la interfaz. Se usa tanto en el feed global como en el detalle
 * de una publicación compartida por enlace.
 */
export function mapDbPostToPost(p: any): Post {
  const pm = Array.isArray(p?.post_metadata) ? p.post_metadata[0] : p?.post_metadata;
  const rawMeta = pm?.raw_metadata || p?.metadata || {};
  const savedAuthor = rawMeta?.author;

  const isFallbackDbUser =
    p?.user_id === '00000000-0000-0000-0000-000000000001' ||
    p?.profiles?.username === 'admin_demo';

  let author: Profile;
  if (savedAuthor && (isFallbackDbUser || !p?.profiles)) {
    author = {
      id: savedAuthor.id || p?.user_id,
      username: savedAuthor.username || 'artista',
      full_name: savedAuthor.full_name || savedAuthor.username || 'Artista Larvaz',
      avatar_url: savedAuthor.avatar_url || '',
      location: savedAuthor.location || rawMeta.location || 'Mendoza, Argentina',
      artistic_disciplines: savedAuthor.artistic_disciplines || '',
      role: savedAuthor.role || 'user',
      is_banned: false,
      created_at: p?.created_at,
    };
  } else if (p?.profiles) {
    author = {
      ...p.profiles,
      avatar_url: p.profiles.avatar_url || savedAuthor?.avatar_url || '',
      location: p.profiles.location || savedAuthor?.location || rawMeta.location || 'Mendoza, Argentina',
      artistic_disciplines: p.profiles.artistic_disciplines || savedAuthor?.artistic_disciplines || '',
    };
  } else {
    author = {
      id: p?.user_id,
      username: 'artista_' + (p?.user_id ? String(p.user_id).substring(0, 5) : 'comunitario'),
      full_name: 'Artista Comunitario',
      avatar_url: '',
      location: rawMeta.location || 'Mendoza, Argentina',
      role: 'user',
      is_banned: false,
      created_at: p?.created_at,
    };
  }

  const isPlaceholderUrl =
    !p?.external_url || p.external_url === 'https://larvaz-hiphop.vercel.app';
  const hasRealExternalUrl =
    rawMeta.has_external_url !== undefined
      ? Boolean(rawMeta.has_external_url)
      : !isPlaceholderUrl;

  const realContentType: ContentType =
    rawMeta.real_content_type ||
    (!hasRealExternalUrl ? 'text' : (p?.content_type || 'link'));

  const media = normalizeMediaList(
    Array.isArray(rawMeta.media) ? rawMeta.media : (Array.isArray(p?.media) ? p.media : [])
  );

  const thumbnailFromMedia =
    media.find((m) => m.type === 'image')?.url ||
    media.find((m) => m.poster)?.poster ||
    undefined;

  const postMeta = pm || rawMeta
    ? {
        title: pm?.title || rawMeta?.title || undefined,
        author_name: pm?.author_name || rawMeta?.author_name || undefined,
        thumbnail_url: pm?.thumbnail_url || rawMeta?.thumbnail_url || thumbnailFromMedia,
        description: pm?.description || rawMeta?.description || undefined,
        embed_url: pm?.embed_url || rawMeta?.embed_url || undefined,
        provider: p?.provider || rawMeta?.provider || 'generic',
        location: rawMeta?.location || author.location,
        media_type: rawMeta?.media_type || undefined,
        media,
      }
    : undefined;

  return {
    id: p?.id ? String(p.id) : 'post-' + p?.created_at,
    user_id: savedAuthor?.id || p?.user_id,
    external_url: hasRealExternalUrl ? p.external_url : undefined,
    normalized_url: hasRealExternalUrl ? (p.normalized_url || p.external_url) : undefined,
    provider: p?.provider || 'generic',
    content_type: realContentType,
    description: p?.description || '',
    tags: Array.isArray(p?.tags) ? p.tags : [],
    likes_count: p?.likes_count || 0,
    comments_count: p?.comments_count || 0,
    is_hidden: p?.is_hidden || false,
    created_at: p?.created_at,
    author,
    metadata: postMeta,
    media,
    user_has_liked: false,
    user_has_bookmarked: false,
    views_count: p?.views_count || 1,
  };
}
