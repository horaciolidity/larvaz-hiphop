'use client';

import React, { useState } from 'react';
import { X, Check, Shuffle } from 'lucide-react';

interface AvatarOption {
  id: string;
  emoji: string;
  label: string;
}

const AVATAR_CATEGORIES = [
  {
    id: 'hiphop',
    label: '🎤 Hip-Hop',
    avatars: [
      { id: 'hh-1',  emoji: '🎤', label: 'Micrófono' },
      { id: 'hh-2',  emoji: '🎧', label: 'DJ' },
      { id: 'hh-3',  emoji: '🎵', label: 'Nota Musical' },
      { id: 'hh-4',  emoji: '🥁', label: 'Batería' },
      { id: 'hh-5',  emoji: '💿', label: 'Vinilo' },
      { id: 'hh-6',  emoji: '📻', label: 'Radio' },
      { id: 'hh-7',  emoji: '🔊', label: 'Speaker' },
      { id: 'hh-8',  emoji: '🎙️', label: 'Studio Mic' },
      { id: 'hh-9',  emoji: '🕶️', label: 'Lentes Cool' },
      { id: 'hh-10', emoji: '🧢', label: 'Snapback' },
      { id: 'hh-11', emoji: '🎸', label: 'Guitarra' },
      { id: 'hh-12', emoji: '🎹', label: 'Teclado' },
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
      { id: 'gr-7',  emoji: '💫', label: 'Destello' },
      { id: 'gr-8',  emoji: '🌈', label: 'Arcoíris' },
      { id: 'gr-9',  emoji: '🏙️', label: 'Ciudad' },
      { id: 'gr-10', emoji: '🌆', label: 'Atardecer' },
      { id: 'gr-11', emoji: '✏️', label: 'Lápiz' },
      { id: 'gr-12', emoji: '🖊️', label: 'Marcador' },
    ] as AvatarOption[],
  },
  {
    id: 'animals',
    label: '🦁 Animales',
    avatars: [
      { id: 'an-1',  emoji: '🦁', label: 'León' },
      { id: 'an-2',  emoji: '🐯', label: 'Tigre' },
      { id: 'an-3',  emoji: '🦊', label: 'Zorro' },
      { id: 'an-4',  emoji: '🐺', label: 'Lobo' },
      { id: 'an-5',  emoji: '🦅', label: 'Águila' },
      { id: 'an-6',  emoji: '🐉', label: 'Dragón' },
      { id: 'an-7',  emoji: '🦋', label: 'Mariposa' },
      { id: 'an-8',  emoji: '🦈', label: 'Tiburón' },
      { id: 'an-9',  emoji: '🦝', label: 'Mapache' },
      { id: 'an-10', emoji: '🐻', label: 'Oso' },
      { id: 'an-11', emoji: '🦉', label: 'Búho' },
      { id: 'an-12', emoji: '🐍', label: 'Serpiente' },
    ] as AvatarOption[],
  },
  {
    id: 'moods',
    label: '😤 Emociones',
    avatars: [
      { id: 'mo-1',  emoji: '😤', label: 'Intenso' },
      { id: 'mo-2',  emoji: '🤩', label: 'Alucinado' },
      { id: 'mo-3',  emoji: '😎', label: 'Cool' },
      { id: 'mo-4',  emoji: '🥶', label: 'Frío' },
      { id: 'mo-5',  emoji: '🤯', label: 'Mind Blown' },
      { id: 'mo-6',  emoji: '😈', label: 'Diabólico' },
      { id: 'mo-7',  emoji: '👹', label: 'Oni' },
      { id: 'mo-8',  emoji: '🤖', label: 'Robot' },
      { id: 'mo-9',  emoji: '👾', label: 'Alien Gamer' },
      { id: 'mo-10', emoji: '💀', label: 'Calavera' },
      { id: 'mo-11', emoji: '🥷', label: 'Ninja' },
      { id: 'mo-12', emoji: '🤠', label: 'Cowboy' },
    ] as AvatarOption[],
  },
  {
    id: 'street',
    label: '🌃 Calle',
    avatars: [
      { id: 'st-1',  emoji: '🛹', label: 'Skate' },
      { id: 'st-2',  emoji: '✊', label: 'Puño' },
      { id: 'st-3',  emoji: '🤙', label: 'Shaka' },
      { id: 'st-4',  emoji: '🤟', label: 'Love Hip-Hop' },
      { id: 'st-5',  emoji: '👊', label: 'Knock' },
      { id: 'st-6',  emoji: '🚀', label: 'Cohete' },
      { id: 'st-7',  emoji: '🌃', label: 'Noche Urbana' },
      { id: 'st-8',  emoji: '🚇', label: 'Metro' },
      { id: 'st-9',  emoji: '🚴', label: 'BMX' },
      { id: 'st-10', emoji: '⭐', label: 'Estrella' },
      { id: 'st-11', emoji: '🫀', label: 'Corazón' },
      { id: 'st-12', emoji: '🌉', label: 'Puente' },
    ] as AvatarOption[],
  },
  {
    id: 'cosmos',
    label: '🌙 Cosmos',
    avatars: [
      { id: 'co-1',  emoji: '🌙', label: 'Luna' },
      { id: 'co-2',  emoji: '☀️', label: 'Sol' },
      { id: 'co-3',  emoji: '🌊', label: 'Ola' },
      { id: 'co-4',  emoji: '🌋', label: 'Volcán' },
      { id: 'co-5',  emoji: '❄️', label: 'Hielo' },
      { id: 'co-6',  emoji: '🌀', label: 'Ciclón' },
      { id: 'co-7',  emoji: '🔮', label: 'Cristal' },
      { id: 'co-8',  emoji: '💎', label: 'Diamante' },
      { id: 'co-9',  emoji: '🌌', label: 'Galaxia' },
      { id: 'co-10', emoji: '☄️', label: 'Cometa' },
      { id: 'co-11', emoji: '🏔️', label: 'Montaña' },
      { id: 'co-12', emoji: '⚡', label: 'Tormenta' },
    ] as AvatarOption[],
  },
];

const ALL_AVATARS = AVATAR_CATEGORIES.flatMap((c) => c.avatars);

interface AvatarPickerProps {
  currentAvatar?: string;
  onSelect: (emoji: string, label: string) => void;
  onClose: () => void;
}

export function isEmojiAvatar(url?: string): boolean {
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

  return (
    <img
      src={url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
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
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://mi-foto.com/avatar.jpg"
        className="flex-1 px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
      />
      <button
        onClick={() => { if (url.trim()) { onSelect(url.trim(), 'Foto personalizada'); onClose(); } }}
        className="px-3 py-2 rounded-xl bg-surface-elevated border border-acid/40 text-acid font-black text-xs hover:bg-acid hover:text-background transition-colors"
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
    onSelect('emoji:' + r.emoji, r.label);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-surface rounded-3xl border border-acid/30 shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-elevated/60">
          <div>
            <h2 className="font-display font-black text-base text-content-primary tracking-wide">Elige tu Avatar</h2>
            <p className="text-[11px] text-content-muted mt-0.5">Animales, emojis, personajes y más 🎮</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRandom} className="p-2 rounded-xl bg-acid/10 border border-acid/30 text-acid hover:bg-acid hover:text-background transition-all" title="Avatar aleatorio">
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-surface-elevated border border-surface-border text-content-secondary hover:text-content-primary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto border-b border-surface-border/50 bg-surface-elevated/30">
          {AVATAR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={[
                'px-3 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-all border',
                activeCategory === cat.id
                  ? 'bg-acid text-background border-acid shadow-acid-glow'
                  : 'bg-surface text-content-secondary border-surface-border hover:border-acid/40 hover:text-content-primary',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-3">
            {currentCat.avatars.map((av) => {
              const emojiUrl = 'emoji:' + av.emoji;
              const isSelected = currentAvatar === emojiUrl;
              const isHov = hovered === av.id;
              return (
                <button
                  key={av.id}
                  onClick={() => onSelect(emojiUrl, av.label)}
                  onMouseEnter={() => setHovered(av.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={[
                    'relative flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all',
                    isSelected
                      ? 'bg-acid/20 border-acid shadow-acid-glow ring-1 ring-acid/60'
                      : 'bg-surface-elevated/50 border-surface-border hover:border-acid/50 hover:bg-acid/10',
                  ].join(' ')}
                  title={av.label}
                >
                  <span
                    className="text-4xl leading-none transition-transform duration-200"
                    style={{ transform: isHov || isSelected ? 'scale(1.3)' : 'scale(1)' }}
                    role="img"
                    aria-label={av.label}
                  >
                    {av.emoji}
                  </span>
                  <span className="text-[9px] text-content-muted text-center leading-tight truncate w-full">{av.label}</span>
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

        <div className="px-5 py-4 border-t border-surface-border bg-surface-elevated/30 space-y-2">
          <p className="text-[10px] text-content-muted text-center">O usa una foto con URL directa</p>
          <UrlAvatarInput onSelect={onSelect} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
