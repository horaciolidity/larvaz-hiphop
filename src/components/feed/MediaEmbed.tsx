'use client';

import React, { useState } from 'react';
import { PostMetadata, ContentProvider } from '@/types';
import { detectMediaInfo } from '@/lib/media-utils';
import { ExternalLink, Play, Disc3, Volume2, Music, Globe } from 'lucide-react';

interface MediaEmbedProps {
  metadata?: PostMetadata;
  provider: ContentProvider;
  externalUrl?: string;
}

const PROVIDER_NAMES: Record<ContentProvider, string> = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  vimeo: 'Vimeo',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  bandcamp: 'Bandcamp',
  generic: 'Enlace Web',
};

const PROVIDER_COLORS: Record<ContentProvider, string> = {
  youtube: '#FF0000',
  spotify: '#1DB954',
  soundcloud: '#FF5500',
  vimeo: '#1AB7EA',
  instagram: '#E1306C',
  tiktok: '#00F2FE',
  bandcamp: '#629AA9',
  generic: '#d4ff00',
};

export const MediaEmbed: React.FC<MediaEmbedProps> = ({ metadata, provider, externalUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!externalUrl || !externalUrl.trim()) {
    return null;
  }

  // Use media detection for richer embed support
  const mediaInfo = detectMediaInfo(externalUrl);

  const title = metadata?.title || 'Contenido compartido';
  const author = metadata?.author_name || '';
  const description = metadata?.description || '';
  // Prefer metadata thumbnail, fall back to media detection
  const thumbnail = metadata?.thumbnail_url || mediaInfo?.thumbnailUrl;
  // Prefer metadata embed URL, fall back to media detection
  const embedUrl = metadata?.embed_url || mediaInfo?.embedUrl;
  const detectedType = mediaInfo?.type;
  const cleanUrl = mediaInfo?.cleanUrl || externalUrl;

  const providerColor = PROVIDER_COLORS[provider] || '#d4ff00';

  // ─────────────────────────────────────────────
  // ACTIVE PLAYBACK MODES
  // ─────────────────────────────────────────────

  if (isPlaying && embedUrl) {
    // YouTube / Vimeo: aspect-ratio video iframe
    if (detectedType === 'youtube' || provider === 'youtube' || provider === 'vimeo') {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-surface-border bg-black aspect-video relative shadow-lg">
          <iframe
            src={embedUrl.includes('autoplay') ? embedUrl : `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
            title={title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // SoundCloud: visual widget
    if (detectedType === 'soundcloud' || provider === 'soundcloud') {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-surface-border bg-black shadow-lg">
          <iframe
            width="100%"
            height="166"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={embedUrl}
            className="w-full"
          />
        </div>
      );
    }

    // Spotify
    if (provider === 'spotify') {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-surface-border bg-black shadow-lg">
          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full"
          />
        </div>
      );
    }

    // Direct Audio
    if (detectedType === 'audio') {
      return (
        <div className="mt-3 rounded-xl border border-surface-border bg-surface-elevated p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-acid/20 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-acid" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-content-primary truncate">{title}</p>
              {author && <p className="text-xs text-content-secondary truncate">{author}</p>}
            </div>
          </div>
          <audio
            src={embedUrl}
            controls
            autoPlay
            className="w-full h-10 accent-acid"
          />
        </div>
      );
    }

    // Direct Video
    if (detectedType === 'video') {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-surface-border bg-black aspect-video shadow-lg">
          <video
            src={embedUrl}
            controls
            autoPlay
            className="w-full h-full"
          />
        </div>
      );
    }
  }

  // ─────────────────────────────────────────────
  // PREVIEW CARD (before play)
  // ─────────────────────────────────────────────

  // Image-only post (IPFS image, direct .jpg, etc.)
  if (detectedType === 'image' && thumbnail) {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border border-surface-border bg-surface shadow-sm">
        <img
          src={thumbnail}
          alt={title || 'Imagen compartida'}
          className="w-full max-h-[480px] object-contain bg-black"
        />
        {(title || author) && (
          <div className="p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              {title && <p className="text-xs font-bold text-content-primary truncate">{title}</p>}
              {author && <p className="text-[11px] text-content-secondary truncate">{author}</p>}
            </div>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 rounded-lg bg-surface-elevated border border-surface-border hover:border-acid text-content-secondary hover:text-acid transition-colors"
              title="Abrir enlace original"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  const isEmbeddable = Boolean(embedUrl) && (
    detectedType === 'youtube' ||
    detectedType === 'soundcloud' ||
    detectedType === 'audio' ||
    detectedType === 'video' ||
    provider === 'youtube' ||
    provider === 'spotify' ||
    provider === 'soundcloud' ||
    provider === 'vimeo'
  );

  return (
    <div className="mt-3 rounded-xl bg-surface border border-surface-border hover:border-surface-hover overflow-hidden transition-all group shadow-sm">
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail or Vinyl Art */}
        <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0 bg-surface-elevated overflow-hidden flex items-center justify-center">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface to-surface-elevated text-content-secondary p-4">
              {detectedType === 'audio' ? (
                <Volume2 className="w-12 h-12 text-acid animate-pulse opacity-80" />
              ) : detectedType === 'soundcloud' || provider === 'soundcloud' ? (
                <Volume2 className="w-12 h-12 text-[#FF5500] opacity-80" />
              ) : (
                <Disc3 className="w-12 h-12 text-acid animate-spin-slow opacity-80" />
              )}
              <span className="text-[10px] uppercase font-bold tracking-widest mt-2">
                {PROVIDER_NAMES[provider]}
              </span>
            </div>
          )}

          {/* Embedded Play Button Overlay if embeddable */}
          {isEmbeddable && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors"
              aria-label="Reproducir contenido"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-transform"
                style={{ backgroundColor: providerColor }}
              >
                <Play className="w-6 h-6 fill-current text-white ml-0.5" />
              </div>
            </button>
          )}

          {/* Platform Badge */}
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: providerColor }}
            />
            <span className="text-content-primary">{PROVIDER_NAMES[provider]}</span>
          </div>
        </div>

        {/* Content Info & External Link Button */}
        <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: providerColor }}
            >
              {PROVIDER_NAMES[provider]}
            </p>
            <h4 className="font-bold text-sm text-content-primary leading-snug line-clamp-2 mb-1">
              {title}
            </h4>
            {author && (
              <p className="text-xs text-content-secondary truncate">
                {author}
              </p>
            )}
            {description && !author && (
              <p className="text-xs text-content-muted line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            {isEmbeddable && (
              <button
                onClick={() => setIsPlaying(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white transition-all hover:opacity-90 active:scale-95 shadow-sm"
                style={{ backgroundColor: providerColor }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reproducir</span>
              </button>
            )}
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-surface-elevated border border-surface-border hover:border-acid text-content-secondary hover:text-acid transition-all"
              title="Abrir en nueva pestaña"
            >
              {detectedType === 'web' ? (
                <Globe className="w-3.5 h-3.5" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Abrir original</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
