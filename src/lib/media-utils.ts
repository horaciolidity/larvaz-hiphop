/**
 * Media and IPFS Resolution Utilities for Larvaz Hip-Hop
 */

import type { PostMedia, AudioTemplateId } from '@/types';

export const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

export const AUDIO_TEMPLATES: Array<{
  id: AudioTemplateId;
  name: string;
  subtitle: string;
  emoji: string;
}> = [
  { id: 'vinyl', name: 'Vinilo 33 RPM', subtitle: 'Tornamesa clásica girando', emoji: '💿' },
  { id: 'boombap', name: 'Boom-Bap VU', subtitle: 'Medidores de estudio analógico', emoji: '🔊' },
  { id: 'cassette', name: 'Cassette Mixtape', subtitle: 'Cinta girando en loop', emoji: '📼' },
  { id: 'neon', name: 'Neon Cypher', subtitle: 'Luces de batalla underground', emoji: '🌃' },
  { id: 'graffiti', name: 'Graffiti Splash', subtitle: 'Aerosol ácido y magenta', emoji: '🎨' },
  { id: 'waveform', name: 'Waveform Wall', subtitle: 'Ondas de sonido en vivo', emoji: '📈' },
];

export const DEFAULT_AUDIO_TEMPLATE: AudioTemplateId = 'vinyl';

/**
 * Resolves IPFS URLs (ipfs://..., raw Qm.../bafy... CIDs) to HTTPS gateway URLs
 */
export function resolveIpfsUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();

  // Keep internal assets and emoji markers intact
  if (clean.startsWith('emoji:') || clean.startsWith('/')) {
    return clean;
  }

  // ipfs:// URI scheme -> https gateway
  if (clean.startsWith('ipfs://')) {
    const path = clean.replace(/^ipfs:\/\//, '').replace(/^ipfs\//, '');
    return `${IPFS_GATEWAYS[0]}${path}`;
  }

  // Direct CID string (v0 Qm... or v1 bafy...)
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44,}(\/.*)?$/.test(clean) || /^bafy[a-z0-9]{50,}(\/.*)?$/i.test(clean)) {
    return `${IPFS_GATEWAYS[0]}${clean}`;
  }

  // Standard http/https URL
  return clean;
}

/**
 * True when a value points to IPFS (ipfs://, raw CID or a known public gateway)
 */
export function isIpfsReference(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (clean.startsWith('ipfs://')) return true;
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44,}(\/.*)?$/.test(clean)) return true;
  if (/^bafy[a-z0-9]{50,}(\/.*)?$/i.test(clean)) return true;
  return /\/ipfs\/(?:Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafy[a-z0-9]{50,})/i.test(clean);
}

/**
 * Normaliza lo que escribe el usuario: acepta CIDs pelados, ipfs:// y URLs normales.
 */
export function normalizeInputUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const clean = raw.trim();
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44,}(\/.*)?$/.test(clean) || /^bafy[a-z0-9]{50,}(\/.*)?$/i.test(clean)) {
    return resolveIpfsUrl(`ipfs://${clean}`);
  }
  return resolveIpfsUrl(clean);
}

/**
 * Returns fallback gateways if the primary IPFS gateway fails
 */
export function getIpfsFallbackUrl(url: string, attempt: number = 1): string {
  if (!url) return '';
  for (const gw of IPFS_GATEWAYS) {
    if (url.includes(gw)) {
      const cidPath = url.replace(gw, '');
      const nextGw = IPFS_GATEWAYS[attempt % IPFS_GATEWAYS.length];
      return `${nextGw}${cidPath}`;
    }
  }
  return resolveIpfsUrl(url);
}

export interface MediaEmbedInfo {
  type: 'youtube' | 'soundcloud' | 'spotify' | 'audio' | 'video' | 'image' | 'web';
  embedUrl?: string;
  thumbnailUrl?: string;
  videoId?: string;
  cleanUrl: string;
}

export interface MediaDetectionHints {
  mediaType?: 'image' | 'audio' | 'video' | 'web';
  thumbnailUrl?: string;
}

/**
 * Inspects any URL and returns the appropriate embed configuration.
 * Acepta también pistas del servidor (Content-Type / IPFS) para archivos sin extensión.
 */
export function detectMediaInfo(
  rawUrl?: string | null,
  hints?: MediaDetectionHints
): MediaEmbedInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleanUrl = normalizeInputUrl(rawUrl);
  if (!cleanUrl) return null;

  // 1. YouTube Detection
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
  const ytMatch =
    cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      cleanUrl,
    };
  }

  // 2. SoundCloud Detection
  if (cleanUrl.includes('soundcloud.com')) {
    const encoded = encodeURIComponent(cleanUrl);
    return {
      type: 'soundcloud',
      embedUrl: `https://w.soundcloud.com/player/?url=${encoded}&color=%23d4ff00&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`,
      cleanUrl,
    };
  }

  // 3. Spotify Detection
  if (cleanUrl.includes('open.spotify.com')) {
    let spotifyEmbed = cleanUrl;
    try {
      const parsed = new URL(cleanUrl);
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        spotifyEmbed = `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`;
      }
    } catch {
      // fallback
    }
    return {
      type: 'spotify',
      embedUrl: spotifyEmbed,
      cleanUrl,
    };
  }

  // 4. Direct Audio Files (mp3, wav, ogg, m4a, flac, opus, aac)
  if (/\.(mp3|wav|ogg|oga|m4a|flac|aac|opus)($|\?)/i.test(cleanUrl)) {
    return {
      type: 'audio',
      embedUrl: cleanUrl,
      cleanUrl,
    };
  }

  // 5. Direct Video Files (mp4, webm, mov, m4v)
  if (/\.(mp4|webm|mov|m4v)($|\?)/i.test(cleanUrl)) {
    return {
      type: 'video',
      embedUrl: cleanUrl,
      cleanUrl,
    };
  }

  // 6. Direct Image Files (jpg, jpeg, png, gif, webp, svg, avif)
  if (/\.(jpg|jpeg|png|gif|webp|svg|avif)($|\?)/i.test(cleanUrl)) {
    return {
      type: 'image',
      thumbnailUrl: cleanUrl,
      cleanUrl,
    };
  }

  // 7. Server hints (IPFS files without extension, direct binary Content-Type, etc.)
  if (hints?.mediaType === 'audio') {
    return { type: 'audio', embedUrl: cleanUrl, cleanUrl };
  }
  if (hints?.mediaType === 'video') {
    return { type: 'video', embedUrl: cleanUrl, cleanUrl };
  }
  if (hints?.mediaType === 'image') {
    return {
      type: 'image',
      thumbnailUrl: hints.thumbnailUrl || cleanUrl,
      cleanUrl,
    };
  }
  if (hints?.thumbnailUrl && isIpfsReference(cleanUrl)) {
    return {
      type: 'image',
      thumbnailUrl: hints.thumbnailUrl,
      cleanUrl,
    };
  }

  // 8. Generic Web Link
  return {
    type: 'web',
    cleanUrl,
  };
}

/** Nombre legible a partir de una URL (para audios / imágenes de IPFS) */
export function filenameFromUrl(url?: string | null): string {
  if (!url) return '';
  try {
    const clean = url.split('?')[0].split('#')[0];
    const last = clean.split('/').filter(Boolean).pop() || '';
    const decoded = decodeURIComponent(last);
    return decoded.length > 60 ? decoded.slice(0, 60) : decoded;
  } catch {
    return '';
  }
}

/**
 * Normaliza la lista de archivos publicados (fotos/audios/videos).
 * Es tolerante con datos viejos guardados en metadata.raw_metadata.
 */
export function normalizeMediaList(raw: any): PostMedia[] {
  if (!Array.isArray(raw)) return [];
  const allowedTypes = new Set(['image', 'audio', 'video']);
  const allowedTemplates = new Set(AUDIO_TEMPLATES.map((t) => t.id));

  const media: PostMedia[] = [];
  raw.slice(0, 20).forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    const url = resolveIpfsUrl(item.url || item.src || '');
    if (!url) return;
    const type = allowedTypes.has(item.type) ? item.type : 'image';
    media.push({
      id: String(item.id || `media-${index}`),
      type,
      url,
      name: typeof item.name === 'string' ? item.name : filenameFromUrl(url),
      size: typeof item.size === 'number' ? item.size : undefined,
      originalSize: typeof item.originalSize === 'number' ? item.originalSize : undefined,
      duration: typeof item.duration === 'number' ? item.duration : undefined,
      poster: item.poster ? resolveIpfsUrl(item.poster) : undefined,
      template: allowedTemplates.has(item.template) ? item.template : undefined,
      ipfs: Boolean(item.ipfs) || isIpfsReference(item.url),
    });
  });
  return media;
}
