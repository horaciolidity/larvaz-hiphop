'use client';

import React, { useState } from 'react';
import { X, Check, Shuffle, Sparkles, Image as ImageIcon } from 'lucide-react';
import { resolveIpfsUrl } from '@/lib/media-utils';

export interface AvatarOption {
  id: string;
  url?: string;
  emoji?: string;
  label: string;
}

export const AVATAR_CATEGORIES = [
  {
    id: 'stickers',
    label: '🔥 Stickers Urbanos',
    avatars: [
      { id: 'stk-1',  url: '/avatars/mc-snapback.svg', label: 'MC Snapback' },
      { id: 'stk-2',  url: '/avatars/dj-scratch.svg', label: 'DJ Scratch' },
      { id: 'stk-3',  url: '/avatars/graffiti-respirator.svg', label: 'Graffiti Writer' },
      { id: 'stk-4',  url: '/avatars/street-doberman.svg', label: 'Doberman Street' },
      { id: 'stk-5',  url: '/avatars/street-cat.svg', label: 'Gato Callejero' },
      { id: 'stk-6',  url: '/avatars/boombox-classic.svg', label: 'Boombox 80s' },
      { id: 'stk-7',  url: '/avatars/spray-can.svg', label: 'Lata de Spray' },
      { id: 'stk-8',  url: '/avatars/skull-hiphop.svg', label: 'Calavera Cypher' },
      { id: 'stk-9',  url: '/avatars/lion-flow.svg', label: 'León Urbano' },
      { id: 'stk-10', url: '/avatars/tiger-stripes.svg', label: 'Tigre Neón' },
      { id: 'stk-11', url: '/avatars/wolf-moon.svg', label: 'Lobo Solitario' },
      { id: 'stk-12', url: '/avatars/cassette-mixtape.svg', label: 'Mixtape 90s' },
      { id: 'stk-13', url: '/avatars/fuego-cypher.svg', label: 'Fuego Bars' },
      { id: 'stk-14', url: '/avatars/bboy-cap.svg', label: 'B-Boy Vortex' },
      { id: 'stk-15', url: '/avatars/dragon-graffiti.svg', label: 'Dragón Street' },
      { id: 'stk-16', url: '/avatars/vinilo-oro.svg', label: 'Disco de Platino' },
    ] as AvatarOption[],
  },
  {
    id: 'hiphop',
    label: '🎤 Hip-Hop Clásico',
    avatars: [
      { id: 'hh-1',  emoji: '🎤', label: 'Micrófono' },
      { id: 'hh-2',  emoji: '🎧', label: 'DJ Decks' },
      { id: 'hh-3',  emoji: '💿', label: 'Vinilo' },
      { id: 'hh-4',  emoji: '📻', label: 'Boombox' },
      { id: 'hh-5',  emoji: '🧢', label: 'Snapback' },
      { id: 'hh-6',  emoji: '🕶️', label: 'Lentes Cool' },
      { id: 'hh-7',  emoji: '🔊', label: 'Speaker' },
      { id: 'hh-8',  emoji: '🎙️', label: 'Studio Mic' },
    ] as AvatarOption[],
  },
  {
    id: 'graffiti',
    label: '🎨 Arte Urbano',
    avatars: [
      { id: 'gr-1',  emoji: '🎨', label: 'Paleta' },
      { id: 'gr-2',  emoji: '🖌️', label: 'Pincel' },
      { id: 'gr-3',  emoji: '🔥', label: 'Fuego' },
      { id: 'gr-4',  emoji: '⚡', label: 'Rayo' },
      { id: 'gr-5',  emoji: '💥', label: 'Explosión' },
      { id: 'gr-6',  emoji: '🌟', label: 'Estrella' },
      { id: 'gr-7',  emoji: '🏙️', label: 'Ciudad' },
      { id: 'gr-8',  emoji: '✏️', label: 'Marcador' },
    ] as AvatarOption[],
  },
  {
    id: 'animals',
    label: '🦁 Bestias',
    avatars: [
      { id: 'an-1',  emoji: '🦁', label: 'León' },
      { id: 'an-2',  emoji: '🐯', label: 'Tigre' },
      { id: 'an-3',  emoji: '🦊', label: 'Zorro' },
      { id: 'an-4',  emoji: '🐺', label: 'Lobo' },
      { id: 'an-5',  emoji: '🦅', label: 'Águila' },
      { id: 'an-6',  emoji: '🐉', label: 'Dragón' },
      { id: 'an-7',  emoji: '🦈', label: 'Tiburón' },
      { id: 'an-8',  emoji: '🐻', label: 'Oso' },
    ] as AvatarOption[],
  },
  {
    id: 'moods',
    label: '😤 Flow & Furia',
    avatars: [
      { id: 'mo-1',  emoji: '😤', label: 'Intenso' },
      { id: 'mo-2',  emoji: '🤩', label: 'Alucinado' },
      { id: 'mo-3',  emoji: '😎', label: 'Underground' },
      { id: 'mo-4',  emoji: '🥶', label: 'Frío' },
      { id: 'mo-5',  emoji: '🤯', label: 'Mind Blown' },
      { id: 'mo-6',  emoji: '😈', label: 'Diablo' },
      { id: 'mo-7',  emoji: '💀', label: 'Calavera' },
      { id: 'mo-8',  emoji: '🥷', label: 'Ninja' },
    ] as AvatarOption[],
  },
];

const ALL_AVATARS = AVATAR_CATEGORIES.flatMap((c) => c.avatars);

interface AvatarPickerProps {
  currentAvatar?: string;
  onSelect: (avatarUrl: string, label?: string) => void;
  onClose: () => void;
}

export function isEmojiAvatar(url?: string | null): boolean {
  if (!url) return false;
  return url.startsWith('emoji:');
}

export function parseEmojiAvatar(url: string): string {
  return url.replace('emoji:', '');
}

export function EmojiAvatarDisplay({
  url,
  size = 'md',
  className = '',
}: {
  url?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeMap: Record<string, string> = {
    xs: 'w-6 h-6 text-base',
    sm: 'w-8 h-8 text-xl',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-14 h-14 text-4xl',
    xl: 'w-20 h-20 text-5xl',
  };

  if (isEmojiAvatar(url)) {
    const emoji = parseEmojiAvatar(url!);
    return (
      <div
        className={[sizeMap[size], 'rounded-full bg-surface-elevated border-2 border-acid/40 flex items-center justify-center select-none flex-shrink-0', className].join(' ')}
      >
        <span role="img" style={{ lineHeight: 1 }}>{emoji}</span>
      </div>
    );
  }

  const resolved = url ? resolveIpfsUrl(url) : '';

  return (
    <img
      src={resolved || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
      alt="Avatar"
      className={[sizeMap[size], 'rounded-full object-cover border-2 border-acid/40 flex-shrink-0', className].join(' ')}
    />
  );
}

function UrlAvatarInput({ onSelect, onClose }: { onSelect: (url: string, label: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState('');
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://... · ipfs://Qm... · CID"
        className="flex-1 px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
      />
      <button
        onClick={() => {
          if (url.trim()) {
            const finalUrl = resolveIpfsUrl(url.trim()) || url.trim();
            onSelect(finalUrl, 'Foto IPFS / Web');
            onClose();
          }
        }}
        className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-acid/40 text-acid font-black text-xs hover:bg-acid hover:text-background transition-colors flex-shrink-0"
      >
        Usar
      </button>
    </div>
  );
}

export default function AvatarPicker({ currentAvatar, onSelect, onClose }: AvatarPickerProps) {
  const [activeCategory, setActiveCategory] = useState(AVATAR_CATEGORIES[0].id);
  const [hovered, setHovered] = useState<string | null>(null);
  const currentCat = AVATAR_CATEGORIES.find((c) => c.id === activeCategory)!;

  const handleRandom = () => {
    const r = ALL_AVATARS[Math.floor(Math.random() * ALL_AVATARS.length)];
    const chosen = r.url ? r.url : ('emoji:' + r.emoji);
    onSelect(chosen, r.label);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md bg-surface rounded-3xl border border-acid/40 shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-elevated/70">
          <div>
            <h2 className="font-display font-black text-base text-content-primary tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-acid" />
              <span>Elige tu Avatar o Sticker</span>
            </h2>
            <p className="text-[11px] text-content-muted mt-0.5">Stickers ilustrados de hip-hop, personajes y arte urbano</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRandom}
              className="p-2 rounded-xl bg-acid/10 border border-acid/40 text-acid hover:bg-acid hover:text-background transition-all"
              title="Avatar aleatorio"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface border border-surface-border text-content-secondary hover:text-content-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto border-b border-surface-border/50 bg-surface-elevated/30">
          {AVATAR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={[
                'px-3.5 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all border',
                activeCategory === cat.id
                  ? 'bg-acid text-background border-acid shadow-acid-glow'
                  : 'bg-surface text-content-secondary border-surface-border hover:border-acid/40 hover:text-content-primary',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Avatars Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-3">
            {currentCat.avatars.map((av) => {
              const valueToSave = av.url ? av.url : ('emoji:' + av.emoji);
              const isSelected = currentAvatar === valueToSave;
              const isHov = hovered === av.id;

              return (
                <button
                  key={av.id}
                  onClick={() => onSelect(valueToSave, av.label)}
                  onMouseEnter={() => setHovered(av.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={[
                    'relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl border transition-all duration-200 group',
                    isSelected
                      ? 'bg-acid/20 border-acid shadow-acid-glow ring-2 ring-acid/60'
                      : 'bg-surface-elevated/60 border-surface-border hover:border-acid/60 hover:bg-surface-elevated',
                  ].join(' ')}
                  title={av.label}
                >
                  {av.url ? (
                    <img
                      src={av.url}
                      alt={av.label}
                      className="w-14 h-14 object-contain rounded-full transition-transform duration-200 drop-shadow-md"
                      style={{ transform: isHov || isSelected ? 'scale(1.12)' : 'scale(1)' }}
                    />
                  ) : (
                    <span
                      className="text-4xl leading-none transition-transform duration-200"
                      style={{ transform: isHov || isSelected ? 'scale(1.2)' : 'scale(1)' }}
                      role="img"
                      aria-label={av.label}
                    >
                      {av.emoji}
                    </span>
                  )}
                  <span className="text-[10px] text-content-secondary group-hover:text-acid font-bold text-center leading-tight truncate w-full">
                    {av.label}
                  </span>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-acid rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-3 h-3 text-background" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom URL Input */}
        <div className="px-5 py-4 border-t border-surface-border bg-surface-elevated/40 space-y-2">
          <p className="text-[11px] text-content-secondary text-center flex items-center justify-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-acid" />
            <span>O usa una foto o enlace web propio</span>
          </p>
          <UrlAvatarInput onSelect={onSelect} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
