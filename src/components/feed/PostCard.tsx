'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import { useApp } from '@/context/AppContext';
import { MediaEmbed } from './MediaEmbed';
import { ReportModal } from '@/components/common/ReportModal';
import { CryptoTipModal } from './CryptoTipModal';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreVertical,
  Flag,
  Trash2,
  Send,
  Check,
  Coins,
  Eye,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  showCommentsDefault?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, showCommentsDefault = false }) => {
  const {
    currentUser,
    toggleLike,
    toggleBookmark,
    addComment,
    deleteComment,
    isAdmin,
    deletePost,
    incrementViews,
  } = useApp();

  const [showComments, setShowComments] = useState(showCommentsDefault);
  const [commentText, setCommentText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [hasLoadedComments, setHasLoadedComments] = useState(false);

  // Auto-record post view once per browser session
  React.useEffect(() => {
    if (post?.id && typeof window !== 'undefined') {
      const viewKey = `larvaz_viewed_${post.id}`;
      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, '1');
        incrementViews(post.id);
      }
    }
  }, [post.id]);

  // Precise time ago formatting (e.g. "hace un momento", "hace 5m", "hace 2h")
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
      const months = Math.floor(days / 30);
      return `hace ${months}m`;
    } catch {
      return 'ahora';
    }
  };

  const handleShare = async () => {
    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/publicacion/${post.id}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Larvaz Hip-Hop: ${post.author.full_name}`,
          text: post.description,
          url: postUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(postUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleOpenComments = () => {
    if (!showComments && !hasLoadedComments) {
      // Lazy load from dataStore
      const { dataStore } = require('@/lib/data-store');
      setLocalComments(dataStore.getComments(post.id));
      setHasLoadedComments(true);
    }
    setShowComments(!showComments);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = addComment(post.id, commentText);
    setLocalComments((prev) => [...prev, newComment]);
    setCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(commentId);
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <article className="border-b border-surface-border p-4 md:p-5 hover:bg-surface/20 transition-colors">
      {/* 1. Author Header & Options Menu */}
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/artista/${post.author.username}`}
          className="flex items-center gap-3 group min-w-0"
        >
          <UserAvatar
            avatarUrl={post.author.avatar_url}
            name={post.author.full_name}
            size="md"
            className="group-hover:border-acid transition-colors"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-content-primary group-hover:text-acid transition-colors truncate">
                {post.author.full_name}
              </span>
              <span className="text-xs text-content-secondary truncate">
                @{post.author.username}
              </span>
              <span className="text-xs text-content-muted">·</span>
              <span className="text-xs text-content-muted">
                {formatTimeAgo(post.created_at)}
              </span>
            </div>

            {post.author.artistic_disciplines && (
              <p className="text-[11px] text-content-secondary/80 truncate">
                {post.author.artistic_disciplines}
              </p>
            )}
          </div>
        </Link>

        {/* Action Controls & Dropdown Menu */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {post.user_id !== currentUser?.id && (
            <Link
              href={`/mensajes?user=${post.author.username}`}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-surface-border hover:border-acid text-content-secondary hover:text-acid text-[11px] font-bold transition-all shadow-sm"
              title={`Enviar mensaje directo a @${post.author.username}`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-acid" />
              <span className="hidden sm:inline">Mensaje</span>
            </Link>
          )}

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors"
              aria-label="Opciones de publicación"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-surface-elevated border border-surface-border shadow-2xl z-30 py-1 text-xs">
                {post.user_id !== currentUser?.id && (
                  <Link
                    href={`/mensajes?user=${post.author.username}`}
                    onClick={() => setShowMenu(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-content-primary hover:text-acid hover:bg-surface transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-acid" />
                    <span>Enviar mensaje</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-content-secondary hover:text-magenta hover:bg-surface transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Denunciar</span>
                </button>
                {(isAdmin || post.user_id === currentUser.id) && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm('¿Seguro que deseas eliminar esta publicación del muro?')) {
                        deletePost(post.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-magenta hover:bg-magenta/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Post Description & Clickable Hashtags */}
      <div className="mt-3 text-sm text-content-primary leading-relaxed break-words">
        <Link href={`/publicacion/${post.id}`} className="hover:text-content-primary">
          <p className="whitespace-pre-line">{post.description}</p>
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/explorar?tag=${encodeURIComponent(tag)}`}
                className="text-xs font-semibold text-acid/90 hover:text-acid hover:underline"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 3. Media Preview / Embedded Player (only if externalUrl is present) */}
      {post.external_url && (
        <MediaEmbed
          metadata={post.metadata}
          provider={post.provider}
          externalUrl={post.external_url}
        />
      )}

      {/* 4. Action Bar (Likes, Comments, Crypto Tip, Bookmarks, Share) */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-border/50 text-content-secondary text-xs">
        {/* Likes / Props */}
        <button
          onClick={() => toggleLike(post.id)}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors group ${
            post.user_has_liked
              ? 'text-magenta font-bold'
              : 'hover:text-magenta hover:bg-magenta/10'
          }`}
          aria-label="Me gusta"
        >
          <Heart
            className={`w-4 h-4 transition-transform group-hover:scale-125 ${
              post.user_has_liked ? 'fill-current text-magenta' : ''
            }`}
          />
          <span>{post.likes_count}</span>
        </button>

        {/* Comments Toggle */}
        <button
          onClick={handleOpenComments}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors hover:text-cyan hover:bg-cyan/10 ${
            showComments ? 'text-cyan font-bold' : ''
          }`}
          aria-label="Comentarios"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count}</span>
        </button>

        {/* Crypto Tip / Micro-mecenazgo */}
        <button
          onClick={() => setShowTipModal(true)}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all group ${
            (post.crypto_tips_count || 0) > 0
              ? 'text-acid bg-acid/10 border border-acid/30 font-bold'
              : 'hover:text-acid hover:bg-acid/10'
          }`}
          title="Propina cripto directa al artista"
          aria-label="Propina Cripto"
        >
          <Coins className="w-4 h-4 transition-transform group-hover:scale-125 text-acid" />
          <span className="font-mono text-xs text-acid">
            {(post.crypto_tips_total || 0) > 0 ? `$${post.crypto_tips_total}` : 'Tip'}
          </span>
        </button>

        {/* Bookmark */}
        <button
          onClick={() => toggleBookmark(post.id)}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors group ${
            post.user_has_bookmarked
              ? 'text-acid font-bold'
              : 'hover:text-acid hover:bg-acid/10'
          }`}
          aria-label="Guardar"
        >
          <Bookmark
            className={`w-4 h-4 transition-transform group-hover:scale-125 ${
              post.user_has_bookmarked ? 'fill-current text-acid' : ''
            }`}
          />
        </button>

        {/* Views Counter */}
        <div
          className="flex items-center gap-1.5 py-1 px-2 rounded-lg text-content-muted hover:text-content-secondary transition-colors cursor-default"
          title={`${post.views_count || 1} visualizaciones`}
        >
          <Eye className="w-3.5 h-3.5 text-content-muted" />
          <span className="font-mono text-xs">
            {post.views_count && post.views_count >= 1000
              ? `${(post.views_count / 1000).toFixed(1)}k`
              : (post.views_count || 1)}
          </span>
        </div>

        {/* Share Button with Toast indication */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-content-primary hover:bg-surface-elevated transition-colors"
          aria-label="Compartir"
        >
          {isCopied ? (
            <span className="flex items-center gap-1 text-acid font-bold">
              <Check className="w-4 h-4" />
              <span>Copiado</span>
            </span>
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 5. Inline Comments Drawer */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-surface-border/80 space-y-3 bg-surface/40 p-3 rounded-xl animate-fade-in">
          {/* New comment input */}
          <form onSubmit={handleSendComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Deja tu comentario o respeto cultural..."
              className="flex-1 bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:border-acid focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="p-2 rounded-xl bg-acid text-background font-bold hover:bg-acid-hover disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Enviar comentario"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {localComments.length === 0 ? (
              <p className="text-center text-xs text-content-secondary py-3">
                No hay comentarios todavía. ¡Sé el primero en aportar al muro!
              </p>
            ) : (
              localComments.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-lg bg-surface-elevated/70 border border-surface-border/50 text-xs flex justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/artista/${c.author?.username}`}
                        className="font-bold text-content-primary hover:text-acid truncate"
                      >
                        {c.author?.full_name}
                      </Link>
                      <span className="text-[10px] text-content-muted">
                        @{c.author?.username}
                      </span>
                      {c.user_id !== currentUser?.id && c.author?.username && (
                        <Link
                          href={`/mensajes?user=${c.author.username}`}
                          className="text-content-muted hover:text-acid p-0.5 transition-colors ml-1"
                          title={`Enviar mensaje a @${c.author.username}`}
                        >
                          <MessageCircle className="w-3 h-3 text-acid" />
                        </Link>
                      )}
                    </div>
                    <p className="text-content-secondary leading-relaxed break-words">
                      {c.content}
                    </p>
                  </div>

                  {(c.user_id === currentUser.id || currentUser.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-content-muted hover:text-magenta p-1 transition-colors flex-shrink-0"
                      aria-label="Eliminar comentario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetId={post.id}
      />

      {/* Crypto Tip Modal */}
      <CryptoTipModal
        post={post}
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
      />
    </article>
  );
};
