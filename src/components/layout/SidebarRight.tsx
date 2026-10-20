'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Users, Calendar, Flame, ExternalLink, HeartHandshake, Radio, Play, Pause } from 'lucide-react';

export const SidebarRight: React.FC = () => {
  const {
    availableProfiles,
    currentUser,
    isFollowing,
    toggleFollow,
    events,
    isRadioPlaying,
    toggleRadio,
    currentStation,
  } = useApp();

  const suggestedArtists = availableProfiles.filter((p) => p.id !== currentUser.id).slice(0, 3);
  const upcomingEvents = events.slice(0, 2);

  return (
    <aside className="hidden xl:flex flex-col gap-5 w-80 h-screen sticky top-0 border-l border-surface-border bg-background/50 backdrop-blur-sm p-6 overflow-y-auto">
      {/* 1. MANIFIESTO CULTURAL URBANO */}
      <div className="p-4 rounded-2xl bg-surface border border-surface-border relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-acid/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 text-acid font-display font-black text-lg tracking-wider mb-1">
          <Flame className="w-5 h-5 text-acid" />
          <span>MANIFIESTO LARVAZ</span>
        </div>
        <p className="text-xs text-content-secondary leading-relaxed mb-3">
          Un solo muro digital. No dividimos la cultura: MC, DJ, Breaking, Graffiti y Beatmaking conviven en un mismo espacio libre.
        </p>
        <Link
          href="/explorar"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-acid hover:underline"
        >
          <span>Descubrir todos los elementos</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. RADIO STREAM WIDGET */}
      <div className="p-4 rounded-2xl bg-surface border border-acid/30 relative overflow-hidden space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-acid font-display font-black text-sm tracking-wide">
            <Radio className="w-4 h-4" />
            <span>RADIO UNDERGROUND 24/7</span>
          </div>
          {isRadioPlaying && <span className="w-2 h-2 rounded-full bg-acid animate-ping" />}
        </div>
        <div>
          <p className="text-xs font-bold text-content-primary truncate">
            {currentStation.current_track?.title || 'Boom-Bap 90s Live'}
          </p>
          <p className="text-[11px] text-content-secondary truncate">
            {currentStation.name} · {currentStation.listeners_count} oyentes
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={toggleRadio}
            className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              isRadioPlaying
                ? 'bg-acid text-background shadow-acid-glow'
                : 'bg-surface-elevated text-acid border border-acid/50 hover:bg-acid hover:text-background'
            }`}
          >
            {isRadioPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
            <span>{isRadioPlaying ? 'Pausar' : 'Sintonizar'}</span>
          </button>
          <Link
            href="/radio"
            className="p-2 rounded-xl bg-surface-elevated border border-surface-border hover:border-acid text-content-secondary hover:text-acid transition-colors"
            title="Abrir sintonizador completo"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. ARTISTAS Y COLECTIVOS SUGERIDOS */}
      <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-content-primary font-bold text-sm">
            <Users className="w-4 h-4 text-cyan" />
            <span>Creadores de la Comunidad</span>
          </div>
          <Link href="/explorar?tab=artistas" className="text-[11px] text-content-secondary hover:text-acid">
            Ver más
          </Link>
        </div>

        <div className="space-y-3">
          {suggestedArtists.map((artist) => {
            const following = isFollowing(artist.id);

            return (
              <div key={artist.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/artista/${artist.username}`}
                  className="flex items-center gap-2.5 min-w-0 group"
                >
                  <img
                    src={artist.avatar_url}
                    alt={artist.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-surface-elevated group-hover:border-acid transition-colors flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-content-primary truncate group-hover:text-acid transition-colors">
                      {artist.full_name}
                    </p>
                    <p className="text-[10px] text-content-secondary truncate">
                      @{artist.username}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => toggleFollow(artist.id)}
                  className={`text-xs px-3 py-1 rounded-full font-bold transition-all flex-shrink-0 ${
                    following
                      ? 'bg-surface-elevated text-content-secondary hover:text-content-primary hover:border-surface-border border border-transparent'
                      : 'bg-acid text-background hover:bg-acid-hover shadow-acid-sm'
                  }`}
                >
                  {following ? 'Siguiendo' : 'Seguir'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PRÓXIMOS EVENTOS */}
      <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-content-primary font-bold text-sm">
            <Calendar className="w-4 h-4 text-orange" />
            <span>Próximos Encuentros</span>
          </div>
          <Link href="/eventos" className="text-[11px] text-content-secondary hover:text-acid">
            Agenda
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingEvents.map((ev) => (
            <Link
              key={ev.id}
              href={`/eventos/${ev.slug}`}
              className="block p-2.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border/60 hover:border-acid/40 transition-colors group"
            >
              <p className="text-xs font-bold text-content-primary group-hover:text-acid line-clamp-1">
                {ev.title}
              </p>
              <p className="text-[11px] text-content-secondary mt-1 flex items-center justify-between">
                <span>{ev.location.split(',')[0]}</span>
                <span className="text-acid font-medium">
                  {new Date(ev.start_date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. APORTE COMUNITARIO */}
      <div className="mt-auto p-4 rounded-2xl bg-surface border border-surface-border/80 text-xs text-content-secondary space-y-2">
        <div className="flex items-center gap-2 text-content-primary font-bold">
          <HeartHandshake className="w-4 h-4 text-magenta" />
          <span>Sostener Larvaz</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Plataforma libre y autogestionada. Los aportes voluntarios cubren servidores, moderación y soporte cultural.
        </p>
        <Link
          href="/apoyar-larvaz"
          className="inline-block w-full text-center py-2 rounded-lg bg-surface-elevated hover:bg-magenta/20 hover:text-magenta text-content-primary font-bold text-xs border border-surface-border transition-colors"
        >
          Conocer más / Aportar
        </Link>
      </div>
    </aside>
  );
};
