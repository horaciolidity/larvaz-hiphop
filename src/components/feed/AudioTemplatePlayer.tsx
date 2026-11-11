'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { AudioTemplateId } from '@/types';
import { AUDIO_TEMPLATES, DEFAULT_AUDIO_TEMPLATE, filenameFromUrl } from '@/lib/media-utils';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Palette,
  Music,
  AlertCircle,
} from 'lucide-react';

interface AudioTemplatePlayerProps {
  src: string;
  title?: string;
  artist?: string;
  template?: AudioTemplateId;
  autoPlay?: boolean;
  compact?: boolean;
  onChangeTemplate?: (template: AudioTemplateId) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const EQ_BARS = Array.from({ length: 32 }, (_, i) => {
  const wave = Math.sin(i * 0.55) * 0.5 + 0.5;
  return 26 + Math.round(wave * 62);
});

const WAVE_BARS = Array.from({ length: 56 }, (_, i) => {
  const wave =
    Math.abs(Math.sin(i * 0.37)) * 0.55 +
    Math.abs(Math.cos(i * 0.91)) * 0.35 +
    0.1;
  return Math.round(wave * 100);
});

const TemplateBackdrop: React.FC<{ template: AudioTemplateId; playing: boolean }> = ({
  template,
  playing,
}) => {
  const playState = playing ? 'running' : 'paused';

  if (template === 'vinyl') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#2b2b2b_0%,#0b0b0b_55%,#050505_100%)]">
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-44 h-44 sm:w-56 sm:h-56 opacity-90">
          <div
            className="vinyl-disc w-full h-full rounded-full border-[6px] border-black shadow-[0_0_50px_rgba(198,255,0,0.18)]"
            style={{
              animation: 'spin-slow 5.5s linear infinite',
              animationPlayState: playState,
              background:
                'repeating-radial-gradient(circle at center, #1b1b1b 0px, #1b1b1b 2px, #0c0c0c 3px, #0c0c0c 6px)',
            }}
          >
            <div className="absolute inset-[36%] rounded-full bg-acid flex items-center justify-center text-background text-[9px] font-black shadow-lg">
              LARVAZ
            </div>
            <div className="absolute inset-[47%] rounded-full bg-background border border-black" />
          </div>
        </div>
        <div className="absolute left-4 top-4 text-[9px] font-black tracking-[0.25em] text-acid/80 uppercase">
          Vinyl Mode
        </div>
        <div className="absolute right-4 top-5 w-1 h-20 bg-gradient-to-b from-content-secondary/70 to-transparent rounded-full rotate-[24deg] origin-top" />
      </div>
    );
  }

  if (template === 'boombap') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#1c1a12_0%,#0a0a0a_60%)]">
        <div className="absolute inset-x-5 bottom-8 flex items-end justify-center gap-1.5 h-32">
          {EQ_BARS.map((h, i) => (
            <span
              key={i}
              className="eq-bar flex-1 rounded-t-sm bg-gradient-to-t from-acid/30 via-acid to-cyan"
              style={{
                height: `${h}%`,
                animation: `eq-bounce ${0.7 + (i % 5) * 0.12}s ease-in-out infinite alternate`,
                animationDelay: `${(i % 9) * 0.07}s`,
                animationPlayState: playState,
                opacity: 0.55 + (i % 4) * 0.12,
              }}
            />
          ))}
        </div>
        <div className="absolute left-4 top-4 text-[9px] font-black tracking-[0.25em] text-acid/80 uppercase">
          Boom-Bap VU
        </div>
        <div className="absolute right-5 top-6 w-20 h-20 rounded-full border border-surface-border bg-surface/70 flex items-center justify-center">
          <div
            className="w-16 h-16 rounded-full border-2 border-dashed border-acid/50"
            style={{
              animation: 'spin-slow 9s linear infinite',
              animationPlayState: playState,
            }}
          />
        </div>
      </div>
    );
  }

  if (template === 'cassette') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_70%_20%,#241020_0%,#0a0a0a_60%)]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 h-32 rounded-xl bg-surface-elevated border-2 border-surface-border shadow-2xl rotate-[-4deg]">
          <div className="absolute inset-x-4 top-3 h-10 rounded-md bg-background/80 border border-white/5 flex items-center justify-between px-4">
            {[0, 1].map((reel) => (
              <div
                key={reel}
                className="w-7 h-7 rounded-full border-2 border-acid/70 flex items-center justify-center"
                style={{
                  animation: 'spin-slow 3.5s linear infinite',
                  animationDirection: reel === 0 ? 'normal' : 'reverse',
                  animationPlayState: playState,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-acid" />
              </div>
            ))}
          </div>
          <div className="absolute left-4 right-4 bottom-3 h-9 rounded bg-[linear-gradient(180deg,#3b2410,#7a4a1f,#3b2410)] border border-black/50 flex items-center justify-between px-3">
            <span className="text-[8px] font-black tracking-widest text-black/70">SIDE A</span>
            <span className="text-[8px] font-mono text-black/60">90 BPM</span>
          </div>
        </div>
        <div className="absolute left-4 top-4 text-[9px] font-black tracking-[0.25em] text-magenta/80 uppercase">
          Mixtape Mode
        </div>
      </div>
    );
  }

  if (template === 'neon') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#07000d_0%,#100022_55%,#05000a_100%)]">
        <div
          className="absolute inset-x-0 bottom-0 h-2/3 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,217,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,149,0.18) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            transform: 'perspective(220px) rotateX(58deg)',
            transformOrigin: 'bottom',
            animation: 'neon-grid 8s linear infinite',
            animationPlayState: playState,
          }}
        />
        <div
          className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border-2 border-cyan/70 shadow-[0_0_40px_rgba(0,217,255,0.45),inset_0_0_30px_rgba(255,45,149,0.35)]"
          style={{
            animation: 'pulse-glow 2.4s ease-in-out infinite',
            animationPlayState: playState,
          }}
        />
        <div className="absolute left-4 top-4 text-[9px] font-black tracking-[0.25em] text-cyan/80 uppercase">
          Neon Cypher
        </div>
        <div className="absolute right-6 top-6 text-5xl opacity-30 select-none">🎤</div>
      </div>
    );
  }

  if (template === 'graffiti') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#0b0a07]">
        <div
          className="absolute -left-10 top-4 w-48 h-32 rounded-full bg-acid/40 blur-3xl"
          style={{
            animation: 'drift-a 6s ease-in-out infinite alternate',
            animationPlayState: playState,
          }}
        />
        <div
          className="absolute right-0 top-0 w-52 h-40 rounded-full bg-magenta/40 blur-3xl"
          style={{
            animation: 'drift-b 7s ease-in-out infinite alternate',
            animationPlayState: playState,
          }}
        />
        <div
          className="absolute left-1/3 bottom-0 w-44 h-28 rounded-full bg-cyan/30 blur-3xl"
          style={{
            animation: 'drift-a 9s ease-in-out infinite alternate-reverse',
            animationPlayState: playState,
          }}
        />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#fff_0.6px,transparent_0.6px)] [background-size:9px_9px]" />
        <div className="absolute left-4 top-4 text-[9px] font-black tracking-[0.25em] text-acid/80 uppercase">
          Graffiti Splash
        </div>
        <div className="absolute right-5 bottom-5 text-4xl rotate-[-12deg] opacity-70 select-none">🎨</div>
      </div>
    );
  }

  // waveform
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(120deg,#0a1014,#0a0a0a_55%,#141005)]">
      <div className="absolute inset-x-0 bottom-0 h-28 flex items-end gap-0.5 px-3 opacity-90">
        {WAVE_BARS.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-full bg-gradient-to-t from-cyan/20 via-cyan to-acid"
            style={{
              height: `${Math.max(8, h)}%`,
              animation: `eq-bounce ${0.9 + (i % 6) * 0.11}s ease-in-out infinite alternate`,
              animationDelay: `${(i % 13) * 0.05}s`,
              animationPlayState: playState,
            }}
          />
        ))}
      </div>
      <div className="absolute left-4 top-4 text-[9px] font-black tracking-[0.25em] text-cyan/80 uppercase">
        Waveform Wall
      </div>
    </div>
  );
};

export const AudioTemplatePlayer: React.FC<AudioTemplatePlayerProps> = ({
  src,
  title,
  artist,
  template,
  autoPlay = false,
  compact = false,
  onChangeTemplate,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AudioTemplateId>(
    template || DEFAULT_AUDIO_TEMPLATE
  );
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    setSelectedTemplate(template || DEFAULT_AUDIO_TEMPLATE);
  }, [template]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !autoPlay) return;
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [autoPlay, src]);

  const displayTitle = useMemo(
    () => title || filenameFromUrl(src) || 'Audio de la comunidad',
    [title, src]
  );

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setError(true));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const seekBy = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min((audio.duration || duration || 0), audio.currentTime + seconds));
  };

  const changeTemplate = (next: AudioTemplateId) => {
    setSelectedTemplate(next);
    onChangeTemplate?.(next);
    setShowTemplates(false);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-2xl overflow-hidden border border-surface-border bg-black shadow-lg">
      <div className={`relative ${compact ? 'aspect-[16/7]' : 'aspect-[16/9] sm:aspect-[21/9]'}`}>
        <TemplateBackdrop template={selectedTemplate} playing={playing} />

        {/* Track info */}
        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2 pointer-events-none">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
              <Music className="w-3 h-3" />
              <span>Audio Larvaz</span>
            </div>
            <h4 className="font-display font-black text-sm sm:text-base text-white leading-tight truncate drop-shadow-lg max-w-[220px] sm:max-w-[360px]">
              {displayTitle}
            </h4>
            {artist && (
              <p className="text-[10px] text-white/70 truncate max-w-[220px] sm:max-w-[360px]">
                {artist}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowTemplates((v) => !v)}
            className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 border border-white/15 text-[10px] font-bold text-white/80 hover:text-acid hover:border-acid/60 backdrop-blur-sm transition-colors"
            title="Elegir plantilla visual"
          >
            <Palette className="w-3 h-3" />
            <span className="hidden sm:inline">
              {AUDIO_TEMPLATES.find((t) => t.id === selectedTemplate)?.name || 'Plantilla'}
            </span>
          </button>
        </div>

        {/* Big play button */}
        {!playing && !error && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label="Reproducir audio"
          >
            <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-acid text-background flex items-center justify-center shadow-acid-glow group-hover:scale-110 active:scale-95 transition-transform">
              <Play className="w-7 h-7 fill-current ml-0.5" />
            </span>
          </button>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 px-4 text-center">
            <AlertCircle className="w-6 h-6 text-magenta" />
            <p className="text-[11px] text-white/80">
              No se pudo cargar este audio. Probá abrirlo desde el enlace original.
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-acid text-background flex items-center justify-center flex-shrink-0 hover:bg-acid-hover transition-colors"
              aria-label={playing ? 'Pausar' : 'Reproducir'}
            >
              {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => seekBy(-10)}
              className="p-1.5 rounded-lg text-white/70 hover:text-acid transition-colors hidden sm:block"
              aria-label="Retroceder 10 segundos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => seekBy(10)}
              className="p-1.5 rounded-lg text-white/70 hover:text-acid transition-colors hidden sm:block"
              aria-label="Avanzar 10 segundos"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const audio = audioRef.current;
                  if (!audio) return;
                  const next = Number(e.target.value);
                  audio.currentTime = next;
                  setCurrentTime(next);
                }}
                className="w-full h-1.5 cursor-pointer appearance-none rounded-full bg-white/20 accent-acid"
                style={{
                  background: `linear-gradient(to right, #C6FF00 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`,
                }}
                aria-label="Progreso del audio"
              />
              <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-white/60">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const audio = audioRef.current;
                if (!audio) return;
                audio.muted = !muted;
                setMuted(!muted);
              }}
              className="p-1.5 rounded-lg text-white/70 hover:text-acid transition-colors"
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
          onError={() => setError(true)}
          className="hidden"
        />
      </div>

      {showTemplates && (
        <div className="p-2.5 bg-surface border-t border-surface-border animate-fade-in">
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary mb-2">
            Elegí la plantilla visual del audio
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {AUDIO_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => changeTemplate(t.id)}
                className={`flex items-start gap-2 p-2 rounded-xl border text-left transition-colors ${
                  selectedTemplate === t.id
                    ? 'bg-acid/10 border-acid text-acid'
                    : 'bg-surface-elevated border-surface-border text-content-secondary hover:text-content-primary hover:border-content-secondary'
                }`}
              >
                <span className="text-base leading-none">{t.emoji}</span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold truncate">{t.name}</span>
                  <span className="block text-[9px] text-content-muted truncate">{t.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
