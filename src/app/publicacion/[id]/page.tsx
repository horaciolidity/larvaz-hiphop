'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import type { Comment, Post } from '@/types';
import { dataStore } from '@/lib/data-store';
import { mapDbPostToPost } from '@/lib/post-mapper';
import { normalizeMediaList } from '@/lib/media-utils';
import { MediaEmbed } from '@/components/feed/MediaEmbed';
import { PostMediaGallery } from '@/components/feed/PostMediaGallery';
import { SharePostButton } from '@/components/feed/SharePostButton';
import { ReportModal } from '@/components/common/ReportModal';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Trash2,
  Flag,
  Eye,
  Loader2,
} from 'lucide-react';

function mapComment(raw: any, fallbackPostId: string): Comment {
  return {
    id: String(raw.id),
    post_id: String(raw.post_id || fallbackPostId),
    user_id: raw.user_id,
    content: raw.content || '',
    is_hidden: Boolean(raw.is_hidden),
    created_at: raw.created_at,
    author: raw.profiles || raw.author || {
      id: raw.user_id,
      username: 'artista',
      full_name: 'Artista Larvaz',
      avatar_url: '',
      role: 'user',
      is_banned: false,
      created_at: raw.created_at,
    },
  };
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = String(params?.id || '');
  const {
    currentUser,
    posts,
    toggleLike,
    toggleBookmark,
    addComment,
    deleteComment,
    incrementViews,
  } = useApp();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carga inicial: primero localStorage (rápida) y luego API (para visitantes nuevos)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const localPost = dataStore.getPostById(postId);
    if (localPost) {
      setPost(localPost);
      setComments(dataStore.getComments(postId));
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);
    if (!isUuid) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    fetch(`/api/post?id=${encodeURIComponent(postId)}&t=${Date.now()}`, {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.post) return;
        const mapped = mapDbPostToPost(data.post);
        setPost(mapped);

        const rawComments = Array.isArray(data.post.comments) ? data.post.comments : [];
        const mappedComments = rawComments
          .filter((c: any) => !c.is_hidden)
          .map((c: any) => mapComment(c, mapped.id));

        if (mappedComments.length > 0) {
          dataStore.mergeComments(mappedComments);
          setComments(mappedComments);
        } else {
          setComments(dataStore.getComments(postId));
        }
      })
      .catch(() => {
        // seguimos con el respaldo local
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId]);

  // Mantener likes/bookmarks/vistas sincronizados con el contexto global
  useEffect(() => {
    const found = posts.find((p) => p.id === postId);
    if (!found) return;
    setPost((prev) =>
      prev
        ? {
            ...prev,
            ...found,
            media: found.media && found.media.length > 0 ? found.media : prev.media,
            metadata: found.metadata || prev.metadata,
          }
        : found
    );
  }, [posts, postId]);

  useEffect(() => {
    if (postId) incrementViews(postId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = Date.now();
      const past = new Date(dateStr).getTime();
      if (isNaN(past)) return 'reciente';
      const diffMs = now - past;
      if (diffMs <= 0) return 'ahora';
      const seconds = Math.floor(diffMs / 1000);
      if (seconds < 60) return 'hace un momento';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `hace ${minutes}m`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `hace ${hours}h`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'ayer';
      if (days < 30) return `hace ${days}d`;
      return `hace ${Math.floor(days / 30)}m`;
    } catch {
      return 'ahora';
    }
  };

  if (loading && !post) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-xs text-content-secondary">
        <Loader2 className="w-4 h-4 animate-spin text-acid" />
        <span>Cargando publicación...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="font-display font-black text-2xl text-content-primary">
          PUBLICACIÓN NO ENCONTRADA
        </h2>
        <p className="text-xs text-content-secondary">
          Esta publicación no existe o fue retirada del muro comunitario.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-acid text-background font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Muro Principal</span>
        </Link>
      </div>
    );
  }

  const postMedia =
    post.media && post.media.length > 0
      ? post.media
      : normalizeMediaList(post.metadata?.media);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = addComment(post.id, commentText);
    setComments((prev) => [...prev, newComment]);
    setCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-content-secondary hover:text-acid transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver</span>
      </button>

      {/* Author Card */}
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <Link
          href={`/artista/${post.author.username}`}
          className="flex items-center gap-3 group"
        >
          <UserAvatar
            avatarUrl={post.author.avatar_url}
            name={post.author.full_name}
            size="lg"
            className="group-hover:border-acid transition-colors"
          />
          <div>
            <h1 className="font-bold text-base text-content-primary group-hover:text-acid transition-colors">
              {post.author.full_name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-content-secondary">
                @{post.author.username}
              </span>
              <span className="text-xs text-content-muted">·</span>
              <span className="text-xs text-acid font-semibold">
                {formatTimeAgo(post.created_at)}
              </span>
            </div>
          </div>
        </Link>

        <button
          onClick={() => setShowReportModal(true)}
          className="p-2 rounded-lg text-content-secondary hover:text-magenta hover:bg-surface-elevated transition-colors"
          aria-label="Denunciar publicación"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* Description & Tags */}
      <div className="space-y-3">
        <p className="text-sm md:text-base text-content-primary leading-relaxed whitespace-pre-line">
          {post.description}
        </p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {post.tags.map((t) => (
              <Link
                key={t}
                href={`/explorar?tag=${encodeURIComponent(t)}`}
                className="text-xs font-bold text-acid hover:underline"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Fotos y audios subidos a Larvaz */}
      <PostMediaGallery media={postMedia} />

      {/* Embed externo / IPFS */}
      {post.external_url && (
        <MediaEmbed
          metadata={post.metadata}
          provider={post.provider}
          externalUrl={post.external_url}
        />
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between py-3 border-y border-surface-border text-sm">
        <button
          onClick={() => toggleLike(post.id)}
          className={`flex items-center gap-2 font-bold transition-colors ${
            post.user_has_liked ? 'text-magenta' : 'text-content-secondary hover:text-magenta'
          }`}
        >
          <Heart className={`w-5 h-5 ${post.user_has_liked ? 'fill-current' : ''}`} />
          <span>{post.likes_count} Props</span>
        </button>

        <div className="flex items-center gap-2 text-content-secondary">
          <MessageCircle className="w-5 h-5 text-cyan" />
          <span>{Math.max(comments.length, post.comments_count || 0)} Comentarios</span>
        </div>

        <div className="flex items-center gap-1.5 text-content-muted">
          <Eye className="w-4 h-4" />
          <span className="font-mono text-xs">
            {post.views_count && post.views_count >= 1000
              ? `${(post.views_count / 1000).toFixed(1)}k`
              : (post.views_count || 1)} vistas
          </span>
        </div>

        <button
          onClick={() => toggleBookmark(post.id)}
          className={`p-2 rounded-lg transition-colors ${
            post.user_has_bookmarked ? 'text-acid' : 'text-content-secondary hover:text-acid'
          }`}
          aria-label="Guardar publicación"
        >
          <Bookmark className={`w-5 h-5 ${post.user_has_bookmarked ? 'fill-current' : ''}`} />
        </button>

        <SharePostButton post={post} variant="icon" />
      </div>

      {/* Comments Section */}
      <div className="space-y-4 pt-2">
        <h2 className="font-display font-black text-lg text-content-primary tracking-wide">
          CONVERSACIÓN & RESPETO ({Math.max(comments.length, post.comments_count || 0)})
        </h2>

        {/* New comment input */}
        <form onSubmit={handleSendComment} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Aporta a la conversación cultural..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="px-4 py-2.5 rounded-xl bg-acid text-background font-bold text-xs hover:bg-acid-hover disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            <Send className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </form>

        {/* Comments stream */}
        <div className="space-y-3 pt-2">
          {comments.length === 0 ? (
            <p className="text-center text-xs text-content-secondary py-4">
              Todavía no hay comentarios. Sé el primero en aportar al cypher.
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-surface border border-surface-border/70 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/artista/${c.author?.username}`}
                      className="font-bold text-xs text-content-primary hover:text-acid"
                    >
                      {c.author?.full_name}
                    </Link>
                    <span className="text-[10px] text-content-muted">
                      @{c.author?.username}
                    </span>
                  </div>
                  <p className="text-xs text-content-secondary leading-relaxed">
                    {c.content}
                  </p>
                </div>

                {(c.user_id === currentUser.id || currentUser.role === 'admin') && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-content-muted hover:text-magenta p-1 transition-colors"
                    aria-label="Eliminar comentario propio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetId={post.id}
      />
    </div>
  );
}
