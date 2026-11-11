'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Post } from '@/types';
import {
  copyPostLink,
  getPostShareText,
  getPostShareUrl,
  openShareNetwork,
  sharePostLink,
} from '@/lib/share-utils';
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  AtSign,
  Smartphone,
  Link2,
  Info,
} from 'lucide-react';

interface SharePostButtonProps {
  post: Post;
  variant?: 'icon' | 'bar' | 'full';
  className?: string;
}

export const SharePostButton: React.FC<SharePostButtonProps> = ({
  post,
  variant = 'icon',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const flashCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const flashShared = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  const handleNativeShare = async () => {
    const result = await sharePostLink(post);
    setOpen(false);
    if (result === 'copied') flashCopied();
    if (result === 'shared') flashShared();
  };

  const handleCopy = async () => {
    const ok = await copyPostLink(post);
    setOpen(false);
    if (ok) flashCopied();
  };

  const iconButtonClass =
    'flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-content-primary hover:bg-surface-elevated transition-colors';

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          variant === 'full'
            ? `flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border hover:border-acid text-content-primary font-bold text-xs transition-colors ${className}`
            : variant === 'bar'
              ? `flex items-center gap-2 px-3 py-2 rounded-xl bg-acid text-background font-bold text-xs hover:bg-acid-hover transition-colors ${className}`
              : `${iconButtonClass} ${className}`
        }
        aria-label="Compartir publicación con enlace de Larvaz"
        title="Compartir enlace de Larvaz"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-acid" />
            {(variant === 'full' || variant === 'bar') && <span>Enlace copiado</span>}
          </>
        ) : shared ? (
          <>
            <Check className="w-4 h-4 text-acid" />
            {(variant === 'full' || variant === 'bar') && <span>Compartido</span>}
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            {variant === 'full' && <span>Compartir en Larvaz</span>}
            {variant === 'bar' && <span>Compartir</span>}
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-2xl bg-surface-elevated border border-surface-border shadow-2xl z-40 p-2 animate-fade-in">
          <div className="flex items-start gap-1.5 px-2 py-1.5 mb-1 rounded-lg bg-acid/10 border border-acid/20">
            <Info className="w-3 h-3 text-acid flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-content-secondary leading-snug">
              Se comparte el enlace oficial de <strong className="text-acid">LARVAZ</strong>, no el video externo embebido.
            </p>
          </div>

          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-content-primary hover:text-acid hover:bg-surface transition-colors"
          >
            <Smartphone className="w-4 h-4 text-acid" />
            <span>Compartir desde el celular</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-content-primary hover:text-acid hover:bg-surface transition-colors"
          >
            <Copy className="w-4 h-4 text-acid" />
            <span>Copiar enlace de Larvaz</span>
          </button>

          <div className="my-1 border-t border-surface-border/60" />

          <button
            type="button"
            onClick={() => {
              openShareNetwork('whatsapp', post);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-content-primary hover:text-acid hover:bg-surface transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openShareNetwork('telegram', post);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-content-primary hover:text-acid hover:bg-surface transition-colors"
          >
            <Send className="w-4 h-4 text-cyan" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openShareNetwork('x', post);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-content-primary hover:text-acid hover:bg-surface transition-colors"
          >
            <AtSign className="w-4 h-4 text-content-primary" />
            <span>X / Twitter</span>
          </button>

          <div className="mt-1 pt-1.5 border-t border-surface-border/60 px-2 flex items-center gap-1 text-[9px] text-content-muted">
            <Link2 className="w-3 h-3 flex-shrink-0" />
            <span className="truncate font-mono">{getPostShareUrl(post.id)}</span>
          </div>
          <p className="sr-only">{getPostShareText(post)}</p>
        </div>
      )}
    </div>
  );
};
