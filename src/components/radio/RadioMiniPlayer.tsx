'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Radio, Play, Pause, Volume2, SkipForward } from 'lucide-react';

export const RadioMiniPlayer: React.FC = () => {
  const { isRadioPlaying, currentStation, toggleRadio, changeStation, radioStations } = useApp();

  const handleNextStation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentIndex = radioStations.findIndex((s) => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % radioStations.length;
    changeStation(radioStations[nextIndex].id);
  };

  return (
    <div className="fixed bottom-14 md:bottom-3 left-0 right-0 md:left-auto md:right-4 z-40 px-2 md:px-0 max-w-md md:max-w-sm mx-auto md:mx-0 pointer-events-auto">
      <div className="bg-surface-elevated/95 backdrop-blur-md border border-acid/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 text-content-primary">
        {/* Equalizer animation & Title */}
        <Link
          href="/radio"
          className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-background border border-surface-border flex-shrink-0 flex items-center justify-center">
            {currentStation.current_track?.album_art ? (
              <img
                src={currentStation.current_track.album_art}
                alt="Album"
                className="w-full h-full object-cover"
              />
            ) : (
              <Radio className="w-5 h-5 text-acid" />
            )}
            {isRadioPlaying && (
              <div className="absolute inset-0 bg-background/60 flex items-end justify-center pb-1 gap-0.5">
                <span className="w-1 bg-acid animate-pulse h-4 rounded-full" />
                <span className="w-1 bg-acid animate-bounce h-5 rounded-full" style={{ animationDelay: '0.15s' }} />
                <span className="w-1 bg-acid animate-pulse h-3 rounded-full" style={{ animationDelay: '0.3s' }} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-acid animate-ping" />
              <span className="text-[10px] font-bold text-acid tracking-wider uppercase truncate">
                RADIO EN VIVO · {currentStation.name}
              </span>
            </div>
            <p className="text-xs font-bold text-content-primary truncate">
              {currentStation.current_track?.title || 'Hip-Hop Underground Non-Stop'}
            </p>
            <p className="text-[10px] text-content-secondary truncate">
              {currentStation.current_track?.artist || 'Larvaz Radio Network'}
            </p>
          </div>
        </Link>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleNextStation}
            title="Cambiar emisora"
            className="p-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-surface transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={toggleRadio}
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all shadow-md ${
              isRadioPlaying
                ? 'bg-acid text-background shadow-acid-glow scale-105'
                : 'bg-surface border border-surface-border text-acid hover:border-acid'
            }`}
          >
            {isRadioPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
