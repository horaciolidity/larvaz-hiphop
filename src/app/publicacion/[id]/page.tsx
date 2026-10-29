'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { MediaEmbed } from '@/components/feed/MediaEmbed';
import { ReportModal } from '@/components/common/ReportModal';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Send,
  Trash2,
  Flag,
  Check,
  Eye,
} from 'lucide-react';
import { dataStore } from '@/lib/data-store';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { currentUser, toggleLike, toggleBookmark, addComment, deleteComment } = useApp();

  const post = dataStore.getPostById(postId);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(dataStore.getComments(postId));
  const [isCopied, setIsCopied] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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

  const handleShare = async () => {
    const postUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Larvaz Hip-Hop: ${post.author.full_name}`,
          text: post.description,
          url: postUrl,
        });
        return;
      } catch {
        // fallback
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(postUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
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
            <p className="text-xs text-content-secondary">
              @{post.author.username}
            </p>
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
                href={`/explorar?tag=${t}`}
                className="text-xs font-bold text-acid hover:underline"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Media Player / External Embed (only if URL present) */}
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
          <span>{comments.length} Comentarios</span>
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

        <button
          onClick={handleShare}
          className="p-2 rounded-lg text-content-secondary hover:text-content-primary transition-colors"
          aria-label="Compartir"
        >
          {isCopied ? (
            <span className="flex items-center gap-1 text-acid font-bold text-xs">
              <Check className="w-4 h-4" />
              <span>Copiado</span>
            </span>
          ) : (
            <Share2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Comments Section */}
      <div className="space-y-4 pt-2">
        <h2 className="font-display font-black text-lg text-content-primary tracking-wide">
          CONVERSACIÓN & RESPETO ({comments.length})
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
          {comments.map((c) => (
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
          ))}
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
