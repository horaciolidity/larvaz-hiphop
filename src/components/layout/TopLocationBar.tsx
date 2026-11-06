'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { MapPin, Radio, Share2, Check, Edit3, X, Users } from 'lucide-react';
import { getLocationFlag } from '@/lib/country-utils';


export const TopLocationBar: React.FC = () => {
  const { userLocation, setUserLocation, currentStation, isRadioPlaying, currentUser, totalMembersCount } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [tempLocation, setTempLocation] = useState(userLocation);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!mounted) {
    return <div className="w-full bg-surface-elevated/90 border-b border-surface-border text-xs px-3 sm:px-4 py-2 h-9" />;
  }

  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempLocation.trim()) {
      setUserLocation(tempLocation.trim());
    }
    setIsEditing(false);
  };

  const handleCopyRef = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const refParam = currentUser.is_guest ? '' : `?ref=${currentUser.username}`;
    const link = `${origin}/registro${refParam}`;
    navigator.clipboard?.writeText(link);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="w-full bg-surface-elevated/90 backdrop-blur-md border-b border-surface-border text-xs px-3 sm:px-4 py-2 flex items-center justify-between gap-2 z-30">
      {/* 1. Location Badge */}
      <div className="flex items-center gap-1.5 min-w-0">
        <MapPin className="w-3.5 h-3.5 text-acid flex-shrink-0" />
        {isEditing ? (
          <form onSubmit={handleSaveLocation} className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              value={tempLocation}
              onChange={(e) => setTempLocation(e.target.value)}
              placeholder="ej: Mendoza, Argentina"
              className="py-0.5 px-2 text-xs rounded-lg bg-surface border border-acid text-content-primary focus:outline-none w-36 sm:w-48"
            />
            <button
              type="submit"
              className="p-1 rounded-md bg-acid text-background font-bold hover:bg-acid-hover"
              title="Guardar ubicación"
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 rounded-md bg-surface text-content-muted hover:text-content-primary"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => {
                setTempLocation(userLocation);
                setIsEditing(true);
              }}
              className="flex items-center gap-1 font-bold text-content-primary hover:text-acid transition-colors truncate group"
              title="Haz clic para cambiar tu ubicación geográfica"
            >
              {getLocationFlag(userLocation) && (
                <span className="text-sm leading-none flex-shrink-0" aria-hidden="true">
                  {getLocationFlag(userLocation)}
                </span>
              )}
              <span className="truncate">{userLocation}</span>
              <Edit3 className="w-3 h-3 text-content-muted group-hover:text-acid transition-colors flex-shrink-0" />
            </button>
            <span className="hidden sm:inline-block text-[10px] text-content-muted uppercase tracking-wider">
              · Escena Local
            </span>
          </div>
        )}
      </div>

      {/* 2. Center — Member count badge */}
      {totalMembersCount > 0 && (
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-acid/10 border border-acid/25 text-[11px] font-mono flex-shrink-0"
          title="Artistas y comunidad registrada en Larvaz Hip-Hop"
        >
          <Users className="w-3 h-3 text-acid" />
          <span className="font-bold text-acid">{totalMembersCount}</span>
          <span className="text-content-secondary">en la movida</span>
        </div>
      )}

      {/* 3. Radio & Referral Quick Bar */}
      <div className="flex items-center gap-2 flex-shrink-0 text-[11px]">
        {/* Radio Pill */}
        <div className="hidden xs:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface border border-surface-border text-content-secondary">
          <span className={`w-1.5 h-1.5 rounded-full ${isRadioPlaying ? 'bg-acid animate-ping' : 'bg-content-muted'}`} />
          <Radio className="w-3 h-3 text-acid" />
          <span className="font-semibold truncate max-w-[110px] sm:max-w-[160px]">
            {currentStation.dial || '99.9 FM'}
          </span>
        </div>

        {/* Quick Referral Share Button */}
        {!currentUser.is_guest && (
          <button
            onClick={handleCopyRef}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-full font-bold text-[11px] transition-all border ${
              copiedRef
                ? 'bg-acid/20 border-acid text-acid shadow-acid-sm'
                : 'bg-surface hover:bg-surface-elevated text-content-primary border-surface-border hover:border-acid'
            }`}
            title="Copiar tu enlace de referido para invitar amigos y ganar props"
          >
            {copiedRef ? (
              <>
                <Check className="w-3 h-3 text-acid" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3 text-magenta" />
                <span>Invitar (+50 Props)</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
