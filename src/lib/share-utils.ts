import type { Post } from '@/types';

const FALLBACK_SITE = 'https://larvaz-hiphop.vercel.app';

/** URL base canónica de Larvaz (siempre sin barra final). */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE;
  return env.replace(/\/+$/, '');
}

/** Enlace LARVAZ de una publicación (nunca el enlace de YouTube/Spotify embebido). */
export function getPostShareUrl(postId: string): string {
  return `${getSiteUrl()}/publicacion/${encodeURIComponent(postId)}`;
}

/** Quita URLs del texto para que al compartir no se cuele el enlace original. */
export function stripUrls(text?: string): string {
  if (!text) return '';
  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function getPostShareText(post: Post): string {
  const author = post.author?.full_name || post.author?.username || 'Artista Larvaz';
  const body = stripUrls(post.description).slice(0, 220);
  if (body) {
    return `${author} en LARVAZ HIP-HOP:\n“${body}${post.description.length > 220 ? '…' : ''}”`;
  }
  return `${author} compartió una publicación en LARVAZ HIP-HOP.`;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Comparte SIEMPRE el enlace de Larvaz. Si el navegador no soporta Web Share,
 * copia el enlace al portapapeles.
 */
export async function sharePostLink(post: Post): Promise<ShareResult> {
  const url = getPostShareUrl(post.id);
  const text = getPostShareText(post);
  const title = `LARVAZ HIP-HOP · ${post.author?.full_name || 'Comunidad'}`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelled';
      // Sigue con el portapapeles
    }
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }
  } catch {
    // último fallback manual
  }

  return 'failed';
}

export async function copyPostLink(post: Post): Promise<boolean> {
  const url = getPostShareUrl(post.id);
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // fallback
  }
  try {
    const input = document.createElement('input');
    input.value = url;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

export type ShareNetwork = 'whatsapp' | 'telegram' | 'x' | 'facebook';

export function openShareNetwork(network: ShareNetwork, post: Post): void {
  const url = getPostShareUrl(post.id);
  const text = getPostShareText(post);
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  let target = '';
  switch (network) {
    case 'whatsapp':
      target = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
      break;
    case 'telegram':
      target = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
      break;
    case 'x':
      target = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      break;
    case 'facebook':
      target = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;
  }

  if (target && typeof window !== 'undefined') {
    window.open(target, '_blank', 'noopener,noreferrer');
  }
}
