'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Mic2, Disc3, Flame, X, Users, Eye, Lock, Sliders } from 'lucide-react';

/**
 * GuestWall — Modo Observador estricto para visitantes no registrados.
 * - Muestra una barra persistente recomendando iniciar sesión con cuenta regresiva.
 * - Al agotarse el breve tiempo de observación (18s) o al intentar interactuar
 *   (publicar, mensajear, dar like, comentar, seguir), despliega el bloqueo de login.
 */
export const GuestWall: React.FC = () => {
  const { currentUser, totalMembersCount } = useApp();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissedCount, setDismissedCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(18);
  const [triggerReason, setTriggerReason] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for custom event when a guest attempts to interact (like, comment, message, post, follow)
  useEffect(() => {
    if (!mounted) return;
    const handleRequireLogin = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string }>;
      setTriggerReason(
        customEvent.detail?.reason ||
          'En Modo Observador no podés publicar, enviar mensajes ni interactuar. Iniciá sesión para participar.'
      );
      setVisible(true);
    };
    window.addEventListener('larvaz:require-login', handleRequireLogin);
    return () => window.removeEventListener('larvaz:require-login', handleRequireLogin);
  }, [mounted]);

  const handleDismiss = useCallback(() => {
    // Only allow 1 brief extra peek of 10 seconds
    if (dismissedCount >= 1) return;
    setDismissedCount((prev) => prev + 1);
    setVisible(false);
    setTriggerReason(null);
    setSecondsLeft(10);
  }, [dismissedCount]);

  useEffect(() => {
    if (!mounted) return;
    if (!currentUser.is_guest) {
      setVisible(false);
      return;
    }
    if (visible) return;

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
  }, [mounted, currentUser.is_guest, visible, dismissedCount]);

  if (!mounted || !currentUser.is_guest) return null;

  const memberCount = totalMembersCount || 10;
  const canDismiss = dismissedCount < 1;

  return (
    <>
      {/* 1. BARRA PERSISTENTE DE MODO OBSERVADOR (Siempre visible mientras mira el muro) */}
      {!visible && (
        <div className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-auto md:right-6 z-40 max-w-md mx-auto md:mx-0 pointer-events-auto">
          <div className="p-3 rounded-2xl bg-background/95 backdrop-blur-xl border-2 border-acid/60 shadow-acid-glow flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-acid/20 text-acid">
                  <Eye className="w-3.5 h-3.5 animate-pulse" />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-acid flex items-center gap-1.5">
                    <span>MODO OBSERVADOR (SOLO LECTURA)</span>
                    <span className="px-1.5 py-0.2 rounded bg-acid text-background font-mono text-[10px]">
                      {secondsLeft}s
                    </span>
                  </p>
                  <p className="text-[10px] text-content-secondary leading-tight">
                    Iniciá sesión para publicar, mensajear artistas y usar todo Larvaz.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-acid via-cyan to-magenta transition-all duration-1000"
                style={{ width: `${Math.min(100, (secondsLeft / 18) * 100)}%` }}
              />
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <Link
                href="/login"
                className="flex-1 py-1.5 px-3 rounded-xl bg-acid text-background font-black text-xs text-center shadow-acid-sm hover:bg-acid-hover transition-all"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="flex-1 py-1.5 px-3 rounded-xl bg-surface-elevated border border-acid/40 text-content-primary hover:border-acid font-bold text-xs text-center transition-all"
              >
                Crear Cuenta Gratis
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL DE BLOQUEO MODO OBSERVADOR */}
      {visible && (
        <>
          <div
            className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md"
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Iniciá sesión en Larvaz Hip-Hop"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md rounded-3xl bg-surface border-2 border-acid/50 shadow-acid-glow overflow-hidden animate-fade-in">
              {/* Decorative neon top bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-acid via-cyan to-magenta" />

              {canDismiss && (
                <button
                  onClick={handleDismiss}
                  className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-surface-border text-[10px] text-content-muted hover:text-content-primary transition-colors flex items-center gap-1"
                  aria-label="Mirar 10 segundos más"
                >
                  <span>Mirar 10s más</span>
                  <X className="w-3 h-3" />
                </button>
              )}

              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-acid/15 border border-acid/40 flex items-center justify-center flex-shrink-0 shadow-acid-sm">
                    <Lock className="w-6 h-6 text-acid" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-magenta/15 border border-magenta/30 text-magenta text-[9px] font-mono font-bold uppercase mb-0.5">
                      <span>TIEMPO DE OBSERVADOR AGOTADO</span>
                    </div>
                    <p className="font-display font-black text-xl text-content-primary tracking-wide leading-tight">
                      INICIÁ SESIÓN EN <span className="text-acid">LARVAZ HIPHOP</span>
                    </p>
                  </div>
                </div>

                {/* Specific Trigger Reason if clicked an action */}
                {triggerReason ? (
                  <div className="p-3 rounded-2xl bg-magenta/10 border border-magenta/30 text-xs text-content-primary font-medium leading-relaxed">
                    🔒 {triggerReason}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-content-primary leading-relaxed font-semibold">
                      Los visitantes sin sesión activa solo están en <span className="text-acid">Modo Observador</span> por tiempo limitado.
                    </p>
                    <p className="text-xs text-content-secondary leading-relaxed">
                      Para publicar en el muro, enviar mensajes privados a otros artistas, dar Props, comentar o guardar tus masters en el estudio, te recomendamos iniciar sesión o crear tu cuenta gratuita. 🎤🎨🎧
                    </p>
                  </div>
                )}

                {/* Feature highlights */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-surface-elevated/80 border border-surface-border flex items-center gap-2 text-content-secondary">
                    <Flame className="w-4 h-4 text-acid flex-shrink-0" />
                    <span>Publicar en el Muro</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-elevated/80 border border-surface-border flex items-center gap-2 text-content-secondary">
                    <Mic2 className="w-4 h-4 text-cyan flex-shrink-0" />
                    <span>Mensajes Privados</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-elevated/80 border border-surface-border flex items-center gap-2 text-content-secondary">
                    <Sliders className="w-4 h-4 text-magenta flex-shrink-0" />
                    <span>Estudio de Mastering</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-elevated/80 border border-surface-border flex items-center gap-2 text-content-secondary">
                    <Disc3 className="w-4 h-4 text-acid flex-shrink-0" />
                    <span>Subir a Radio 24/7</span>
                  </div>
                </div>

                {/* Community count */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-acid/10 border border-acid/20 text-xs">
                  <Users className="w-3.5 h-3.5 text-acid flex-shrink-0" />
                  <span className="text-content-secondary">
                    Sumate a los <strong className="text-acid font-bold">{memberCount} artistas</strong> activos hoy en la comunidad
                  </span>
                </div>

                {/* Primary Login / Register CTAs */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-acid text-background font-black text-sm shadow-acid-glow hover:bg-acid-hover transition-all active:scale-95"
                  >
                    <Mic2 className="w-4 h-4" />
                    <span>Iniciar Sesión Ahora</span>
                  </Link>

                  <Link
                    href="/registro"
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-surface-elevated border border-cyan/40 text-content-primary font-bold text-sm hover:border-cyan hover:text-cyan transition-all"
                  >
                    <Flame className="w-4 h-4 text-cyan" />
                    <span>Crear Cuenta Gratis (30 seg)</span>
                  </Link>
                </div>

                <p className="text-center text-[10px] text-content-muted leading-relaxed">
                  100% gratuito · Sin publicidad invasiva · Cultura Hip-Hop real 🔥
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
