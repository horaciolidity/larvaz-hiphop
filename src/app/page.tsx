'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ConnectedUsersBar } from '@/components/layout/ConnectedUsersBar';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { PostCard } from '@/components/feed/PostCard';
import { InlineFeedComposer } from '@/components/feed/InlineFeedComposer';
import { SponsorPostCard } from '@/components/sponsors/cards';
import { useSponsors } from '@/context/SponsorsContext';
import { PlusCircle, Disc3, Sliders, Sparkles, Film, Crown } from 'lucide-react';

export default function HomePage() {
  const { posts } = useApp();
  const { state: sponsorState } = useSponsors();

  // Los posts de marcas se intercalan en el feed principal (uno cada 3 publicaciones,
  // máximo 3 por vista) conservando su etiqueta SPONSOR y sus acciones propias.
  const MAX_SPONSOR_IN_FEED = 3;
  const sponsorPosts = sponsorState.posts.slice(0, MAX_SPONSOR_IN_FEED);
  const feedItems: Array<{ id: string; node: React.ReactNode }> = [];
  let sponsorIndex = 0;
  posts.forEach((post, index) => {
    feedItems.push({ id: post.id, node: <PostCard key={post.id} post={post} /> });
    if ((index + 1) % 3 === 0 && sponsorIndex < sponsorPosts.length) {
      const sponsorPost = sponsorPosts[sponsorIndex];
      sponsorIndex += 1;
      feedItems.push({
        id: sponsorPost.id,
        node: (
          <div key={sponsorPost.id} className="px-2 py-2">
            <SponsorPostCard post={sponsorPost} />
          </div>
        ),
      });
    }
  });
  if (sponsorIndex < sponsorPosts.length && posts.length > 0) {
    const sponsorPost = sponsorPosts[sponsorIndex];
    feedItems.push({
      id: sponsorPost.id,
      node: (
        <div key={sponsorPost.id} className="px-2 py-2">
          <SponsorPostCard post={sponsorPost} />
        </div>
      ),
    });
    sponsorIndex += 1;
  }

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

      {/* LARVAZ SPONSORS — acceso directo */}
      <div className="px-4 pt-3">
        <Link
          href="/sponsors"
          className="flex items-center gap-2.5 rounded-2xl border border-acid/25 bg-gradient-to-r from-acid/10 via-surface-elevated to-magenta/10 p-3 transition-colors hover:border-acid/50"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-acid text-background">
            <Crown className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-display text-sm font-black tracking-wider text-content-primary">
              LARVAZ SPONSORS
              <span className="rounded-full bg-acid px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-background">
                Nuevo
              </span>
            </p>
            <p className="truncate text-[11px] text-content-secondary">
              Patrocinios, sorteos, premios, desafíos y proyectos para la cultura.
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-acid">Explorar →</span>
        </Link>
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
          feedItems.map((item) => item.node)
        )}
      </div>
    </div>
  );
}
