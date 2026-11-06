'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Users, Calendar, Flame, ExternalLink, HeartHandshake, Radio, Play, Pause, MessageCircle, Search, X, Sliders } from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';

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
    isAdmin,
  } = useApp();

  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const filteredSearchResults = searchUserQuery.trim()
    ? availableProfiles.filter((p) => {
        if (p.id === currentUser.id) return false;
        const q = searchUserQuery.toLowerCase();
        return (
          p.username.toLowerCase().includes(q) ||
          p.full_name.toLowerCase().includes(q) ||
          (p.artistic_disciplines && p.artistic_disciplines.toLowerCase().includes(q))
        );
      }).slice(0, 5)
    : [];

  const suggestedArtists = availableProfiles
    .filter((p) => {
      if (p.id === currentUser.id) return false;
      // Hide admin profiles unless viewer is admin
      if (!isAdmin && (p.role === 'admin' || p.role === 'super_admin')) return false;
      return true;
    })
    .slice(0, 3);
  const upcomingEvents = events.slice(0, 2);

  if (!mounted) {
    return (
      <aside className="hidden xl:flex flex-col gap-5 w-80 h-screen sticky top-0 border-l border-surface-border bg-background/50 backdrop-blur-sm p-6 overflow-y-auto">
        <div className="w-full h-10 rounded-xl bg-surface animate-pulse" />
        <div className="w-full h-40 rounded-xl bg-surface animate-pulse" />
      </aside>
    );
  }

  return (
    <aside className="hidden xl:flex flex-col gap-5 w-80 h-screen sticky top-0 border-l border-surface-border bg-background/50 backdrop-blur-sm p-6 overflow-y-auto">
      {/* 0. BUSCADOR DE USUARIOS CON LUPA */}
      <div className="relative">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-surface-border focus-within:border-acid transition-colors">
          <Search className="w-4 h-4 text-acid flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar usuario o compa..."
            value={searchUserQuery}
            onChange={(e) => setSearchUserQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-content-primary placeholder:text-content-muted focus:outline-none"
          />
          {searchUserQuery && (
            <button
              onClick={() => setSearchUserQuery('')}
              className="text-content-muted hover:text-content-primary p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {searchUserQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 p-2 rounded-xl bg-surface-elevated border border-surface-border shadow-xl z-50 space-y-1">
            {filteredSearchResults.length === 0 ? (
              <p className="text-[11px] text-content-muted p-2 text-center">
                No se encontró a ningún artista con &ldquo;{searchUserQuery}&rdquo;
              </p>
            ) : (
              filteredSearchResults.map((user) => (
                <Link
                  key={user.id}
                  href={`/artista/${user.username}`}
                  onClick={() => setSearchUserQuery('')}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar avatarUrl={user.avatar_url} name={user.full_name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-content-primary group-hover:text-acid truncate">
                        {user.full_name}
                      </p>
                      <p className="text-[10px] text-content-muted truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-acid bg-acid/10 px-2 py-0.5 rounded-full">
                    Ver
                  </span>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
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

      {/* 2.5 ESTUDIO DE MASTERIZACIÓN DE AUDIO INTEGRADO */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-surface-elevated via-surface to-background border border-cyan/40 relative overflow-hidden space-y-2.5 shadow-lg">
        <div className="absolute -top-8 -right-8 w-24 h-24 bg-cyan/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan font-display font-black text-sm tracking-wide">
            <Sliders className="w-4 h-4 text-cyan" />
            <span>🎚️ ESTUDIO DE MASTERING</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-cyan/15 text-cyan text-[9px] font-mono font-bold uppercase border border-cyan/30">
            PRO AUDIO
          </span>
        </div>
        <p className="text-xs text-content-secondary leading-relaxed">
          Masterizá tus canciones, acapellas y beats directo desde Larvaz antes de subirlos a la radio o al muro.
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Link
            href="/estudio"
            className="flex-1 py-2 px-3 rounded-xl bg-cyan text-background font-black text-xs text-center hover:opacity-90 transition-all shadow-sm"
          >
            Abrir en Larvaz
          </Link>
          <a
            href="https://app-master-audio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-surface-elevated border border-surface-border hover:border-cyan text-content-secondary hover:text-cyan transition-colors"
            title="Ir a https://app-master-audio.vercel.app/"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 3. ARTISTAS Y COLECTIVOS SUGERIDOS */}
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
                  <UserAvatar
                    avatarUrl={artist.avatar_url}
                    name={artist.full_name}
                    size="sm"
                    className="group-hover:border-acid transition-colors"
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

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link
                    href={currentUser.is_guest ? '#' : `/mensajes?user=${artist.username}`}
                    onClick={(e) => {
                      if (currentUser.is_guest) {
                        e.preventDefault();
                        window.dispatchEvent(
                          new CustomEvent('larvaz:require-login', {
                            detail: { reason: `Iniciá sesión para enviar mensajes privados a @${artist.username}.` },
                          })
                        );
                      }
                    }}
                    className="p-1.5 rounded-full bg-surface-elevated hover:bg-surface border border-surface-border hover:border-acid text-content-secondary hover:text-acid transition-colors"
                    title={`Enviar mensaje a @${artist.username}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => {
                      if (currentUser.is_guest) {
                        window.dispatchEvent(
                          new CustomEvent('larvaz:require-login', {
                            detail: { reason: `Iniciá sesión para seguir a @${artist.username} y armar tu red.` },
                          })
                        );
                        return;
                      }
                      toggleFollow(artist.id);
                    }}
                    className={`text-xs px-3 py-1 rounded-full font-bold transition-all flex-shrink-0 ${
                      following
                        ? 'bg-surface-elevated text-content-secondary hover:text-content-primary hover:border-surface-border border border-transparent'
                        : 'bg-acid text-background hover:bg-acid-hover shadow-acid-sm'
                    }`}
                  >
                    {following ? 'Siguiendo' : 'Seguir'}
                  </button>
                </div>
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
