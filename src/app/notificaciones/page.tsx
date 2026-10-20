'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck } from 'lucide-react';

export default function NotificacionesPage() {
  const { notifications, markNotificationsAsRead } = useApp();

  useEffect(() => {
    markNotificationsAsRead();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-magenta fill-current" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-cyan" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-acid" />;
      default:
        return <Bell className="w-4 h-4 text-orange" />;
    }
  };

  const getMessage = (type: string, actorName: string) => {
    switch (type) {
      case 'like':
        return `le dio props a tu publicación en el muro.`;
      case 'comment':
        return `dejó un comentario en tu publicación.`;
      case 'follow':
        return `ha comenzado a seguir tus creaciones.`;
      default:
        return `interactuó contigo.`;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <div>
          <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
            NOTIFICACIONES
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Actividad de la comunidad en tus publicaciones y perfiles.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-content-secondary">
          <CheckCheck className="w-4 h-4 text-acid" />
          <span>Al día</span>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Bell className="w-10 h-10 text-content-muted mx-auto" />
            <p className="text-xs text-content-secondary">
              No tienes notificaciones pendientes por el momento.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                notif.read
                  ? 'bg-surface border-surface-border/60'
                  : 'bg-surface-elevated border-acid/30 shadow-acid-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-surface border border-surface-border flex-shrink-0">
                  {getIcon(notif.type)}
                </div>

                <Link
                  href={`/artista/${notif.actor?.username}`}
                  className="flex items-center gap-2.5 min-w-0 group"
                >
                  <img
                    src={notif.actor?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={notif.actor?.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-surface-elevated flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-content-primary group-hover:text-acid transition-colors">
                      <strong className="font-bold">{notif.actor?.full_name}</strong>{' '}
                      <span className="text-content-secondary font-normal">
                        {getMessage(notif.type, notif.actor?.full_name)}
                      </span>
                    </p>
                    <span className="text-[10px] text-content-muted">
                      {new Date(notif.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </Link>
              </div>

              {notif.post_id && (
                <Link
                  href={`/publicacion/${notif.post_id}`}
                  className="px-2.5 py-1 rounded-lg bg-surface-elevated hover:bg-surface-hover text-xs font-bold text-acid flex-shrink-0 border border-surface-border"
                >
                  Ver
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
