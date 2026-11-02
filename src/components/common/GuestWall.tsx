'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Mic2, Disc3, Flame, X, Users } from 'lucide-react';

/**
 * GuestWall — Muestra el cartelito comunitario a visitantes no registrados
 * después de 60 segundos de navegación libre.
 * Vibe: plaza de barrio, sin pretensiones, cultura real.
 */
export const GuestWall: React.FC = () => {
  const { currentUser, totalMembersCount } = useApp();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setVisible(false);
    // Allow another 30 seconds before re-showing
    setTimeout(() => {
      if (currentUser.is_guest) {
        setDismissed(false);
        setSecondsLeft(30);
      }
    }, 30_000);
  }, [currentUser.is_guest]);

  useEffect(() => {
    // Only run for guest users
    if (!currentUser.is_guest) return;
    if (dismissed) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setVisible(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser.is_guest, dismissed]);

  // Hide if user logs in
  useEffect(() => {
    if (!currentUser.is_guest) {
      setVisible(false);
    }
  }, [currentUser.is_guest]);

  if (!visible || !currentUser.is_guest) return null;

  const memberCount = totalMembersCount || 0;

  return (
    <>
      {/* Backdrop blur overlay */}
      <div
        className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Únete a la comunidad Larvaz Hip-Hop"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      >
        <div className="relative w-full max-w-sm rounded-3xl bg-surface border border-acid/40 shadow-acid-glow overflow-hidden">
          {/* Decorative acid glow top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-acid via-cyan to-acid" />

          {/* Close button (lets them keep browsing 30 more seconds) */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors"
            aria-label="Cerrar y seguir mirando un momento"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-acid/15 border border-acid/30 flex items-center justify-center flex-shrink-0">
                <Disc3 className="w-6 h-6 text-acid animate-spin-slow" />
              </div>
              <div>
                <p className="font-display font-black text-lg text-acid tracking-wide leading-tight">
                  LARVAZ HIPHOP
                </p>
                <p className="text-[11px] text-content-secondary font-mono uppercase tracking-wider">
                  El muro del barrio, abierto pa' todos
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <p className="text-sm text-content-primary leading-relaxed font-medium">
                Che, estás viendo el muro comunitario. Para postear tus temas,
                barras o piezas y ser parte de la movida…
              </p>
              <p className="text-xs text-content-secondary leading-relaxed">
                Hacé tu cuenta, es gratis y sin rollos. 
                Como llegar a la plaza: sin invitación, sin costo.
                Solo traé tu cultura. 🎤🎨🎧
              </p>
            </div>

            {/* Community count */}
            {memberCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-acid/10 border border-acid/20 text-xs">
                <Users className="w-3.5 h-3.5 text-acid flex-shrink-0" />
                <span className="text-content-secondary">
                  Ya somos{' '}
                  <strong className="text-acid font-bold">{memberCount} artistas</strong>{' '}
                  en el muro — entrá y publicá lo tuyo
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/registro"
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-acid text-background font-black text-sm shadow-acid-glow hover:bg-acid-hover transition-all active:scale-95"
              >
                <Flame className="w-4 h-4" />
                <span>Entrar a la comunidad</span>
              </Link>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl bg-surface-elevated border border-surface-border text-content-primary font-bold text-sm hover:border-acid/50 transition-all"
              >
                <Mic2 className="w-4 h-4 text-cyan" />
                <span>Ya tengo cuenta — Entrar</span>
              </Link>
            </div>

            {/* Footer note */}
            <p className="text-center text-[10px] text-content-muted leading-relaxed">
              Seguís en el muro como visitante. Pero para publicar, seguir artistas 
              y disfrutar todo Larvaz, necesitás registrarte. Es rápido. 🔥
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

