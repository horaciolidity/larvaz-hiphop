'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Film,
  Maximize2,
  Minimize2,
  RotateCcw,
  Lock,
  Sparkles,
  Scissors,
  Upload,
  CheckCircle2,
  Clapperboard,
  MonitorPlay,
  Palette,
} from 'lucide-react';

const VIDEO_EDITOR_URL = 'https://pinnacledit.vercel.app/';

/**
 * El editor se usa únicamente dentro de Larvaz.
 *
 * Sin `allow-popups` ni `allow-top-navigation` el iframe no puede abrir
 * pestañas ni redirigir a Larvaz hacia el sitio externo: aunque la app de
 * video tenga enlaces propios, quedan encerrados en el marco.
 */
const EMBED_SANDBOX =
  'allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-orientation-lock allow-presentation';

export default function EditorVideoPage() {
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
      {/* Aviso para invitados */}
      {currentUser.is_guest && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-magenta/15 via-surface-elevated to-acid/15 border border-magenta/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-magenta/20 border border-magenta/40 flex items-center justify-center text-magenta flex-shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-content-primary">
                Estás probando Larvaz Video Editor en <span className="text-magenta">Modo Observador</span>
              </p>
              <p className="text-[11px] text-content-secondary">
                Iniciá sesión o registrate gratis para guardar tus proyectos y publicar tus videoclips en el Muro.
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

      {/* 1. Encabezado del editor */}
      <div className="relative rounded-2xl bg-gradient-to-br from-surface-elevated via-surface to-background border border-magenta/30 p-4 sm:p-5 shadow-2xl overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-magenta/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-acid/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-magenta/15 border border-magenta/30 text-magenta text-[10px] font-mono font-bold uppercase tracking-wider">
              <Film className="w-3 h-3" />
              <span>HERRAMIENTA OFICIAL INTEGRADA EN LARVAZ</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-content-primary tracking-wide flex items-center gap-2">
              <span>🎬 LARVAZ VIDEO EDITOR</span>
            </h1>
            <p className="text-xs text-content-secondary max-w-xl leading-relaxed">
              Editá los videoclips de tus canciones: cortá, pegá, sumá efectos, texto y música con ayuda de IA.
              Todo desde Larvaz, sin salir de la app y sin pagar nada.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-acid text-background text-[9px] font-black uppercase tracking-wider">
                100% gratis
              </span>
              <span className="px-2 py-0.5 rounded-full bg-magenta/15 text-magenta border border-magenta/30 text-[9px] font-black uppercase tracking-wider">
                Integrado
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-elevated text-content-secondary border border-surface-border text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                Solo dentro de Larvaz
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-acid text-background font-black text-xs shadow-acid-sm hover:bg-acid-hover transition-all"
              title="Expandir el editor a pantalla completa dentro de Larvaz"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pantalla Completa</span>
            </button>
            <button
              onClick={handleReload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border hover:border-magenta text-content-primary hover:text-magenta text-xs font-bold transition-all"
              title="Reiniciar el editor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Editor embebido */}
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-[60] bg-background flex flex-col'
            : 'relative rounded-2xl overflow-hidden border-2 border-surface-border hover:border-magenta/40 transition-colors bg-[#09090b] shadow-2xl flex flex-col'
        }
      >
        <div className="bg-surface-elevated border-b border-surface-border px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-acid animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-acid uppercase tracking-wider">
                EDITOR ACTIVO
              </span>
            </span>
            <span className="text-content-muted text-xs hidden sm:inline">|</span>
            <span className="text-xs text-content-secondary truncate hidden sm:inline font-mono">
              Video con IA embebido en Larvaz · sin enlaces externos
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden items-center gap-1 rounded-lg bg-surface border border-surface-border px-2 py-1 text-[10px] font-bold text-content-muted sm:flex">
              <Lock className="w-3 h-3" />
              Uso interno
            </span>

            <button
              onClick={handleReload}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-surface-border hover:border-acid text-content-secondary hover:text-acid text-[11px] font-semibold transition-colors"
              title="Reiniciar editor de video"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-acid/15 border border-acid/40 text-acid hover:bg-acid hover:text-background text-[11px] font-bold transition-colors"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Salir</span>
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

        {isLoading && (
          <div className="absolute inset-0 top-11 z-10 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-magenta/15 border border-magenta/40 flex items-center justify-center text-magenta">
              <Clapperboard className="w-7 h-7 animate-pulse" />
            </div>
            <p className="font-display font-black text-lg text-content-primary tracking-wider">
              CARGANDO EDITOR DE VIDEO LARVAZ...
            </p>
            <p className="text-xs text-content-secondary max-w-xs">
              Preparando la línea de tiempo para tus videoclips.
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={VIDEO_EDITOR_URL}
          title="Larvaz Video Editor — Edición de videoclips"
          className={`w-full border-0 bg-[#09090b] ${
            isFullscreen ? 'flex-1 h-full' : 'h-[calc(100dvh-260px)] min-h-[480px] sm:h-[760px]'
          }`}
          sandbox={EMBED_SANDBOX}
          allow="autoplay; fullscreen; clipboard-read; clipboard-write; encrypted-media; picture-in-picture; microphone; camera"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* 3. Cómo se usa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-1.5">
          <div className="flex items-center gap-2 text-acid font-bold text-xs">
            <Upload className="w-4 h-4" />
            <span>1. Subí tus clips</span>
          </div>
          <p className="text-[11px] text-content-secondary leading-relaxed">
            Cargá los videos de tu celular o de tu compu. También podés empezar desde una plantilla y sumar tu música.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-1.5">
          <div className="flex items-center gap-2 text-magenta font-bold text-xs">
            <Scissors className="w-4 h-4" />
            <span>2. Editá con IA</span>
          </div>
          <p className="text-[11px] text-content-secondary leading-relaxed">
            Cortá en la línea de tiempo, sumá texto, filtros, transiciones y efectos. La IA te ayuda a resolver el clip.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>3. Exportá y publicalo</span>
            </div>
            <p className="text-[11px] text-content-secondary leading-relaxed">
              Descargá el video y subilo al Muro como clip oficial de tu tema. Si querés, antes pasá el audio por el mastering.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/crear"
              className="flex-1 text-center py-1.5 px-2.5 rounded-xl bg-acid/15 border border-acid/30 text-acid hover:bg-acid hover:text-background font-bold text-[11px] transition-colors"
            >
              Publicar Clip
            </Link>
            <Link
              href="/estudio"
              className="flex-1 text-center py-1.5 px-2.5 rounded-xl bg-surface-elevated border border-surface-border hover:border-cyan text-content-primary font-bold text-[11px] transition-colors"
            >
              Masterizar Audio
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Sello de herramienta integrada */}
      <div className="p-3.5 rounded-2xl bg-surface/60 border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-content-secondary">
          <CheckCircle2 className="w-4 h-4 text-acid flex-shrink-0" />
          <span>
            Herramienta <strong className="text-content-primary">gratuita y oficial</strong> de Larvaz: se usa
            únicamente dentro de la app, sin enlaces ni pestañas externas.
          </span>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-content-muted">
          <MonitorPlay className="w-3.5 h-3.5" />
          <Palette className="w-3.5 h-3.5" />
          Editor embebido
        </span>
      </div>
    </div>
  );
}
