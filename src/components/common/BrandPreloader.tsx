'use client';

import React, { useEffect, useRef, useState } from 'react';

interface BrandPreloaderProps {
  /** Texto principal bajo el logotipo. */
  message?: string;
  /** Línea secundaria opcional. */
  hint?: string;
  /** Tiempo total del precargado en milisegundos (2s por defecto). */
  duration?: number;
  /** Se llama cuando termina el precargado y la cortina ya se desvaneció. */
  onDone?: () => void;
}

const LOGO_SRC = '/brand/larvaz-logo.jpg';

/**
 * Precargado de marca: logotipo circular girando durante 2 segundos.
 * Se usa al entrar al mastering, al editor de video y al entrar desde el login.
 */
export const BrandPreloader: React.FC<BrandPreloaderProps> = ({
  message = 'Cargando Larvaz...',
  hint,
  duration = 2000,
  onDone,
}) => {
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setLeaving(true), duration);
    const doneTimer = window.setTimeout(() => doneRef.current?.(), duration + 320);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Larvaz Hip-Hop — ${message}`}
      className={`fixed inset-0 z-[130] flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-md px-6 transition-opacity duration-300 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Resplandores de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-acid/10 blur-[90px]" />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-magenta/10 blur-[90px]" />
        <div className="absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/10 blur-[70px]" />
      </div>

      {/* Logotipo circular girando */}
      <div className="relative h-28 w-28 sm:h-32 sm:w-32">
        <div className="absolute -inset-3 rounded-full border border-acid/25 animate-preloader-pulse" />
        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-acid/40 via-cyan/25 to-magenta/40 blur-md" />
        <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-acid/70 shadow-[0_0_45px_rgba(198,255,0,0.35)]">
          <img
            src={LOGO_SRC}
            alt="LARVAZ HIP HOP"
            draggable={false}
            className="h-full w-full object-cover animate-logo-spin"
          />
        </div>
      </div>

      <div className="relative space-y-1.5 text-center">
        <p className="font-display font-black text-2xl tracking-[0.32em] text-content-primary">
          LARVAZ
        </p>
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-acid">{message}</p>
        {hint && <p className="text-[11px] text-content-secondary">{hint}</p>}
      </div>

      {/* Barra de progreso del precargado */}
      <div className="relative h-1 w-44 overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full bg-gradient-to-r from-acid via-cyan to-magenta animate-preloader-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};
