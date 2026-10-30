/**
 * Media and IPFS Resolution Utilities for Larvaz Hip-Hop
 */

export const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
];

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

/**
 * Inspects any URL and returns the appropriate embed configuration
 */
export function detectMediaInfo(rawUrl?: string | null): MediaEmbedInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleanUrl = resolveIpfsUrl(rawUrl.trim());
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

  // 4. Direct Audio Files (mp3, wav, ogg, m4a, flac)
  if (/\.(mp3|wav|ogg|m4a|flac|aac)($|\?)/i.test(cleanUrl)) {
    return {
      type: 'audio',
      embedUrl: cleanUrl,
      cleanUrl,
    };
  }

  // 5. Direct Video Files (mp4, webm, mov)
  if (/\.(mp4|webm|mov)($|\?)/i.test(cleanUrl)) {
    return {
      type: 'video',
      embedUrl: cleanUrl,
      cleanUrl,
    };
  }

  // 6. Direct Image Files (jpg, jpeg, png, gif, webp, svg)
  if (/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(cleanUrl)) {
    return {
      type: 'image',
      thumbnailUrl: cleanUrl,
      cleanUrl,
    };
  }

  // 7. Generic Web Link
  return {
    type: 'web',
    cleanUrl,
  };
}
