'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-xl tracking-wider',
    md: 'text-2xl tracking-widest',
    lg: 'text-4xl tracking-widest',
  };

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Street Monogram Emblem */}
      <div className={`relative ${iconSizes[size]} flex-shrink-0 rounded-lg bg-surface border border-surface-border flex items-center justify-center overflow-hidden group-hover:border-acid transition-colors shadow-acid-sm`}>
        {/* Subtle disc background ring */}
        <div className="absolute inset-0 rounded-full border border-surface-elevated scale-90" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-magenta" />
        
        {/* Sharp Graffiti 'L' */}
        <span className="font-display font-black text-acid group-hover:scale-110 transition-transform leading-none text-lg">
          L
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={`font-display font-black text-content-primary leading-none ${textSizes[size]}`}>
            LARVAZ
          </span>
          <span className="font-display font-bold text-acid text-xs tracking-widest uppercase px-1 py-0.5 rounded bg-acid/10 border border-acid/20">
            HIPHOP
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] uppercase font-bold tracking-widest text-content-secondary mt-1">
            Una Comunidad · Todos los Elementos
          </span>
        )}
      </div>
    </Link>
  );
};
