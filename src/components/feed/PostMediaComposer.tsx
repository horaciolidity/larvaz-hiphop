'use client';

import React, { useRef, useState } from 'react';
import type { AudioTemplateId, PostMedia } from '@/types';
import {
  AUDIO_TEMPLATES,
  DEFAULT_AUDIO_TEMPLATE,
} from '@/lib/media-utils';
import {
  MediaCompressionError,
  compressAudioFile,
  compressImageFile,
  formatBytes,
} from '@/lib/audio-compress';
import { uploadMediaFile } from '@/lib/media-upload';
import { AudioTemplatePlayer } from './AudioTemplatePlayer';
import {
  ImagePlus,
  Music2,
  Trash2,
  Loader2,
  Palette,
  HardDrive,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const MAX_IMAGES = 3;
export const MAX_AUDIOS = 3;

const AUDIO_QUALITY_OPTIONS = [
  { kbps: 96, label: 'Alta · 96 kbps', hint: 'Mejor fidelidad, menos ahorro' },
  { kbps: 64, label: 'Estándar · 64 kbps', hint: 'Recomendado para el muro' },
  { kbps: 48, label: 'Ahorro · 48 kbps', hint: 'Máximo ahorro de espacio' },
];

interface PostMediaComposerProps {
  value: PostMedia[];
  onChange: (media: PostMedia[]) => void;
  compact?: boolean;
  disabled?: boolean;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const PostMediaComposer: React.FC<PostMediaComposerProps> = ({
  value,
  onChange,
  compact = false,
  disabled = false,
}) => {
  const images = value.filter((m) => m.type === 'image');
  const audios = value.filter((m) => m.type === 'audio');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [audioQuality, setAudioQuality] = useState<number>(64);

  const maxAudioSeconds = Math.floor((3_800_000 * 8) / (audioQuality * 1000));

  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setNotice(null);

    const freeSlots = MAX_IMAGES - images.length;
    if (freeSlots <= 0) {
      setError('Ya llegaste al límite de 3 fotos por publicación.');
      return;
    }

    const selected = Array.from(files).slice(0, freeSlots);
    setBusy('Comprimiendo y subiendo fotos…');
    const added: PostMedia[] = [];
    const warnings: string[] = [];

    try {
      for (const file of selected) {
        if (!file.type.startsWith('image/')) {
          warnings.push(`${file.name}: no es una imagen válida.`);
          continue;
        }
        if (file.size > 20 * 1024 * 1024) {
          warnings.push(`${file.name}: supera los 20 MB.`);
          continue;
        }
        try {
          const compressed = await compressImageFile(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.82,
          });
          const uploaded = await uploadMediaFile(compressed, 'image');
          added.push({
            id: makeId(),
            type: 'image',
            url: uploaded.url,
            name: file.name,
            size: compressed.size,
            originalSize: file.size,
          });
        } catch (err: any) {
          warnings.push(`${file.name}: ${err?.message || 'no se pudo subir'}`);
        }
      }

      if (added.length > 0) {
        onChange([...value, ...added]);
        setNotice(
          `${added.length} foto${added.length === 1 ? '' : 's'} lista${
            added.length === 1 ? '' : 's'
          } para publicar.`
        );
      }
      if (warnings.length > 0) setError(warnings.join(' '));
    } finally {
      setBusy(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleAudioFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setNotice(null);

    const freeSlots = MAX_AUDIOS - audios.length;
    if (freeSlots <= 0) {
      setError('Ya llegaste al límite de 3 audios por publicación.');
      return;
    }

    const selected = Array.from(files).slice(0, freeSlots);
    setBusy('Comprimiendo audio para ahorrar espacio…');
    const added: PostMedia[] = [];
    const warnings: string[] = [];

    try {
      for (const file of selected) {
        const isAudio =
          file.type.startsWith('audio/') ||
          /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus)$/i.test(file.name);
        if (!isAudio) {
          warnings.push(`${file.name}: no es un audio válido.`);
          continue;
        }
        if (file.size > 30 * 1024 * 1024) {
          warnings.push(`${file.name}: supera los 30 MB.`);
          continue;
        }

        let fileToUpload: File = file;
        let size = file.size;
        let duration: number | undefined;
        let savedFromCompression = false;

        try {
          const compressed = await compressAudioFile(file, {
            bitrateKbps: audioQuality,
            maxDurationSec: maxAudioSeconds,
          });
          fileToUpload = compressed.file;
          size = compressed.compressedSize;
          duration = compressed.duration;
          savedFromCompression = compressed.wasCompressed;
        } catch (err: any) {
          const message =
            err instanceof MediaCompressionError
              ? err.message
              : 'No se pudo comprimir el audio.';
          if (file.size > 4.2 * 1024 * 1024) {
            warnings.push(`${file.name}: ${message} El archivo es muy grande para subirlo sin comprimir.`);
            continue;
          }
          warnings.push(`${file.name}: ${message} Se subirá el original.`);
        }

        if (fileToUpload.size > 4.2 * 1024 * 1024) {
          warnings.push(
            `${file.name}: el audio comprimido pesa ${formatBytes(
              fileToUpload.size
            )}. Elegí una calidad menor o un audio más corto.`
          );
          continue;
        }

        try {
          const uploaded = await uploadMediaFile(fileToUpload, 'audio');
          added.push({
            id: makeId(),
            type: 'audio',
            url: uploaded.url,
            name: file.name.replace(/\.[^.]+$/, '') + (fileToUpload.type === 'audio/mpeg' ? '.mp3' : ''),
            size,
            originalSize: file.size,
            duration,
            template: DEFAULT_AUDIO_TEMPLATE,
          });
          if (!savedFromCompression && fileToUpload === file) {
            // sin cambios
          }
        } catch (err: any) {
          warnings.push(`${file.name}: ${err?.message || 'no se pudo subir'}`);
        }
      }

      if (added.length > 0) {
        onChange([...value, ...added]);
        setNotice(
          `${added.length} audio${added.length === 1 ? '' : 's'} listo${
            added.length === 1 ? '' : 's'
          }. Elegí la plantilla visual de cada uno.`
        );
      }
      if (warnings.length > 0) setError(warnings.join(' '));
    } finally {
      setBusy(null);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const removeMedia = (id: string) => {
    onChange(value.filter((m) => m.id !== id));
    setNotice(null);
    setError(null);
  };

  const updateTemplate = (id: string, template: AudioTemplateId) => {
    onChange(value.map((m) => (m.id === id ? { ...m, template } : m)));
  };

  return (
    <div className="space-y-2.5 rounded-2xl border border-surface-border bg-surface/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-content-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-acid" />
            Fotos y audios de la publicación
          </p>
          <p className="text-[10px] text-content-muted mt-0.5">
            Hasta 3 fotos y 3 audios. Los MP3 se recomprimen para ahorrar espacio.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span className="px-2 py-0.5 rounded-full bg-surface-elevated border border-surface-border text-content-secondary">
            📷 {images.length}/{MAX_IMAGES}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-surface-elevated border border-surface-border text-content-secondary">
            🎵 {audios.length}/{MAX_AUDIOS}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || Boolean(busy) || images.length >= MAX_IMAGES}
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-surface-elevated border border-surface-border text-content-secondary hover:text-acid hover:border-acid disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          <span>Subir fotos</span>
        </button>

        <button
          type="button"
          disabled={disabled || Boolean(busy) || audios.length >= MAX_AUDIOS}
          onClick={() => audioInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-surface-elevated border border-surface-border text-content-secondary hover:text-acid hover:border-acid disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Music2 className="w-3.5 h-3.5" />
          <span>Subir audios MP3</span>
        </button>

        <label className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-surface-elevated border border-surface-border text-[10px] text-content-secondary">
          <HardDrive className="w-3 h-3 text-cyan" />
          <span className="hidden sm:inline">Calidad audio:</span>
          <select
            value={audioQuality}
            onChange={(e) => setAudioQuality(Number(e.target.value))}
            disabled={disabled || Boolean(busy)}
            className="bg-transparent text-[10px] font-bold text-content-primary focus:outline-none"
            title="Los próximos audios se comprimen con esta calidad"
          >
            {AUDIO_QUALITY_OPTIONS.map((opt) => (
              <option key={opt.kbps} value={opt.kbps} className="bg-surface text-content-primary">
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleImageFiles(e.target.files)}
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/aac,audio/flac,.mp3,.wav,.ogg,.m4a,.aac,.flac"
          multiple
          className="hidden"
          onChange={(e) => handleAudioFiles(e.target.files)}
        />
      </div>

      {busy && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-cyan/10 border border-cyan/30 text-[11px] text-cyan font-bold">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{busy}</span>
        </div>
      )}

      {notice && !busy && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-acid/10 border border-acid/30 text-[11px] text-acid font-bold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{notice}</span>
        </div>
      )}

      {error && !busy && (
        <div className="flex items-start gap-2 p-2 rounded-xl bg-magenta/10 border border-magenta/30 text-[11px] text-magenta">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2 pt-1">
          {/* Fotos cargadas */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group rounded-lg overflow-hidden border border-surface-border bg-black aspect-square"
                >
                  <img src={img.url} alt={img.name || 'Foto'} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMedia(img.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white/80 hover:text-magenta transition-colors"
                    aria-label={`Quitar ${img.name || 'foto'}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 bg-black/70 text-[8px] text-white/70 truncate">
                    {formatBytes(img.size)}
                    {img.originalSize && img.originalSize > (img.size || 0) ? (
                      <span className="text-acid"> · optimizada</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Audios cargados */}
          {audios.map((audio) => {
            const savedPercent =
              audio.originalSize && audio.size && audio.originalSize > audio.size
                ? Math.round((1 - audio.size / audio.originalSize) * 100)
                : 0;
            return (
              <div key={audio.id} className="rounded-xl border border-surface-border bg-surface p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-acid/15 border border-acid/30 flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-4 h-4 text-acid" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-content-primary truncate">
                      {audio.name || 'Audio'}
                    </p>
                    <p className="text-[9px] text-content-muted">
                      {formatBytes(audio.size)}
                      {savedPercent > 0 && (
                        <span className="text-acid"> · {savedPercent}% más liviano</span>
                      )}
                      {audio.duration ? ` · ${Math.round(audio.duration)}s` : ''}
                    </p>
                  </div>
                  <label className="flex items-center gap-1 text-[9px] text-content-secondary bg-surface-elevated border border-surface-border rounded-lg px-1.5 py-1">
                    <Palette className="w-3 h-3 text-cyan" />
                    <select
                      value={audio.template || DEFAULT_AUDIO_TEMPLATE}
                      onChange={(e) => updateTemplate(audio.id, e.target.value as AudioTemplateId)}
                      className="bg-transparent text-[9px] font-bold text-content-primary focus:outline-none max-w-[110px]"
                      title="Plantilla visual para este audio"
                    >
                      {AUDIO_TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id} className="bg-surface text-content-primary">
                          {t.emoji} {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeMedia(audio.id)}
                    className="p-1.5 rounded-lg text-content-muted hover:text-magenta hover:bg-magenta/10 transition-colors"
                    aria-label={`Quitar ${audio.name || 'audio'}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!compact && (
                  <AudioTemplatePlayer
                    src={audio.url}
                    title={audio.name}
                    template={audio.template}
                    compact
                    onChangeTemplate={(template) => updateTemplate(audio.id, template)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
