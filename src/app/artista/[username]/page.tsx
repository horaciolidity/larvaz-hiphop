'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { dataStore } from '@/lib/data-store';
import { PostCard } from '@/components/feed/PostCard';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  MapPin,
  Globe,
  Music,
  Calendar,
  Settings,
  Bookmark,
  Disc3,
  Layers,
  Check,
  MessageCircle,
} from 'lucide-react';

export default function ArtistProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { currentUser, isFollowing, toggleFollow } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'events'>('posts');

  const profile = dataStore.getProfileByUsername(username);

  if (!profile) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="font-display font-black text-2xl text-content-primary">
          PERFIL NO ENCONTRADO
        </h2>
        <p className="text-xs text-content-secondary">
          No existe ningún artista o colectivo con el nombre de usuario @{username}.
        </p>
        <Link
          href="/explorar"
          className="inline-flex px-4 py-2 rounded-xl bg-acid text-background font-bold text-xs"
        >
          Explorar la comunidad
        </Link>
      </div>
    );
  }

  const isOwner = currentUser.id === profile.id;
  const following = isFollowing(profile.id);

  // Fetch artist posts
  const artistPosts = dataStore.getPosts({ authorId: profile.id });
  // Saved posts (only owner can view)
  const savedPosts = isOwner ? dataStore.getPosts({ bookmarkedOnly: true }) : [];
  // Events
  const artistEvents = dataStore.getEvents().filter((e) => e.organizer_id === profile.id);

  return (
    <div className="min-h-full pb-8">
      {/* 1. Profile Banner */}
      <div className="h-44 sm:h-56 w-full relative bg-surface-elevated overflow-hidden border-b border-surface-border">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt={`Portada de ${profile.full_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-surface to-surface-elevated flex items-center justify-center">
            <span className="font-display font-black text-4xl text-surface-border tracking-widest">
              LARVAZ HIPHOP
            </span>
          </div>
        )}
      </div>

      {/* 2. Avatar & Header Controls */}
      <div className="px-4 sm:px-6 relative">
        <div className="flex justify-between items-end -mt-14 sm:-mt-16 mb-4">
          <div className="relative">
            <UserAvatar
              avatarUrl={profile.avatar_url}
              name={profile.full_name}
              size="2xl"
              className="border-4 border-background shadow-2xl"
            />
            {profile.role === 'admin' && (
              <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full bg-magenta text-content-primary text-[9px] font-black tracking-widest uppercase border border-background shadow-sm">
                ADMIN
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <Link
                href="/configuracion"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-surface-border hover:border-acid text-content-primary text-xs font-bold transition-colors"
              >
                <Settings className="w-4 h-4 text-acid" />
                <span>Editar Perfil</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/mensajes?user=${profile.username}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-surface-border hover:border-acid text-content-primary text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-acid" />
                  <span>Mensaje</span>
                </Link>
                <button
                  onClick={() => toggleFollow(profile.id)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                    following
                      ? 'bg-surface-elevated border border-surface-border text-content-secondary hover:text-content-primary'
                      : 'bg-acid text-background hover:bg-acid-hover shadow-acid-glow'
                  }`}
                >
                  {following ? 'Siguiendo' : 'Seguir Creador'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Bio & Details */}
        <div className="space-y-3">
          <div>
            <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
              {profile.full_name}
            </h1>
            <p className="text-xs text-content-secondary font-medium">
              @{profile.username}
            </p>
          </div>

          {profile.bio && (
            <p className="text-xs sm:text-sm text-content-primary/90 leading-relaxed max-w-xl">
              {profile.bio}
            </p>
          )}

          {/* Artistic Disciplines tag */}
          {profile.artistic_disciplines && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-acid/10 border border-acid/20 text-acid text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>{profile.artistic_disciplines}</span>
            </div>
          )}

          {/* Location & External Links */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-content-secondary pt-1">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-content-muted" />
                <span>{profile.location}</span>
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-cyan hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Sitio / Redes</span>
              </a>
            )}
            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-magenta hover:underline"
              >
                <Music className="w-3.5 h-3.5" />
                <span>Música / Portafolio</span>
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 text-xs pt-1 border-t border-surface-border">
            <span>
              <strong className="text-content-primary font-bold">{profile.followers_count || 0}</strong>{' '}
              <span className="text-content-secondary">seguidores</span>
            </span>
            <span>
              <strong className="text-content-primary font-bold">{profile.following_count || 0}</strong>{' '}
              <span className="text-content-secondary">siguiendo</span>
            </span>
            <span>
              <strong className="text-content-primary font-bold">{artistPosts.length}</strong>{' '}
              <span className="text-content-secondary">publicaciones</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Profile Navigation Tabs */}
      <div className="flex border-b border-surface-border mt-6 px-4 sm:px-6 gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('posts')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'posts'
              ? 'border-acid text-acid font-bold'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          <Disc3 className="w-4 h-4" />
          <span>Publicaciones ({artistPosts.length})</span>
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'border-acid text-acid font-bold'
                : 'border-transparent text-content-secondary hover:text-content-primary'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Guardados ({savedPosts.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('events')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'events'
              ? 'border-acid text-acid font-bold'
              : 'border-transparent text-content-secondary hover:text-content-primary'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Eventos ({artistEvents.length})</span>
        </button>
      </div>

      {/* 5. Tab Contents */}
      <div className="divide-y divide-surface-border/50">
        {activeTab === 'posts' && (
          artistPosts.length === 0 ? (
            <p className="text-center text-xs text-content-secondary py-12">
              Este creador todavía no ha publicado piezas en el muro.
            </p>
          ) : (
            artistPosts.map((post) => <PostCard key={post.id} post={post} />)
          )
        )}

        {activeTab === 'saved' && (
          savedPosts.length === 0 ? (
            <p className="text-center text-xs text-content-secondary py-12">
              No tienes publicaciones guardadas. Guarda material que quieras revisar luego con el icono de marcador.
            </p>
          ) : (
            savedPosts.map((post) => <PostCard key={post.id} post={post} />)
          )
        )}

        {activeTab === 'events' && (
          <div className="p-4 sm:p-6 grid grid-cols-1 gap-4">
            {artistEvents.length === 0 ? (
              <p className="text-center text-xs text-content-secondary py-8">
                No hay eventos organizados por este perfil.
              </p>
            ) : (
              artistEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/eventos/${ev.slug}`}
                  className="p-4 rounded-xl bg-surface border border-surface-border hover:border-acid transition-colors block group"
                >
                  <h3 className="font-bold text-sm text-content-primary group-hover:text-acid">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-content-secondary mt-1">
                    {ev.location} · {new Date(ev.start_date).toLocaleDateString('es-ES')}
                  </p>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
