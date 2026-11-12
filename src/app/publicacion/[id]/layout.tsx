import type { Metadata } from 'next';
import { loadPostForServer } from '@/lib/post-server';

const FALLBACK_SITE = 'https://larvaz-hiphop.vercel.app';
const FALLBACK_OG = '/og-larvaz.jpg';
const FALLBACK_OG_ALT =
  'LARVAZ HIP HOP — logotipo dorado con corona y micrófono sobre fondo negro';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE).replace(/\/+$/, '');
}

async function loadPost(id: string) {
  return loadPostForServer(id);
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

  // Imagen social generada al vuelo: portada de la publicación + logo Larvaz.
  const shareImage = `${siteUrl()}/api/og?post=${encodeURIComponent(id)}`;

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
          url: shareImage,
          width: 1200,
          height: 630,
          type: 'image/png',
          alt: `Publicación de ${author} en LARVAZ HIP-HOP`,
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
      images: [shareImage],
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
