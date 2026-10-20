'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { dataStore } from '@/lib/data-store';
import { PostCard } from '@/components/feed/PostCard';
import { Bookmark, Compass } from 'lucide-react';

export default function GuardadosPage() {
  const { currentUser } = useApp();
  const savedPosts = dataStore.getPosts({ bookmarkedOnly: true });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="border-b border-surface-border pb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-acid fill-current" />
          <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
            PUBLICACIONES GUARDADAS
          </h1>
        </div>
        <p className="text-xs text-content-secondary mt-1">
          Archivo personal de material cultural guardado para revisión. Visible únicamente por ti.
        </p>
      </div>

      <div className="divide-y divide-surface-border/50">
        {savedPosts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface border border-surface-border flex items-center justify-center mx-auto text-content-muted">
              <Bookmark className="w-6 h-6" />
            </div>
            <p className="text-xs text-content-secondary max-w-sm mx-auto">
              No tienes publicaciones guardadas. Presiona el icono de marcador en cualquier publicación del muro para guardarla en este archivo.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-surface-border hover:border-acid text-xs font-bold text-acid transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Explorar el Muro</span>
            </Link>
          </div>
        ) : (
          savedPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
