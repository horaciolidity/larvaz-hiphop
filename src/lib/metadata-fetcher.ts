import { validateExternalUrl } from './ssrf-validator';
import { ContentProvider, PostMetadata, ContentType } from '@/types';

const REQUEST_TIMEOUT_MS = 5000;
const MAX_RESPONSE_SIZE = 512 * 1024; // 512 KB

export interface FetchMetadataResult {
  success: boolean;
  provider: ContentProvider;
  contentType: ContentType;
  metadata: PostMetadata;
  error?: string;
}

export async function fetchExternalMetadata(urlString: string): Promise<FetchMetadataResult> {
  const validation = validateExternalUrl(urlString);
  if (!validation.isValid || !validation.sanitizedUrl) {
    return {
      success: false,
      provider: 'generic',
      contentType: 'link',
      metadata: {
        title: urlString,
        description: 'Enlace externo',
        provider: 'generic',
      },
      error: validation.error || 'URL inválida',
    };
  }

  const { sanitizedUrl, provider, domain } = validation;

  // 1. YouTube specific fast extraction & oEmbed
  if (provider === 'youtube') {
    return await handleYouTube(sanitizedUrl);
  }

  // 2. Spotify oEmbed
  if (provider === 'spotify') {
    return await handleSpotify(sanitizedUrl);
  }

  // 3. SoundCloud oEmbed
  if (provider === 'soundcloud') {
    return await handleSoundCloud(sanitizedUrl);
  }

  // 4. Vimeo oEmbed
  if (provider === 'vimeo') {
    return await handleVimeo(sanitizedUrl);
  }

  // 5. Generic HTML / OpenGraph scraper with size limit & timeout
  return await handleGenericOpenGraph(sanitizedUrl, provider, domain || 'web');
}

// ============================================================================
// PROVIDER HANDLERS
// ============================================================================

async function handleYouTube(url: string): Promise<FetchMetadataResult> {
  // Extract video ID: youtube.com/watch?v=ID or youtu.be/ID or youtube.com/shorts/ID
  let videoId = '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      videoId = parsed.pathname.slice(1).split('?')[0];
    } else if (parsed.pathname.includes('/shorts/')) {
      videoId = parsed.pathname.split('/shorts/')[1].split('?')[0];
    } else {
      videoId = parsed.searchParams.get('v') || '';
    }
  } catch {
    // fallback
  }

  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
  const fallbackThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetchWithTimeout(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        provider: 'youtube',
        contentType: 'video',
        metadata: {
          title: sanitizeText(data.title) || 'Video de YouTube',
          author_name: sanitizeText(data.author_name) || 'Canal de YouTube',
          thumbnail_url: data.thumbnail_url || fallbackThumbnail,
          embed_url: embedUrl,
          provider: 'youtube',
        },
      };
    }
  } catch {
    // Graceful fallback using parsed ID
  }

  return {
    success: true,
    provider: 'youtube',
    contentType: 'video',
    metadata: {
      title: 'Video de YouTube',
      author_name: 'YouTube',
      thumbnail_url: fallbackThumbnail,
      embed_url: embedUrl,
      provider: 'youtube',
    },
  };
}

async function handleSpotify(url: string): Promise<FetchMetadataResult> {
  // Spotify embed URL: open.spotify.com/track/ID -> open.spotify.com/embed/track/ID
  let embedUrl = '';
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      embedUrl = `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`;
    }
  } catch {
    // ignore
  }

  try {
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetchWithTimeout(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        provider: 'spotify',
        contentType: 'music',
        metadata: {
          title: sanitizeText(data.title) || 'Pista de Spotify',
          author_name: sanitizeText(data.author_name) || 'Artista en Spotify',
          thumbnail_url: data.thumbnail_url,
          embed_url: embedUrl,
          provider: 'spotify',
        },
      };
    }
  } catch {
    // ignore
  }

  return {
    success: true,
    provider: 'spotify',
    contentType: 'music',
    metadata: {
      title: 'Música en Spotify',
      author_name: 'Spotify',
      embed_url: embedUrl,
      provider: 'spotify',
    },
  };
}

async function handleSoundCloud(url: string): Promise<FetchMetadataResult> {
  try {
    const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetchWithTimeout(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      // Extract iframe src if present
      let embedUrl = '';
      if (data.html) {
        const match = data.html.match(/src="([^"]+)"/);
        if (match) embedUrl = match[1];
      }

      return {
        success: true,
        provider: 'soundcloud',
        contentType: 'music',
        metadata: {
          title: sanitizeText(data.title) || 'Audio en SoundCloud',
          author_name: sanitizeText(data.author_name) || 'SoundCloud Creator',
          thumbnail_url: data.thumbnail_url,
          description: sanitizeText(data.description),
          embed_url: embedUrl,
          provider: 'soundcloud',
        },
      };
    }
  } catch {
    // ignore
  }

  return {
    success: true,
    provider: 'soundcloud',
    contentType: 'music',
    metadata: {
      title: 'Pista de SoundCloud',
      author_name: 'SoundCloud',
      provider: 'soundcloud',
    },
  };
}

async function handleVimeo(url: string): Promise<FetchMetadataResult> {
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    const res = await fetchWithTimeout(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      const embedUrl = data.video_id ? `https://player.vimeo.com/video/${data.video_id}` : undefined;
      return {
        success: true,
        provider: 'vimeo',
        contentType: 'video',
        metadata: {
          title: sanitizeText(data.title) || 'Video de Vimeo',
          author_name: sanitizeText(data.author_name) || 'Creador de Vimeo',
          thumbnail_url: data.thumbnail_url,
          description: sanitizeText(data.description),
          embed_url: embedUrl,
          provider: 'vimeo',
        },
      };
    }
  } catch {
    // ignore
  }

  return {
    success: true,
    provider: 'vimeo',
    contentType: 'video',
    metadata: {
      title: 'Video en Vimeo',
      author_name: 'Vimeo',
      provider: 'vimeo',
    },
  };
}

async function handleGenericOpenGraph(
  url: string,
  provider: ContentProvider,
  domain: string
): Promise<FetchMetadataResult> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      return makeFallback(url, provider, domain);
    }

    // Limit response reading to MAX_RESPONSE_SIZE
    const text = await res.text();
    const truncated = text.slice(0, MAX_RESPONSE_SIZE);

    const titleMatch = 
      truncated.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      truncated.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i) ||
      truncated.match(/<title>([^<]+)<\/title>/i);

    const descMatch = 
      truncated.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      truncated.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

    const imageMatch = 
      truncated.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      truncated.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);

    const siteMatch = 
      truncated.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);

    const title = titleMatch ? sanitizeText(titleMatch[1]) : `Publicación de ${domain}`;
    const description = descMatch ? sanitizeText(descMatch[1]) : undefined;
    const thumbnail_url = imageMatch ? imageMatch[1] : undefined;
    const author_name = siteMatch ? sanitizeText(siteMatch[1]) : domain;

    return {
      success: true,
      provider,
      contentType: determineContentType(provider, title, description),
      metadata: {
        title,
        description,
        thumbnail_url,
        author_name,
        provider,
      },
    };
  } catch {
    return makeFallback(url, provider, domain);
  }
}

function makeFallback(url: string, provider: ContentProvider, domain: string): FetchMetadataResult {
  return {
    success: true,
    provider,
    contentType: 'link',
    metadata: {
      title: `Enlace en ${domain}`,
      description: `Contenido compartido desde ${domain}`,
      author_name: domain,
      provider,
    },
  };
}

function determineContentType(provider: ContentProvider, title?: string, desc?: string): ContentType {
  if (provider === 'spotify' || provider === 'soundcloud' || provider === 'bandcamp') return 'music';
  if (provider === 'youtube' || provider === 'vimeo' || provider === 'tiktok') return 'video';
  if (provider === 'instagram') return 'visual_art';

  const combined = ((title || '') + ' ' + (desc || '')).toLowerCase();
  if (combined.includes('beat') || combined.includes('track') || combined.includes('cancion') || combined.includes('audio')) {
    return 'music';
  }
  if (combined.includes('video') || combined.includes('clip') || combined.includes('live')) {
    return 'video';
  }
  if (combined.includes('graffiti') || combined.includes('muro') || combined.includes('tag') || combined.includes('boceto')) {
    return 'visual_art';
  }

  return 'link';
}

function sanitizeText(str?: string): string {
  if (!str) return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim();
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LarvazHiphopBot/1.0 (+https://larvazhiphop.org/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}
