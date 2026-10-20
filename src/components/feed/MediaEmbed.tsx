'use client';

import React, { useState } from 'react';
import { PostMetadata, ContentProvider } from '@/types';
import { ExternalLink, Play, Disc3, Radio, Music } from 'lucide-react';

interface MediaEmbedProps {
  metadata?: PostMetadata;
  provider: ContentProvider;
  externalUrl: string;
}

export const MediaEmbed: React.FC<MediaEmbedProps> = ({ metadata, provider, externalUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const title = metadata?.title || 'Contenido externo compartido';
  const author = metadata?.author_name || 'Autor';
  const thumbnail = metadata?.thumbnail_url;
  const embedUrl = metadata?.embed_url;

  const providerNames: Record<ContentProvider, string> = {
    youtube: 'YouTube',
    spotify: 'Spotify',
    soundcloud: 'SoundCloud',
    vimeo: 'Vimeo',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    bandcamp: 'Bandcamp',
    generic: 'Enlace Web',
  };

  const providerColors: Record<ContentProvider, string> = {
    youtube: 'text-[#FF0000]',
    spotify: 'text-[#1DB954]',
    soundcloud: 'text-[#FF5500]',
    vimeo: 'text-[#1AB7EA]',
    instagram: 'text-[#E1306C]',
    tiktok: 'text-[#00F2FE]',
    bandcamp: 'text-[#629AA9]',
    generic: 'text-acid',
  };

  // If user activated embed player and an official embedUrl is available
  if (isPlaying && embedUrl) {
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

    if (provider === 'soundcloud') {
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

    if (provider === 'youtube' || provider === 'vimeo') {
      return (
        <div className="mt-3 rounded-xl overflow-hidden border border-surface-border bg-black aspect-video relative shadow-lg">
          <iframe
            src={embedUrl + '?autoplay=1'}
            title={title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  // Audio / Video / Visual Rich Street Cassette Card
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
              <Disc3 className="w-12 h-12 text-acid animate-spin-slow opacity-80" />
              <span className="text-[10px] uppercase font-bold tracking-widest mt-2">
                {providerNames[provider]}
              </span>
            </div>
          )}

          {/* Embedded Play Button Overlay if embeddable */}
          {embedUrl && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors"
              aria-label="Reproducir contenido"
            >
              <div className="w-12 h-12 rounded-full bg-acid text-background flex items-center justify-center shadow-acid-glow group-hover:scale-110 active:scale-95 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </button>
          )}

          {/* Platform Badge */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${providerColors[provider]} bg-current`} />
            <span className="text-content-primary">{providerNames[provider]}</span>
          </div>
        </div>

        {/* Content Info & External Link Button */}
        <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-bold text-sm text-content-primary line-clamp-2 group-hover:text-acid transition-colors">
              {title}
            </h3>
            <p className="text-xs text-content-secondary mt-1 line-clamp-1">
              {author}
            </p>

            {/* Decorative Vinyl Soundwave Equalizer (Simulated aesthetic) */}
            <div className="flex items-center gap-1 my-3 py-1 px-2 rounded-lg bg-surface-elevated/70 border border-surface-border w-fit">
              <Radio className="w-3.5 h-3.5 text-acid" />
              <div className="flex items-end gap-0.5 h-3 px-1">
                <span className="w-0.5 h-2 bg-acid rounded-full animate-pulse" />
                <span className="w-0.5 h-3 bg-acid rounded-full animate-pulse delay-75" />
                <span className="w-0.5 h-1.5 bg-acid rounded-full animate-pulse delay-150" />
                <span className="w-0.5 h-2.5 bg-acid rounded-full animate-pulse delay-100" />
                <span className="w-0.5 h-2 bg-acid rounded-full animate-pulse" />
              </div>
              <span className="text-[10px] font-mono text-content-secondary uppercase">
                Underground Audio
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surface-border/60 mt-1">
            <span className="text-[10px] text-content-secondary font-mono truncate max-w-[150px]">
              {new URL(externalUrl).hostname}
            </span>

            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover hover:text-acid text-content-primary text-xs font-bold border border-surface-border transition-colors"
            >
              <span>Abrir en {providerNames[provider]}</span>
              <ExternalLink className="w-3 h-3 text-content-secondary" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
