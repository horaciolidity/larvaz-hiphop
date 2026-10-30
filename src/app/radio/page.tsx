'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  Users,
  Disc,
  Send,
  MessageSquare,
  Flame,
  CheckCircle,
  Music,
  ExternalLink,
  Headphones,
  UploadCloud,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import { detectMediaInfo } from '@/lib/media-utils';
import { dataStore } from '@/lib/data-store';

interface Shoutout {
  id: string;
  author: string;
  avatar: string;
  message: string;
  time: string;
}

const INITIAL_SHOUTOUTS: Shoutout[] = [
  {
    id: 's-1',
    author: 'kronos_graff',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    message: 'Saludos a toda la banda pintando esta noche en Santiago. Buen boom-bap sonando!',
    time: 'hace 5m',
  },
  {
    id: 's-2',
    author: 'dj_frecuencia',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    message: 'Ese scratch del minuto 12 está criminal 🔥 Technics al 100%.',
    time: 'hace 18m',
  },
  {
    id: 's-3',
    author: 'bboy_vortex',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100',
    message: 'Entrenando footwork en el linóleo con esta emisora. Puro ritmo.',
    time: 'hace 35m',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Upload To Radio Form — pegar enlace para la rotación comunitaria
// ─────────────────────────────────────────────────────────────────────────────
function UploadToRadioForm() {
  const { currentUser } = useApp();
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentUser.is_guest) {
    return (
      <div className="p-3 rounded-2xl bg-surface-elevated/70 border border-surface-border/60 text-xs text-content-secondary flex items-start gap-2.5">
        <Music className="w-4 h-4 text-acid flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="text-content-primary font-bold">¿Querés poner tu música en la radio?</span>{' '}
          <Link href="/login" className="text-acid underline hover:no-underline">Inicia sesión</Link> y pega tu enlace de YouTube, SoundCloud, Spotify o archivo de audio.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const mediaInfo = detectMediaInfo(link.trim());
      if (!mediaInfo || mediaInfo.type === 'web') {
        // Try to fetch metadata from API
        let fetchedTitle = title.trim();
        let fetchedArtist = artist.trim() || currentUser.full_name;
        let thumbnail: string | undefined = currentUser.avatar_url;
        let embedUrl: string | undefined;

        try {
          const res = await fetch('/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: link.trim() }),
          });
          if (res.ok) {
            const data = await res.json();
            if (!fetchedTitle) fetchedTitle = data.metadata?.title || new URL(link.trim()).hostname;
            if (!fetchedArtist || fetchedArtist === currentUser.full_name) {
              fetchedArtist = data.metadata?.author_name || fetchedArtist;
            }
            thumbnail = data.metadata?.thumbnail_url || thumbnail;
            embedUrl = data.metadata?.embed_url;
          }
        } catch {
          // ignore
        }

        if (!fetchedTitle) {
          setError('No se pudo detectar el tipo de contenido. Pega un enlace de YouTube, SoundCloud, Spotify o un archivo .mp3/.wav directo.');
          setIsLoading(false);
          return;
        }

        dataStore.addTrackToCommunityRadio({
          id: 'track-upload-' + Date.now(),
          title: fetchedTitle,
          artist: fetchedArtist,
          url: link.trim(),
          audio_url: link.trim(),
          album_art: thumbnail,
          user_id: currentUser.id,
          username: currentUser.username,
          submitted_by: currentUser.username,
          created_at: new Date().toISOString(),
        });
      } else {
        // Good media detected
        let fetchedTitle = title.trim();
        let fetchedArtist = artist.trim() || currentUser.full_name;
        let thumbnail: string | undefined = mediaInfo.thumbnailUrl || currentUser.avatar_url;
        let audioUrl = link.trim();

        // Try to get better metadata
        try {
          const res = await fetch('/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: link.trim() }),
          });
          if (res.ok) {
            const data = await res.json();
            if (!fetchedTitle) fetchedTitle = data.metadata?.title || '';
            if (!fetchedArtist || fetchedArtist === currentUser.full_name) {
              fetchedArtist = data.metadata?.author_name || fetchedArtist;
            }
            thumbnail = data.metadata?.thumbnail_url || thumbnail;
          }
        } catch {
          // ignore
        }

        if (!fetchedTitle) {
          fetchedTitle = mediaInfo.type === 'youtube' ? 'Video de YouTube'
            : mediaInfo.type === 'soundcloud' ? 'Track de SoundCloud'
            : mediaInfo.type === 'spotify' ? 'Pista de Spotify'
            : 'Track comunitario';
        }

        dataStore.addTrackToCommunityRadio({
          id: 'track-upload-' + Date.now(),
          title: fetchedTitle,
          artist: fetchedArtist,
          url: audioUrl,
          audio_url: audioUrl,
          album_art: thumbnail,
          user_id: currentUser.id,
          username: currentUser.username,
          submitted_by: currentUser.username,
          genre: mediaInfo.type === 'youtube' ? 'Video' : mediaInfo.type === 'soundcloud' ? 'SoundCloud' : 'Música',
          created_at: new Date().toISOString(),
        });
      }

      setSuccess(true);
      setLink('');
      setTitle('');
      setArtist('');
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError('Error al agregar la pista. Verifica el enlace e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-surface-elevated/60 border border-acid/20 space-y-3">
      <div className="flex items-center gap-2">
        <UploadCloud className="w-4 h-4 text-acid flex-shrink-0" />
        <p className="text-xs font-black text-content-primary uppercase tracking-wide">
          Subir mi música a la radio
        </p>
        <span className="text-[10px] text-content-muted font-mono">
          YouTube · SoundCloud · Spotify · .mp3
        </span>
      </div>

      <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-surface-border focus-within:border-acid transition-colors">
        <LinkIcon className="w-4 h-4 text-acid flex-shrink-0 ml-1" />
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Pega tu enlace: https://youtube.com/watch?v=..., soundcloud.com/..., archivo.mp3"
          className="flex-1 bg-transparent text-xs text-content-primary placeholder:text-content-muted focus:outline-none"
          required
        />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título del tema (opcional, se detecta automáticamente)"
          className="flex-1 px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
        />
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artista (opcional)"
          className="w-36 px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-xs text-magenta bg-magenta/10 border border-magenta/30 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-acid bg-acid/10 border border-acid/30 px-3 py-2 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          ¡Pista agregada a la rotación comunitaria! 🎵
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-content-muted leading-relaxed">
          También puedes publicar un post con tu enlace y se agrega automáticamente.
        </p>
        <button
          type="submit"
          disabled={isLoading || !link.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-acid text-background font-black text-xs shadow-acid-sm hover:bg-acid-hover active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
          <span>Agregar a la Radio</span>
        </button>
      </div>
    </form>
  );
}

export default function RadioPage() {
  const {
    isRadioPlaying,
    currentStation,
    radioStations,
    communityTracks,
    toggleRadio,
    changeStation,
    playCommunityTrack,
    currentUser,
  } = useApp();
  const [shoutouts, setShoutouts] = useState<Shoutout[]>(INITIAL_SHOUTOUTS);
  const [newShoutout, setNewShoutout] = useState('');

  const handleSendShoutout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShoutout.trim()) return;

    const shout: Shoutout = {
      id: 'shout-' + Date.now(),
      author: currentUser.username,
      avatar: currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      message: newShoutout.trim(),
      time: 'ahora',
    };

    setShoutouts([shout, ...shoutouts]);
    setNewShoutout('');
  };

  const [selectedRegion, setSelectedRegion] = useState<string>('Todas');

  const regions = [
    'Todas',
    'Comunidad Larvaz (Global)',
    'Argentina & Cono Sur',
    'Internacional',
    'Nueva York (East Coast)',
    'Costa Oeste & Mundial',
    'Europa / Underground',
  ];

  const filteredStations = selectedRegion === 'Todas'
    ? radioStations
    : radioStations.filter(s => s.region?.includes(selectedRegion) || s.region === selectedRegion);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* 1. Radio Station Player Card */}
      <div className="relative p-6 rounded-3xl bg-surface border border-acid/40 shadow-2xl overflow-hidden text-center space-y-5">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-acid/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-acid animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-acid -ml-4.5" />
            <span className="font-display font-black text-xs text-acid tracking-widest uppercase">
              SEÑAL EN DIRECTO · 24/7
            </span>
            {currentStation.dial && (
              <span className="px-2 py-0.5 rounded-md bg-acid/20 text-acid font-black text-[10px] tracking-wider border border-acid/40">
                {currentStation.dial}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs text-content-secondary">
            <Users className="w-3.5 h-3.5 text-cyan" />
            <span className="font-bold text-content-primary">{currentStation.listeners_count}</span>
            <span>oyentes</span>
          </div>
        </div>

        {/* Vinyl Disc Animation */}
        <div className="relative w-48 h-48 mx-auto my-2">
          {/* Vinyl Disc */}
          <div
            className={`w-full h-full rounded-full bg-[#121212] border-4 border-[#222] shadow-2xl flex items-center justify-center p-4 transition-transform duration-700 ${
              isRadioPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '3s' }}
          >
            {/* Grooves */}
            <div className="w-full h-full rounded-full border border-white/5 flex items-center justify-center p-3">
              <div className="w-full h-full rounded-full border border-white/10 flex items-center justify-center p-3">
                {/* Center Label */}
                <div className="w-16 h-16 rounded-full bg-acid text-background font-black flex items-center justify-center shadow-inner overflow-hidden border-2 border-background">
                  {currentStation.current_track?.album_art ? (
                    <img
                      src={currentStation.current_track.album_art}
                      alt="Album"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc className="w-8 h-8 text-background stroke-[2.5]" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Equalizer Wave Overlay */}
          {isRadioPlaying && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-1 px-3 py-1 rounded-full bg-background/90 border border-acid/50 shadow-acid-glow">
              <span className="w-1 bg-acid animate-pulse h-3 rounded-full" />
              <span className="w-1 bg-acid animate-bounce h-5 rounded-full" style={{ animationDelay: '0.1s' }} />
              <span className="w-1 bg-acid animate-pulse h-4 rounded-full" style={{ animationDelay: '0.2s' }} />
              <span className="w-1 bg-acid animate-bounce h-6 rounded-full" style={{ animationDelay: '0.15s' }} />
              <span className="w-1 bg-acid animate-pulse h-3 rounded-full" style={{ animationDelay: '0.3s' }} />
            </div>
          )}
        </div>

        {/* Current Track Info */}
        <div className="space-y-1 relative z-10">
          <div className="flex items-center justify-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-magenta/20 text-magenta text-[10px] font-bold border border-magenta/30 uppercase">
              {currentStation.region || 'Global Hip-Hop'}
            </span>
          </div>
          <h2 className="font-display font-black text-2xl text-content-primary tracking-wide">
            {currentStation.current_track?.title || 'Boom-Bap Underground Session'}
          </h2>
          <p className="text-sm font-bold text-acid">
            {currentStation.current_track?.artist || 'Larvaz Hip-Hop Radio'}
          </p>
          <p className="text-xs text-content-secondary mt-0.5">
            {currentStation.name} · {currentStation.genre}
          </p>
        </div>

        {/* Play/Pause Main Button */}
        <div className="pt-2 relative z-10">
          <button
            onClick={toggleRadio}
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all shadow-xl active:scale-95 ${
              isRadioPlaying
                ? 'bg-acid text-background shadow-acid-glow hover:bg-acid-hover'
                : 'bg-surface-elevated text-acid border-2 border-acid hover:bg-acid hover:text-background'
            }`}
          >
            {isRadioPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>
          <p className="text-[11px] text-content-muted mt-2 font-medium">
            {isRadioPlaying ? 'Sonando en directo · Haz clic para pausar' : 'Haz clic para escuchar la radio en vivo'}
          </p>
        </div>
      </div>

      {/* 2. Choose Station Selector (GTA Style Dial + Regions) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-display font-black text-sm text-content-primary uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-acid" />
            Emisoras por Región · Estilo GTA
          </h3>
          <span className="text-[11px] text-content-muted">
            Transmisiones en vivo
          </span>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {regions.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedRegion === reg
                  ? 'bg-acid text-background shadow-acid-glow'
                  : 'bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredStations.map((station) => {
            const isSelected = currentStation.id === station.id;
            return (
              <button
                key={station.id}
                onClick={() => changeStation(station.id)}
                className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-surface-elevated border-acid shadow-acid-glow ring-1 ring-acid/50'
                    : 'bg-surface border-surface-border hover:border-acid/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {station.dial && (
                        <span className="px-2 py-0.5 rounded-lg bg-surface-border text-acid font-black text-xs font-mono">
                          {station.dial}
                        </span>
                      )}
                      <span className="font-display font-black text-sm text-content-primary group-hover:text-acid transition-colors">
                        {station.name}
                      </span>
                    </div>
                    {station.is_live && (
                      <span className="w-2 h-2 rounded-full bg-acid animate-pulse flex-shrink-0" />
                    )}
                  </div>
                  {station.region && (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-surface-elevated text-[10px] text-content-secondary border border-surface-border mb-1.5 font-medium">
                      📍 {station.region}
                    </span>
                  )}
                  <p className="text-[11px] text-content-secondary line-clamp-2">
                    {station.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-surface-border/50 flex items-center justify-between text-[10px] text-content-muted">
                  <span className="font-medium text-cyan">{station.genre}</span>
                  <span className="font-bold text-acid">{station.listeners_count} oyentes</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Radio Automática Comunitaria: Canciones subidas por usuarios */}
      <div className="space-y-4 p-5 rounded-3xl bg-surface border border-acid/30 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-acid/20 border border-acid/40 flex items-center justify-center text-acid">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm text-content-primary uppercase tracking-wider flex items-center gap-2">
                Radio Automática Comunitaria 99.9 FM
                <span className="px-2 py-0.5 rounded-full bg-magenta/20 text-magenta text-[9px] font-black border border-magenta/40">
                  {communityTracks.length} PISTAS
                </span>
              </h3>
              <p className="text-[11px] text-content-muted">
                Canciones y enlaces subidos automáticamente por los creadores de la comunidad
              </p>
            </div>
          </div>
          <button
            onClick={() => changeStation('station-comunidad-larvaz')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto ${
              currentStation.id === 'station-comunidad-larvaz'
                ? 'bg-acid text-background shadow-acid-glow'
                : 'bg-surface-elevated text-acid border border-acid/40 hover:bg-acid/10'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Sintonizar 99.9 FM</span>
          </button>
        </div>

        {/* Music Upload Form — pegar enlace de audio/video */}
        <UploadToRadioForm />


        {/* Tracks List */}
        <div className="space-y-2">
          {communityTracks.map((track) => {
            const isThisTrackPlaying =
              isRadioPlaying &&
              currentStation.id === 'station-comunidad-larvaz' &&
              currentStation.current_track?.title === track.title;

            return (
              <div
                key={track.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isThisTrackPlaying
                    ? 'bg-surface-elevated border-acid shadow-acid-glow ring-1 ring-acid/40'
                    : 'bg-surface-elevated/40 border-surface-border hover:border-acid/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-background border border-surface-border flex-shrink-0">
                    {track.album_art ? (
                      <img
                        src={track.album_art}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-acid">
                        <Disc className="w-6 h-6" />
                      </div>
                    )}
                    {isThisTrackPlaying && (
                      <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-acid animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-display font-black text-sm text-content-primary truncate">
                      {track.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-content-secondary flex-wrap">
                      <span className="text-acid font-bold truncate">{track.artist}</span>
                      <span>·</span>
                      <span className="text-content-muted text-[11px]">
                        por @{track.submitted_by || track.username || 'comunidad'}
                      </span>
                      {track.genre && (
                        <span className="px-1.5 py-0.2 rounded bg-surface-border text-cyan text-[10px] font-mono">
                          {track.genre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(track.audio_url || track.url) && (
                    <a
                      href={track.audio_url || track.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-surface-elevated border border-surface-border text-content-muted hover:text-cyan hover:border-cyan/40 transition-colors"
                      title="Abrir enlace original"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <Link
                    href={`/mensajes?user=${track.submitted_by || track.username || 'comunidad'}`}
                    className="p-2 rounded-xl bg-surface-elevated border border-surface-border text-content-muted hover:text-acid hover:border-acid/40 transition-colors"
                    title={`Enviar mensaje a @${track.submitted_by || track.username || 'comunidad'}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => playCommunityTrack(track)}
                    className={`px-3 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 ${
                      isThisTrackPlaying
                        ? 'bg-acid text-background shadow-acid-glow'
                        : 'bg-surface border border-acid/50 text-acid hover:bg-acid hover:text-background'
                    }`}
                  >
                    {isThisTrackPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Sonando</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Reproducir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Muro de la Radio / Saludos al Aire */}
      <div className="space-y-3 p-4 rounded-2xl bg-surface border border-surface-border">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-black text-sm text-content-primary uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan" />
            Muro de la Radio · Saludos en Directo
          </h3>
          <span className="text-[11px] text-content-muted">Comunidad en sintonía</span>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendShoutout} className="flex gap-2">
          <input
            type="text"
            value={newShoutout}
            onChange={(e) => setNewShoutout(e.target.value)}
            placeholder="Manda tu saludo al aire o pide una pista..."
            className="flex-1 px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-acid text-background font-bold text-xs shadow-acid-glow hover:bg-acid-hover transition-colors flex items-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar</span>
          </button>
        </form>

        {/* Shoutouts list */}
        <div className="space-y-2.5 pt-2">
          {shoutouts.map((shout) => (
            <div
              key={shout.id}
              className="p-3 rounded-xl bg-surface-elevated/70 border border-surface-border/60 flex items-start gap-2.5 text-xs"
            >
              <img
                src={shout.avatar}
                alt={shout.author}
                className="w-7 h-7 rounded-full object-cover border border-acid/40 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-acid">@{shout.author}</span>
                  <span className="text-[10px] text-content-muted">{shout.time}</span>
                </div>
                <p className="text-content-secondary mt-0.5 leading-relaxed break-words">
                  {shout.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
