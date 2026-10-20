'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { MediaEmbed } from '@/components/feed/MediaEmbed';
import {
  Link as LinkIcon,
  Sparkles,
  Loader2,
  Tag,
  AlertCircle,
  Plus,
  Send,
  Check,
} from 'lucide-react';
import { ContentType, PostMetadata } from '@/types';

export default function CrearPublicacionPage() {
  const router = useRouter();
  const { createPost, currentUser } = useApp();

  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['hiphop']);
  const [contentType, setContentType] = useState<ContentType>('music');
  const [metadata, setMetadata] = useState<PostMetadata | null>(null);
  const [detectedProvider, setDetectedProvider] = useState<any>('generic');

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPreview = async (urlToFetch: string) => {
    if (!urlToFetch.trim()) return;
    setIsLoadingPreview(true);
    setPreviewError(null);

    try {
      const res = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || 'No se pudo obtener vista previa');
        // fallback generic metadata
        setMetadata({
          title: `Enlace externo (${new URL(urlToFetch).hostname})`,
          description: 'Contenido compartido en Larvaz',
          provider: 'generic',
        });
      } else {
        setMetadata(data.metadata);
        setDetectedProvider(data.provider);
        if (data.contentType) setContentType(data.contentType);
        if (!description && data.metadata?.title) {
          setDescription(`Comparto este material de ${data.metadata.author_name || 'la cultura'}: "${data.metadata.title}"`);
        }
      }
    } catch (err: any) {
      setPreviewError('Error al conectar con el servicio de metadatos');
      try {
        setMetadata({
          title: `Enlace externo: ${new URL(urlToFetch).hostname}`,
          description: 'Contenido compartido',
          provider: 'generic',
        });
      } catch {
        // ignore
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      createPost({
        externalUrl: url.trim(),
        description: description.trim(),
        tags,
        contentType,
        provider: detectedProvider,
        metadata: metadata || {
          title: new URL(url.trim()).hostname,
          provider: detectedProvider,
        },
      });

      router.push('/');
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-2xl md:text-3xl text-content-primary tracking-wide">
          PUBLICAR EN EL MURO
        </h1>
        <p className="text-xs text-content-secondary mt-1">
          Comparte música, batallas, sesiones de breaking, graffiti y fanzines mediante enlaces externos seguros.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL Input with fetch button */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider">
            Enlace Externo (YouTube, Spotify, SoundCloud, Instagram, etc.) *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-muted">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchPreview(url)}
              disabled={!url || isLoadingPreview}
              className="px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-hover text-acid border border-surface-border hover:border-acid font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors"
            >
              {isLoadingPreview ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Previsualizar</span>
            </button>
          </div>
          {previewError && (
            <p className="text-[11px] text-orange flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{previewError} (puedes publicar de todas formas)</span>
            </p>
          )}
        </div>

        {/* Live Preview Card */}
        {metadata && url && (
          <div className="p-3.5 rounded-2xl bg-surface-elevated/80 border border-surface-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-acid block mb-1">
              Vista Previa en el Feed
            </span>
            <MediaEmbed
              metadata={metadata}
              provider={detectedProvider}
              externalUrl={url}
            />
          </div>
        )}

        {/* Content Type Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider">
            Tipo de Expresión Cultural
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'music', label: 'Música / Beat' },
              { id: 'video', label: 'Video / Clip' },
              { id: 'visual_art', label: 'Graffiti / Arte' },
              { id: 'link', label: 'Enlace General' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setContentType(item.id as ContentType)}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  contentType === item.id
                    ? 'bg-acid text-background border-acid shadow-acid-sm'
                    : 'bg-surface text-content-secondary border-surface-border hover:border-content-secondary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider">
            Descripción y Respeto Cultural *
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cuenta la historia detrás de este material, quiénes participaron, qué elementos representa o por qué es relevante..."
            className="w-full p-3 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Tags Builder */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider">
            Etiquetas Culturales (opcional)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Ej: boombap, breaking, mural, 90bpm..."
              className="flex-1 px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover text-content-primary text-xs font-bold border border-surface-border flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs font-semibold text-acid"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-magenta ml-0.5"
                  aria-label={`Eliminar etiqueta ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isSubmitting || !url.trim() || !description.trim()}
            className="w-full py-3.5 rounded-xl bg-acid hover:bg-acid-hover text-background font-display font-black text-lg tracking-wider uppercase shadow-acid-glow flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span>Pintar en el Muro (Publicar)</span>
          </button>
        </div>
      </form>
    </div>
  );
}
