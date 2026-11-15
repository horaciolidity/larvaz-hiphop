'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ConnectedUsersBar } from '@/components/layout/ConnectedUsersBar';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { PostCard } from '@/components/feed/PostCard';
import { InlineFeedComposer } from '@/components/feed/InlineFeedComposer';
import { PlusCircle, Disc3, Sliders, Sparkles, Film } from 'lucide-react';

export default function HomePage() {
  const { posts } = useApp();

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Connected Users Space */}
      <ConnectedUsersBar />

      {/* Feed Filters Header (Sticky) */}
      <FeedFilters />

      {/* Featured Larvaz Studio Tools (mastering + video) */}
      <div className="px-4 pt-3.5 pb-1 bg-surface/30 space-y-2">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan/15 via-surface-elevated to-acid/15 border border-cyan/30 hover:border-cyan/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-cyan/20 border border-cyan/40 flex items-center justify-center text-cyan flex-shrink-0 shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-display font-black tracking-wider text-content-primary uppercase">
                  🎚️ ESTUDIO DE MASTERIZACIÓN LARVAZ
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-cyan text-background text-[9px] font-black uppercase">
                  INTEGRADO
                </span>
              </div>
              <p className="text-[11px] text-content-secondary truncate">
                Masterizá el audio de tus canciones y beats sin salir de Larvaz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto flex-shrink-0">
            <Link
              href="/estudio"
              className="flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-xl bg-cyan text-background font-black text-[11px] hover:opacity-90 transition-all shadow-sm"
            >
              Usar en Larvaz
            </Link>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-r from-magenta/15 via-surface-elevated to-acid/15 border border-magenta/30 hover:border-magenta/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-magenta/20 border border-magenta/40 flex items-center justify-center text-magenta flex-shrink-0 shadow-sm">
              <Film className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-display font-black tracking-wider text-content-primary uppercase">
                  🎬 LARVAZ VIDEO EDITOR
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-acid text-background text-[9px] font-black uppercase">
                  GRATIS
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-magenta/20 text-magenta border border-magenta/30 text-[9px] font-black uppercase">
                  INTEGRADO
                </span>
              </div>
              <p className="text-[11px] text-content-secondary truncate">
                Editá los videoclips de tus temas con IA sin salir de Larvaz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto flex-shrink-0">
            <Link
              href="/editor"
              className="flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-xl bg-magenta text-content-primary font-black text-[11px] hover:opacity-90 transition-all shadow-sm"
            >
              Abrir editor
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Inline Feed Composer */}
      <div className="p-4 border-b border-surface-border bg-surface/40">
        <InlineFeedComposer />
      </div>

      {/* Main Feed Stream */}
      <div className="divide-y divide-surface-border/50">
        {posts.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border flex items-center justify-center mx-auto text-acid shadow-acid-sm">
              <Disc3 className="w-7 h-7 animate-spin-slow" />
            </div>
            <h3 className="font-display font-black text-xl text-content-primary tracking-wide">
              LA PLAZA ESTÁ TRANQUI
            </h3>
            <p className="text-xs text-content-secondary max-w-sm mx-auto leading-relaxed">
              No hay nada tirado con este filtro todavía, compa. Cambiá el filtro o soltá vos la primera rima, beat o trazo en el muro del barrio.
            </p>
            <Link
              href="/crear"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-acid text-background font-black text-xs shadow-acid-glow hover:bg-acid-hover transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tirar al Muro</span>
            </Link>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
