'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Send,
  Link as LinkIcon,
  X,
  Loader2,
} from 'lucide-react';
import { ContentType, PostMetadata } from '@/types';
import { UserAvatar } from '@/components/common/UserAvatar';
import { detectMediaInfo } from '@/lib/media-utils';

export const InlineFeedComposer: React.FC = () => {
  const { currentUser, createPost } = useApp();
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

  return (
    <div className="p-3.5 rounded-2xl bg-surface border border-surface-border hover:border-surface-hover transition-all space-y-3">
      {/* Top: User Avatar + Input */}
      <div className="flex items-start gap-3">
        <UserAvatar
          avatarUrl={currentUser.avatar_url}
          name={currentUser.full_name}
          size="md"
          className="mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="¿Qué barras, rimas o pensamiento vas a soltar hoy en el muro?..."
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

      {/* Expanded controls when typing or focused */}
      {(isFocused || description.length > 0 || showUrlInput) && (
        <div className="pt-2 border-t border-surface-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Quick Tags & Multimedia Button */}
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

            {availableTags.map((tag) => (
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
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-acid text-background font-black text-xs shadow-acid-sm hover:bg-acid-hover active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>Publicar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
