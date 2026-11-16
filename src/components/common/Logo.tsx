'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  /** Late como un corazón una vez por minuto (barra lateral). */
  beat?: boolean;
  className?: string;
}

const LOGO_SRC = '/brand/larvaz-logo.jpg';

const ICON_BOX = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-11 h-11 rounded-xl',
  lg: 'w-28 h-28 rounded-2xl',
};

const TITLE_SIZE = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  beat = false,
  className = '',
}) => {
  const isHero = size === 'lg';

  const emblem = (
    <span
      className={`relative flex-shrink-0 overflow-hidden border border-surface-border bg-background shadow-acid-sm ring-1 ring-acid/20 transition-all group-hover:border-acid/60 group-hover:ring-acid/50 ${ICON_BOX[size]}`}
    >
      {/* Nuevo logotipo oficial de Larvaz Hip-Hop */}
      <img
        src={LOGO_SRC}
        alt="LARVAZ HIP HOP"
        draggable={false}
        className={`w-full h-full object-cover ${
          beat ? 'animate-logo-heartbeat' : 'transition-transform duration-300 group-hover:scale-110'
        }`}
      />
    </span>
  );

  return (
    <Link
      href="/"
      aria-label="LARVAZ HIP HOP — Inicio"
      className={`group inline-flex select-none ${
        isHero ? 'flex-col items-center gap-2.5 text-center' : 'items-center gap-2.5'
      } ${className}`}
    >
      {emblem}

      {isHero ? (
        showTagline && (
          <span className="text-[10px] uppercase font-bold tracking-[0.28em] text-content-secondary">
            Una Comunidad · Todos los Elementos
          </span>
        )
      ) : (
        <span className="flex min-w-0 flex-col">
          <span className="flex items-baseline gap-1">
            <span className={`font-display font-black text-content-primary leading-none tracking-widest ${TITLE_SIZE[size]}`}>
              LARVAZ
            </span>
            <span className="font-display font-bold text-acid text-[10px] tracking-widest uppercase px-1 py-0.5 rounded bg-acid/10 border border-acid/20">
              HIPHOP
            </span>
          </span>
          {showTagline && (
            <span className="text-[9px] uppercase font-bold tracking-widest text-content-secondary mt-1">
              Una Comunidad · Todos los Elementos
            </span>
          )}
        </span>
      )}
    </Link>
  );
};
