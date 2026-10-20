'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { FeedFilters } from '@/components/feed/FeedFilters';
import { PostCard } from '@/components/feed/PostCard';
import { PlusCircle, Disc3, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { posts, currentUser } = useApp();

  return (
    <div className="flex flex-col min-h-full">
      {/* Feed Filters Header (Sticky) */}
      <FeedFilters />

      {/* Quick Post Prompt Box */}
      <div className="p-4 border-b border-surface-border bg-surface/30">
        <Link
          href="/crear"
          className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-surface-border hover:border-acid transition-colors group cursor-pointer"
        >
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentUser.full_name}
            className="w-9 h-9 rounded-full object-cover border border-surface-elevated"
          />
          <span className="text-xs text-content-secondary group-hover:text-content-primary flex-1">
            Pega un enlace de YouTube, Spotify o SoundCloud para compartir en el muro...
          </span>
          <PlusCircle className="w-5 h-5 text-acid group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      {/* Main Feed Stream */}
      <div className="divide-y divide-surface-border/50">
        {posts.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border flex items-center justify-center mx-auto text-acid shadow-acid-sm">
              <Disc3 className="w-7 h-7 animate-spin-slow" />
            </div>
            <h3 className="font-display font-black text-xl text-content-primary tracking-wide">
              MURO EN SILENCIO
            </h3>
            <p className="text-xs text-content-secondary max-w-sm mx-auto leading-relaxed">
              No hay publicaciones con el filtro seleccionado. Prueba cambiando los filtros o publica la primera pieza en el muro.
            </p>
            <Link
              href="/crear"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-acid text-background font-bold text-xs shadow-acid-glow hover:bg-acid-hover transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar Ahora</span>
            </Link>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
