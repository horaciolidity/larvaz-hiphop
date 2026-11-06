'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Send,
  Link as LinkIcon,
  X,
  Loader2,
  Lock,
  Flame,
  Sliders,
} from 'lucide-react';
import { ContentType, PostMetadata } from '@/types';
import { UserAvatar } from '@/components/common/UserAvatar';
import { detectMediaInfo } from '@/lib/media-utils';
import { getLocationFlag } from '@/lib/country-utils';

export const InlineFeedComposer: React.FC = () => {
  const { currentUser, createPost, userLocation } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const flag = getLocationFlag(userLocation || currentUser.location);
  const locationName = userLocation || currentUser.location || 'Mendoza, Argentina';
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['hiphop']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Metadata auto-fetch
  const [metadata, setMetadata] = useState<PostMetadata | null>(null);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const metaDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const availableTags = ['freestyle', 'letras', 'boombap', 'breaking', 'graffiti', 'cypher'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Auto-fetch metadata when URL changes (debounced 800ms)
  useEffect(() => {
    if (metaDebounceRef.current) clearTimeout(metaDebounceRef.current);
    if (!url.trim() || url.length < 10) {
      setMetadata(null);
      return;
    }
    setMetadata(null);
    metaDebounceRef.current = setTimeout(async () => {
      setIsFetchingMeta(true);
      try {
        const res = await fetch('/api/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        });
        const data = await res.json();
        if (res.ok && data.metadata) {
          setMetadata(data.metadata);
        } else {
          // fallback: local media detection
          const info = detectMediaInfo(url.trim());
          if (info) {
            setMetadata({
              title: new URL(url.trim()).hostname,
              embed_url: info.embedUrl,
              thumbnail_url: info.thumbnailUrl,
              provider: 'generic' as any,
            });
          }
        }
      } catch {
        // ignore fetch errors
      } finally {
        setIsFetchingMeta(false);
      }
    }, 800);
    return () => {
      if (metaDebounceRef.current) clearTimeout(metaDebounceRef.current);
    };
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !url.trim()) return;

    setIsSubmitting(true);
    try {
      const cleanUrl = url.trim();

      // Detect provider from url
      let detectedProvider: any = 'generic';
      let finalContentType: ContentType = cleanUrl ? 'link' : 'text';
      if (cleanUrl) {
        const info = detectMediaInfo(cleanUrl);
        if (info) {
          if (info.type === 'youtube') { detectedProvider = 'youtube'; finalContentType = 'video'; }
          else if (info.type === 'soundcloud') { detectedProvider = 'soundcloud'; finalContentType = 'music'; }
          else if (info.type === 'spotify') { detectedProvider = 'spotify'; finalContentType = 'music'; }
          else if (info.type === 'audio') { detectedProvider = 'generic'; finalContentType = 'music'; }
          else if (info.type === 'video') { detectedProvider = 'generic'; finalContentType = 'video'; }
        }
      }

      let postMetadata = metadata;
      if (cleanUrl && !postMetadata) {
        const info = detectMediaInfo(cleanUrl);
        try {
          postMetadata = {
            title: new URL(cleanUrl).hostname,
            embed_url: info?.embedUrl,
            thumbnail_url: info?.thumbnailUrl,
            provider: detectedProvider,
          };
        } catch {
          postMetadata = { title: cleanUrl, provider: detectedProvider };
        }
      }

      createPost({
        description: description.trim() || (cleanUrl ? `Compartiendo: ${cleanUrl}` : ''),
        externalUrl: cleanUrl || undefined,
        tags: selectedTags,
        contentType: finalContentType,
        provider: detectedProvider,
        metadata: postMetadata,
      });

      // Reset
      setDescription('');
      setUrl('');
      setMetadata(null);
      setShowUrlInput(false);
      setIsFocused(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mounted && currentUser.is_guest) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-surface-elevated via-surface to-background border border-acid/40 shadow-acid-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-acid/15 border border-acid/40 flex items-center justify-center text-acid flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-acid">
                👀 Estás en Modo Observador (Solo Lectura)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-magenta/15 border border-magenta/30 text-magenta font-bold">
                PUBLICACIÓN BLOQUEADA
              </span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Los visitantes no logueados no pueden publicar ni enviar mensajes. Iniciá sesión o creá tu cuenta gratis para tirar tus barras, beats o videos al muro y conectar con la comunidad.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            href="/login"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-acid text-background font-black text-xs shadow-acid-sm hover:bg-acid-hover transition-all"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </Link>
          <Link
            href="/registro"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated border border-acid/40 hover:border-acid text-content-primary font-bold text-xs transition-all"
          >
            <span>Crear Cuenta Gratis</span>
          </Link>
          <Link
            href="/estudio"
            className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan/15 border border-cyan/40 text-cyan hover:bg-cyan hover:text-background font-bold text-xs transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>🎚️ Estudio Mastering</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl bg-surface border border-surface-border hover:border-acid/30 transition-all space-y-3 shadow-lg">
      {/* Top: User Avatar + Input */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <UserAvatar
            avatarUrl={mounted ? currentUser.avatar_url : undefined}
            name={mounted ? currentUser.full_name : ''}
            size="md"
            className="mt-0.5"
          />
          {mounted && flag && (
            <span
              className="absolute -bottom-1 -right-1 text-[11px] leading-none bg-surface border border-surface-border rounded-full w-4 h-4 flex items-center justify-center shadow-sm pointer-events-none"
              title={`Publicando desde: ${locationName}`}
              aria-hidden="true"
            >
              {flag}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-content-primary truncate flex items-center gap-1">
              <span>{currentUser.full_name}</span>
              {flag && <span className="text-xs">{flag}</span>}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono text-content-secondary bg-surface-elevated px-2 py-0.5 rounded-full border border-surface-border"
              title="País y ciudad de origen de esta publicación"
            >
              <span className="text-xs">{flag || '🌐'}</span>
              <span className="truncate max-w-[130px] font-bold text-content-primary">{locationName}</span>
            </span>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="¿Qué barras, rimas, beats o trazos vas a tirar hoy al muro de la plaza?..."
            rows={isFocused || description.length > 0 ? 3 : 2}
            className="w-full bg-transparent text-xs text-content-primary placeholder:text-content-muted focus:outline-none resize-none leading-relaxed font-mono"
          />

          {/* Optional URL input row */}
          {showUrlInput && (
            <div className="mt-2 flex items-center gap-2 p-1.5 rounded-xl bg-surface-elevated border border-surface-border animate-fade-in">
              <LinkIcon className="w-4 h-4 text-acid flex-shrink-0 ml-1.5" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/..., soundcloud, spotify... (opcional)"
                className="w-full bg-transparent text-xs text-content-primary placeholder:text-content-muted focus:outline-none"
              />
              {isFetchingMeta && <Loader2 className="w-3.5 h-3.5 text-acid animate-spin flex-shrink-0" />}
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setMetadata(null);
                  setShowUrlInput(false);
                }}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary transition-colors"
                title="Quitar enlace"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Metadata preview mini-card */}
          {metadata && url && (
            <div className="mt-2 p-2 rounded-lg bg-surface-elevated border border-acid/20 flex items-center gap-2 text-xs">
              {metadata.thumbnail_url && (
                <img
                  src={metadata.thumbnail_url}
                  alt={metadata.title || 'preview'}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="font-bold text-content-primary truncate">{metadata.title || url}</p>
                {metadata.author_name && (
                  <p className="text-content-secondary truncate">{metadata.author_name}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar: Multimedia, Mastering Studio & Submit */}
      <div className="pt-2 border-t border-surface-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
              showUrlInput || url
                ? 'bg-acid/10 border-acid text-acid'
                : 'bg-surface-elevated border-surface-border text-content-secondary hover:text-content-primary'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>{url ? 'Enlace añadido ✓' : '+ Enlace multimedia'}</span>
          </button>

          <Link
            href="/estudio"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-cyan/10 border-cyan/30 text-cyan hover:bg-cyan hover:text-background transition-colors"
            title="Masterizá tus canciones y beats dentro de Larvaz"
          >
            <Sliders className="w-3 h-3" />
            <span>🎚️ Masterizar Audio</span>
          </Link>

          {(isFocused || description.length > 0) &&
            availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors border ${
                  selectedTags.includes(tag)
                    ? 'bg-acid text-background border-acid'
                    : 'bg-surface-elevated border-surface-border text-content-secondary hover:text-content-primary'
                }`}
              >
                #{tag}
              </button>
            ))}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/crear"
            className="text-[11px] text-content-muted hover:text-acid font-bold transition-colors"
          >
            Más opciones
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!description.trim() && !url.trim())}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-acid text-background font-black text-xs shadow-acid-sm hover:bg-acid-hover active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>Tirar al Muro</span>
          </button>
        </div>
      </div>
    </div>
  );
};
