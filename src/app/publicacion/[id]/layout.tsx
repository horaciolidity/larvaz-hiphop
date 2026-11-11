import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { INITIAL_POSTS } from '@/lib/data-store';
import { mapDbPostToPost } from '@/lib/post-mapper';
import { normalizeMediaList } from '@/lib/media-utils';

const FALLBACK_SITE = 'https://larvaz-hiphop.vercel.app';
const FALLBACK_OG = '/og-larvaz.jpg';
const FALLBACK_OG_ALT =
  'LARVAZ HIP HOP — logotipo dorado con corona y micrófono sobre fondo negro';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE).replace(/\/+$/, '');
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function absoluteImage(url?: string): string {
  if (!url) return FALLBACK_OG;
  if (url.startsWith('data:')) return FALLBACK_OG;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${siteUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function loadPost(id: string) {
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

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const id = String(params?.id || '');
  const url = `${siteUrl()}/publicacion/${encodeURIComponent(id)}`;
  const post = await loadPost(id);

  if (!post) {
    return {
      title: 'Publicación no encontrada · LARVAZ HIP-HOP',
      alternates: { canonical: url },
      openGraph: {
        title: 'Publicación no encontrada · LARVAZ HIP-HOP',
        description: 'Esta publicación no existe o fue retirada del muro comunitario.',
        url,
        siteName: 'LARVAZ HIP-HOP',
        images: [
          {
            url: FALLBACK_OG,
            width: 1200,
            height: 630,
            type: 'image/jpeg',
            alt: FALLBACK_OG_ALT,
          },
        ],
        locale: 'es_LA',
        type: 'article',
      },
    };
  }

  const author = post.author?.full_name || post.author?.username || 'Artista Larvaz';
  const media =
    post.media && post.media.length > 0
      ? post.media
      : normalizeMediaList(post.metadata?.media);
  const coverSource =
    post.metadata?.thumbnail_url ||
    media.find((m) => m.type === 'image')?.url ||
    media.find((m) => m.poster)?.poster;
  const cover = absoluteImage(coverSource);

  const cleanDescription =
    (post.description || '').replace(/\s+/g, ' ').trim().slice(0, 180) ||
    `${author} compartió una publicación en LARVAZ HIP-HOP.`;

  const title = `${author} en LARVAZ HIP-HOP`;

  return {
    title,
    description: cleanDescription,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: cleanDescription,
      url,
      siteName: 'LARVAZ HIP-HOP',
      images: [
        {
          url: cover,
          width: 1200,
          height: 630,
          type: coverSource ? undefined : 'image/jpeg',
          alt: coverSource ? `Publicación de ${author} en Larvaz` : FALLBACK_OG_ALT,
        },
      ],
      locale: 'es_LA',
      type: 'article',
      publishedTime: post.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: cleanDescription,
      images: [cover],
    },
  };
}

export default function PublicacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
