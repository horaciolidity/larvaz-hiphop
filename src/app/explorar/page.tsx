'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PostCard } from '@/components/feed/PostCard';
import {
  Search,
  Users,
  Compass,
  Calendar,
  Tag,
  Flame,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { ContentType } from '@/types';

function ExplorarContent() {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get('tag') || '';
  const initialTab = searchParams.get('tab') || 'todo';

  const { availableProfiles, events, posts, isFollowing, toggleFollow } = useApp();

  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [activeTab, setActiveTab] = useState<'todo' | 'publicaciones' | 'artistas' | 'eventos'>('todo');
  const [sortBy, setSortBy] = useState<'reciente' | 'popular'>('reciente');
  const [contentType, setContentType] = useState<ContentType | 'all'>('all');

  const popularTags = [
    'boombap',
    'graffiti',
    'breaking',
    'turntablism',
    'rap',
    'cypher',
    'mural',
    'wildstyle',
    'beattape',
  ];

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.description.toLowerCase().includes(q) ||
          p.author.full_name.toLowerCase().includes(q) ||
          p.author.username.toLowerCase().includes(q) ||
          p.metadata?.title?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedTag) {
      list = list.filter((p) => p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));
    }

    if (contentType !== 'all') {
      list = list.filter((p) => p.content_type === contentType);
    }

    if (sortBy === 'popular') {
      list.sort((a, b) => b.likes_count + b.comments_count - (a.likes_count + a.comments_count));
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [posts, query, selectedTag, contentType, sortBy]);

  // Filtered Artists
  const filteredArtists = useMemo(() => {
    if (!query.trim()) return availableProfiles;
    const q = query.toLowerCase();
    return availableProfiles.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.artistic_disciplines?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
    );
  }, [availableProfiles, query]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.organizer_name.toLowerCase().includes(q)
    );
  }, [events, query]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header & Search Bar */}
      <div className="space-y-3">
        <h1 className="font-display font-black text-2xl md:text-3xl text-content-primary tracking-wide">
          EXPLORAR LA CULTURA
        </h1>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por artistas, colectivos, pistas, graffiti, eventos..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
          />
        </div>

        {/* Popular Tags Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <Tag className="w-3.5 h-3.5 text-acid flex-shrink-0" />
          {selectedTag && (
            <button
              onClick={() => setSelectedTag('')}
              className="px-2.5 py-1 rounded-full bg-magenta/20 text-magenta text-[11px] font-bold border border-magenta/40 flex-shrink-0"
            >
              Limpiar #{selectedTag} ×
            </button>
          )}
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border flex-shrink-0 ${
                selectedTag === tag
                  ? 'bg-acid text-background border-acid shadow-acid-sm font-bold'
                  : 'bg-surface text-content-secondary border-surface-border hover:border-content-secondary'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Exploration Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2 text-xs font-bold">
        {[
          { key: 'todo', label: 'Todo' },
          { key: 'publicaciones', label: `Publicaciones (${filteredPosts.length})` },
          { key: 'artistas', label: `Artistas (${filteredArtists.length})` },
          { key: 'eventos', label: `Eventos (${filteredEvents.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-1.5 px-3 rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-surface-elevated text-acid border border-surface-border'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. ARTISTS SECTION */}
      {(activeTab === 'todo' || activeTab === 'artistas') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan" />
              <span>Creadores & Colectivos ({filteredArtists.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredArtists.map((artist) => {
              const following = isFollowing(artist.id);

              return (
                <div
                  key={artist.id}
                  className="p-3.5 rounded-xl bg-surface border border-surface-border hover:border-surface-hover transition-colors flex items-center justify-between gap-3"
                >
                  <Link
                    href={`/artista/${artist.username}`}
                    className="flex items-center gap-3 min-w-0 group"
                  >
                    <img
                      src={artist.avatar_url}
                      alt={artist.full_name}
                      className="w-11 h-11 rounded-full object-cover border border-surface-elevated group-hover:border-acid transition-colors flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-content-primary group-hover:text-acid transition-colors truncate">
                        {artist.full_name}
                      </p>
                      <p className="text-[10px] text-content-secondary truncate">
                        @{artist.username}
                      </p>
                      {artist.artistic_disciplines && (
                        <p className="text-[10px] text-content-muted truncate mt-0.5">
                          {artist.artistic_disciplines}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link
                      href={`/mensajes?user=${artist.username}`}
                      className="p-2 rounded-full bg-surface-elevated hover:bg-surface border border-surface-border hover:border-acid text-content-secondary hover:text-acid transition-colors"
                      title={`Enviar mensaje a @${artist.username}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => toggleFollow(artist.id)}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                        following
                          ? 'bg-surface-elevated text-content-secondary hover:text-content-primary'
                          : 'bg-acid text-background hover:bg-acid-hover shadow-acid-sm'
                      }`}
                    >
                      {following ? 'Siguiendo' : 'Seguir'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. POSTS STREAM */}
      {(activeTab === 'todo' || activeTab === 'publicaciones') && (
        <div className="space-y-4 pt-4 border-t border-surface-border/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-2">
              <Compass className="w-4 h-4 text-acid" />
              <span>Muro de Expresiones ({filteredPosts.length})</span>
            </h2>

            {/* Sort order toggle */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setSortBy('reciente')}
                className={`px-2 py-1 rounded ${
                  sortBy === 'reciente' ? 'bg-surface text-acid font-bold' : 'text-content-secondary'
                }`}
              >
                Recientes
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-2 py-1 rounded ${
                  sortBy === 'popular' ? 'bg-surface text-acid font-bold' : 'text-content-secondary'
                }`}
              >
                Populares
              </button>
            </div>
          </div>

          <div className="divide-y divide-surface-border/50 border border-surface-border rounded-2xl bg-surface/20 overflow-hidden">
            {filteredPosts.length === 0 ? (
              <div className="py-12 text-center text-xs text-content-secondary">
                No se encontraron publicaciones con estos criterios de búsqueda.
              </div>
            ) : (
              filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      )}

      {/* 3. EVENTS SECTION */}
      {(activeTab === 'todo' || activeTab === 'eventos') && (
        <div className="space-y-3 pt-4 border-t border-surface-border/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange" />
              <span>Eventos en la Agenda ({filteredEvents.length})</span>
            </h2>
            <Link href="/eventos" className="text-xs text-acid hover:underline">
              Ver agenda completa →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredEvents.map((ev) => (
              <Link
                key={ev.id}
                href={`/eventos/${ev.slug}`}
                className="p-3.5 rounded-xl bg-surface border border-surface-border hover:border-acid transition-colors block group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold text-content-primary group-hover:text-acid transition-colors line-clamp-1">
                    {ev.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-orange/10 text-orange font-bold uppercase flex-shrink-0">
                    {new Date(ev.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-[11px] text-content-secondary mt-1.5 line-clamp-2">
                  {ev.description}
                </p>
                <p className="text-[10px] text-content-muted mt-2">
                  📍 {ev.location}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorarPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-content-muted">
          Cargando explorador...
        </div>
      }
    >
      <ExplorarContent />
    </Suspense>
  );
}
