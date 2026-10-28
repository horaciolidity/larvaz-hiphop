'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Send,
  Link as LinkIcon,
  X,
} from 'lucide-react';
import { ContentType } from '@/types';
import { UserAvatar } from '@/components/common/UserAvatar';

export const InlineFeedComposer: React.FC = () => {
  const { currentUser, createPost } = useApp();
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['hiphop']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const availableTags = ['freestyle', 'letras', 'boombap', 'breaking', 'graffiti', 'cypher'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !url.trim()) return;

    setIsSubmitting(true);
    try {
      const cleanUrl = url.trim();
      const finalContentType: ContentType = cleanUrl ? 'link' : 'text';

      let postMetadata;
      if (cleanUrl) {
        try {
          postMetadata = {
            title: new URL(cleanUrl).hostname,
            provider: 'generic' as any,
          };
        } catch {
          postMetadata = {
            title: cleanUrl,
            provider: 'generic' as any,
          };
        }
      }

      createPost({
        description: description.trim() || (cleanUrl ? `Compartiendo: ${cleanUrl}` : ''),
        externalUrl: cleanUrl || undefined,
        tags: selectedTags,
        contentType: finalContentType,
        provider: cleanUrl ? 'generic' : 'generic',
        metadata: postMetadata,
      });

      // Reset
      setDescription('');
      setUrl('');
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
            placeholder="¿Qué barras, rimas o pensamiento vas a soltar hoy en el muro? (Sin necesidad de enlaces)..."
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
                placeholder="https://youtube.com/..., spotify, soundcloud... (opcional)"
                className="w-full bg-transparent text-xs text-content-primary placeholder:text-content-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setShowUrlInput(false);
                }}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary transition-colors"
                title="Quitar enlace"
              >
                <X className="w-3.5 h-3.5" />
              </button>
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
              <span>{url ? 'Enlace añadido' : '+ Enlace multimedia'}</span>
            </button>

            {/* Tag Pills */}
            <div className="hidden sm:flex items-center gap-1">
              {availableTags.map((t) => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                      isSelected
                        ? 'bg-acid text-background shadow-acid-sm'
                        : 'bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border'
                    }`}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/crear"
              className="text-[11px] text-content-muted hover:text-acid font-bold transition-colors hidden md:inline-block"
            >
              Editor completo
            </Link>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (!description.trim() && !url.trim())}
              className="px-4 py-1.5 rounded-xl bg-acid text-background font-bold text-xs shadow-acid-glow hover:bg-acid-hover disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Pintar en el Muro</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
