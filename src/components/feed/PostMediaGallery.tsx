'use client';

import React, { useState } from 'react';
import type { PostMedia } from '@/types';
import { AudioTemplatePlayer } from './AudioTemplatePlayer';
import { IpfsImage } from './IpfsImage';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface PostMediaGalleryProps {
  media?: PostMedia[];
  compact?: boolean;
}

export const PostMediaGallery: React.FC<PostMediaGalleryProps> = ({ media, compact = false }) => {
  const items = Array.isArray(media) ? media.filter((m) => m && m.url) : [];
  const images = items.filter((m) => m.type === 'image');
  const audios = items.filter((m) => m.type === 'audio');
  const videos = items.filter((m) => m.type === 'video');

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  const goPrev = () =>
    setLightboxIndex((idx) =>
      idx === null ? null : (idx - 1 + images.length) % images.length
    );
  const goNext = () =>
    setLightboxIndex((idx) => (idx === null ? null : (idx + 1) % images.length));

  return (
    <div className="mt-3 space-y-2.5">
      {/* Fotos */}
      {images.length > 0 && (
        <div
          className={`grid gap-1.5 ${
            images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {images.map((img, index) => {
            const isWide = images.length === 3 && index === 0;
            return (
              <button
                key={img.id || img.url}
                type="button"
                onClick={() => openLightbox(index)}
                className={`group relative overflow-hidden rounded-xl border border-surface-border bg-black ${
                  isWide ? 'col-span-2' : ''
                }`}
                style={{ aspectRatio: isWide ? '16 / 9' : images.length === 1 ? '16 / 10' : '1 / 1' }}
                aria-label={`Ampliar foto ${index + 1}`}
              >
                <IpfsImage
                  src={img.url}
                  ipfsHint={Boolean(img.ipfs)}
                  alt={img.name || `Foto ${index + 1}`}
                  className={`w-full h-full ${compact ? 'object-cover' : 'object-cover'} group-hover:scale-[1.02] transition-transform duration-500`}
                  loading="lazy"
                />
                <span className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ImageIcon className="w-3 h-3" />
                  {index + 1}/{images.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Audios con plantilla visual */}
      {audios.map((audio) => (
        <AudioTemplatePlayer
          key={audio.id || audio.url}
          src={audio.url}
          title={audio.name}
          template={audio.template}
          compact={compact}
        />
      ))}

      {/* Videos subidos */}
      {videos.map((video) => (
        <div
          key={video.id || video.url}
          className="rounded-xl overflow-hidden border border-surface-border bg-black"
        >
          <video
            src={video.url}
            poster={video.poster}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-[520px]"
          />
          {video.name && (
            <p className="px-3 py-2 text-[11px] text-content-secondary truncate">{video.name}</p>
          )}
        </div>
      ))}

      {/* Lightbox */}
      {currentImage && (
        <div
          className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Cerrar imagen"
          >
            <X className="w-5 h-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-3 sm:left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-3 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="max-w-5xl max-h-[86vh] flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <IpfsImage
              src={currentImage.url}
              ipfsHint={Boolean(currentImage.ipfs)}
              alt={currentImage.name || 'Imagen de la publicación'}
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-[11px] text-white/60">
              {currentImage.name || 'Imagen de Larvaz'} · {lightboxIndex! + 1} de {images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
