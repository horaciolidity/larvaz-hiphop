'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Sliders,
  Maximize2,
  Minimize2,
  RotateCcw,
  ExternalLink,
  Radio,
  Sparkles,
  Volume2,
  Headphones,
  CheckCircle2,
  Flame,
  PlusCircle,
  Lock,
  Disc3,
} from 'lucide-react';

const MASTERING_APP_URL = 'https://app-master-audio.vercel.app/';

export default function EstudioMasteringPage() {
  const { currentUser } = useApp();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  if (!mounted) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-24 rounded-2xl bg-surface animate-pulse" />
        <div className="h-[600px] rounded-2xl bg-surface animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full p-3 sm:p-5 space-y-5">
      {/* Guest Notice Banner if not logged in */}
      {currentUser.is_guest && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-acid/15 via-surface-elevated to-cyan/15 border border-acid/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-acid-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-acid/20 border border-acid/40 flex items-center justify-center text-acid flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-content-primary">
                Estás probando Larvaz Studio en <span className="text-acid">Modo Observador</span>
              </p>
              <p className="text-[11px] text-content-secondary">
                Iniciá sesión o registrate gratis para guardar tus temas y publicarlos en el Muro y Radio Larvaz.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/login"
              className="flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-xl bg-surface border border-surface-border hover:border-acid text-xs font-bold text-content-primary transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-xl bg-acid text-background text-xs font-black shadow-acid-sm hover:bg-acid-hover transition-colors"
            >
              Crear Cuenta
            </Link>
          </div>
        </div>
      )}

      {/* 1. Studio Header Card */}
      <div className="relative rounded-2xl bg-gradient-to-br from-surface-elevated via-surface to-background border border-cyan/30 p-4 sm:p-5 shadow-2xl overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-acid/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan/15 border border-cyan/30 text-cyan text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sliders className="w-3 h-3" />
              <span>HERRAMIENTA OFICIAL INTEGRADA EN LARVAZ</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-content-primary tracking-wide flex items-center gap-2">
              <span>🎚️ LARVAZ MASTERING STUDIO</span>
            </h1>
            <p className="text-xs text-content-secondary max-w-xl leading-relaxed">
              Masterizá tus canciones, voces de freestyle y beats de hip-hop directamente desde Larvaz.
              Dale pegada de estudio profesional a tus audios antes de soltarlos en la radio o en el muro.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-acid text-background font-black text-xs shadow-acid-sm hover:bg-acid-hover transition-all"
              title="Expandir estudio a pantalla completa dentro de Larvaz"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pantalla Completa</span>
            </button>

            <a
              href={MASTERING_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border hover:border-cyan text-content-primary hover:text-cyan text-xs font-bold transition-all"
              title="Abrir App Master Audio en nueva pestaña"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan" />
              <span>Abrir Web Externa</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Embedded Studio Container (Standard or Fullscreen Theater Mode) */}
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 bg-background flex flex-col'
            : 'relative rounded-2xl overflow-hidden border-2 border-surface-border hover:border-cyan/40 transition-colors bg-[#09090b] shadow-2xl flex flex-col'
        }
      >
        {/* Studio Toolbar */}
        <div className="bg-surface-elevated border-b border-surface-border px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-acid animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-acid uppercase tracking-wider">
                CONSOLA ACTIVA
              </span>
            </span>
            <span className="text-content-muted text-xs hidden sm:inline">|</span>
            <span className="text-xs text-content-secondary truncate hidden sm:inline font-mono">
              Motor DSP: app-master-audio.vercel.app (Embebido en Larvaz)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReload}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-acid text-content-secondary hover:text-acid text-[11px] font-semibold transition-colors"
              title="Reiniciar consola de audio"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>

            <a
              href={MASTERING_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-cyan text-content-secondary hover:text-cyan text-[11px] font-semibold transition-colors"
              title="Vínculo directo a https://app-master-audio.vercel.app/"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden md:inline">Enlace Directo</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-acid/15 border border-acid/40 text-acid hover:bg-acid hover:text-background text-[11px] font-bold transition-colors"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Salir de Pantalla Completa</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ampliar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 top-11 z-10 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan/15 border border-cyan/40 flex items-center justify-center text-cyan">
              <Disc3 className="w-7 h-7 animate-spin-slow" />
            </div>
            <p className="font-display font-black text-lg text-content-primary tracking-wider">
              CARGANDO CONSOLA DE MASTERIZACIÓN LARVAZ...
            </p>
            <p className="text-xs text-content-secondary max-w-xs">
              Conectando los procesadores de audio para tus pistas y beats.
            </p>
          </div>
        )}

        {/* Embedded WebApp Iframe */}
        <iframe
          key={iframeKey}
          src={MASTERING_APP_URL}
          title="Larvaz Mastering Studio — Masterización de Audio"
          className={`w-full border-0 bg-[#09090b] ${
            isFullscreen ? 'flex-1 h-full' : 'h-[680px] sm:h-[760px]'
          }`}
          allow="microphone; autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* 3. Post-Mastering Workflow & Direct Hyperlink Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-1.5">
          <div className="flex items-center gap-2 text-acid font-bold text-xs">
            <Headphones className="w-4 h-4" />
            <span>1. Subí tu Mezcla</span>
          </div>
          <p className="text-[11px] text-content-secondary leading-relaxed">
            Cargá tu pista en WAV o MP3 directo en la consola de arriba. Probá distintos perfiles de pegada para Boom-Bap, Trap o Rimas Acapella.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-1.5">
          <div className="flex items-center gap-2 text-cyan font-bold text-xs">
            <Volume2 className="w-4 h-4" />
            <span>2. Ajustá y Descargá</span>
          </div>
          <p className="text-[11px] text-content-secondary leading-relaxed">
            Escuchá la comparativa en tiempo real y exportá tu canción masterizada con volumen competitivo listo para plataformas.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-magenta font-bold text-xs">
              <Radio className="w-4 h-4" />
              <span>3. Soltalo en Larvaz</span>
            </div>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              ¿Ya tenés tu master listo? Subilo a la rotación de Radio Larvaz 24/7 o compartilo en el muro.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/radio"
              className="flex-1 text-center py-1.5 px-2.5 rounded-xl bg-acid/15 border border-acid/30 text-acid hover:bg-acid hover:text-background font-bold text-[11px] transition-colors"
            >
              Ir a Radio 24/7
            </Link>
            <Link
              href="/crear"
              className="flex-1 text-center py-1.5 px-2.5 rounded-xl bg-surface-elevated border border-surface-border hover:border-acid text-content-primary font-bold text-[11px] transition-colors"
            >
              Publicar Tema
            </Link>
          </div>
        </div>
      </div>

      {/* Explicit Hyperlink Reference Card */}
      <div className="p-3.5 rounded-2xl bg-surface/60 border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-content-secondary">
          <Sparkles className="w-4 h-4 text-cyan flex-shrink-0" />
          <span>
            Herramienta web aliada integrada en Larvaz:{' '}
            <a
              href={MASTERING_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan font-mono underline hover:text-acid transition-colors"
            >
              https://app-master-audio.vercel.app/
            </a>
          </span>
        </div>
        <a
          href={MASTERING_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-acid hover:underline flex items-center gap-1"
        >
          <span>Abrir vínculo directo</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
