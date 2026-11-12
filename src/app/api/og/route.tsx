import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { getPostCoverUrl, loadPostForServer } from '@/lib/post-server';

/**
 * Imagen social de una publicación: portada + logo Larvaz.
 *
 * Se ejecuta en Edge Runtime para que `next/og` funcione igual en Vercel
 * y en Windows (el runtime Node falla al cargar la fuente por defecto
 * cuando la ruta del proyecto tiene espacios).
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const FALLBACK_SITE = 'https://larvaz-hiphop.vercel.app';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE).replace(/\/+$/, '');
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const end = Math.min(i + chunk, bytes.length);
    let part = '';
    for (let j = i; j < end; j++) {
      part += String.fromCharCode(bytes[j]);
    }
    binary += part;
  }
  return btoa(binary);
}

async function fetchImageDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const buffer = new Uint8Array(await res.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 3 * 1024 * 1024) return null;

    return `data:${contentType.split(';')[0]};base64,${toBase64(buffer)}`;
  } catch {
    return null;
  }
}

function cleanText(value: string, max: number): string {
  const clean = (value || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const id = searchParams.get('post') || '';
  const post = id ? await loadPostForServer(id) : null;

  // El logo se pide al propio despliegue para no depender del filesystem
  // (el runtime Edge no puede leer archivos de `public/`).
  const logo = await fetchImageDataUrl(`${origin}/logo-larvaz.jpg`);
  const coverUrl = post ? getPostCoverUrl(post, siteUrl()) : null;
  const cover = await fetchImageDataUrl(coverUrl);

  const author = post?.author;
  const authorName = author?.full_name || author?.username || 'Artista Larvaz';
  const username = author?.username ? `@${author.username}` : '@larvazhiphop';

  const rawDescription = post?.description || '';
  const firstLine =
    rawDescription
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) || '';
  const title = cleanText(post?.metadata?.title || firstLine || 'Publicación en Larvaz', 78);
  const description =
    post?.metadata?.description && post.metadata.description !== title
      ? cleanText(post.metadata.description, 150)
      : cleanText(rawDescription.replace(firstLine, '').trim(), 150) ||
        'Cultura hip-hop, barras y comunidad en un solo muro.';

  const accent = '#C6FF00';
  const gold = '#F5C542';

  const brand = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {logo ? (
        <img
          src={logo}
          width={72}
          height={72}
          style={{ borderRadius: 14, border: '2px solid #3F3F46' }}
        />
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', color: accent, fontSize: 26, fontWeight: 900, letterSpacing: 2 }}>
          LARVAZ HIP-HOP
        </div>
        <div style={{ display: 'flex', color: '#71717A', fontSize: 18 }}>Cultura urbana · Comunidad</div>
      </div>
    </div>
  );

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', color: gold, fontSize: 21, fontWeight: 700 }}>{username}</div>
      <div style={{ display: 'flex', color: '#71717A', fontSize: 18 }}>larvaz-hiphop.vercel.app</div>
    </div>
  );

  const content = cover ? (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#09090B',
        padding: 44,
        gap: 38,
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: 500,
          height: 542,
          borderRadius: 24,
          overflow: 'hidden',
          border: `3px solid ${accent}`,
          background: '#18181B',
        }}
      >
        <img src={cover} width={500} height={542} style={{ objectFit: 'cover' }} />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {brand}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 45,
              lineHeight: 1.12,
              fontWeight: 900,
              color: '#FAFAFA',
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', fontSize: 24, lineHeight: 1.4, color: '#A1A1AA' }}>
            {description}
          </div>
          <div style={{ display: 'flex', fontSize: 21, color: accent, fontWeight: 700 }}>
            {authorName}
          </div>
        </div>
        {footer}
      </div>
    </div>
  ) : (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#09090B',
        padding: 52,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {brand}
      <div style={{ display: 'flex', alignItems: 'center', gap: 40, flex: 1, paddingTop: 14 }}>
        {logo ? (
          <img src={logo} width={300} height={300} style={{ borderRadius: 28 }} />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16 }}>
          <div style={{ display: 'flex', fontSize: 50, lineHeight: 1.12, fontWeight: 900, color: '#FAFAFA' }}>
            {title}
          </div>
          <div style={{ display: 'flex', fontSize: 25, lineHeight: 1.4, color: '#A1A1AA' }}>
            {description}
          </div>
          <div style={{ display: 'flex', fontSize: 22, color: accent, fontWeight: 700 }}>
            {authorName}
          </div>
        </div>
      </div>
      {footer}
    </div>
  );

  return new ImageResponse(content, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
