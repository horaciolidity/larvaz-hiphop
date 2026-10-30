'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { UserAvatar } from '@/components/common/UserAvatar';
import { MessageCircle, Radio, Sparkles, Users } from 'lucide-react';

interface ActiveStatus {
  userId: string;
  activity: string;
  activityIcon: string;
}

const ACTIVITIES: Record<string, { activity: string; tag: string }> = {
  'user-graffiti-krew': { activity: 'Pintando mural', tag: '🎨 Graffiti' },
  'user-dj-raw': { activity: 'Cocinando beats', tag: '🎧 DJ & Beats' },
  'user-mc-asfalto': { activity: 'Escribiendo barras', tag: '🎤 MC Rimas' },
  'user-bboy-cypher': { activity: 'Entrenando footwork', tag: '🤸 B-Boy' },
  'user-larvaz-admin': { activity: 'Moderando el muro', tag: '⚡ Staff' },
};

export const ConnectedUsersBar: React.FC = () => {
  const { availableProfiles, currentUser, isAdmin } = useApp();

  // Exclude current user and admin profiles (unless logged user is admin)
  const otherProfiles = availableProfiles.filter((p) => {
    if (p.id === currentUser.id) return false;
    // Hide admin/super_admin profiles from regular users
    if (!isAdmin && (p.role === 'admin' || p.role === 'super_admin')) return false;
    return true;
  });
  const onlineCount = otherProfiles.length + (currentUser.is_guest ? 0 : 1);

  return (
    <div className="border-b border-surface-border bg-surface/30 backdrop-blur-sm px-4 py-3">
      {/* Header title */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-acid" />
            <span className="absolute w-2.5 h-2.5 rounded-full bg-acid animate-ping opacity-75" />
          </div>
          <span className="font-display font-black text-xs uppercase tracking-wider text-content-primary flex items-center gap-1.5">
            <span>Comunidad en Vivo</span>
            <span className="px-1.5 py-0.2 rounded-full bg-acid/20 text-acid text-[10px] font-mono">
              {onlineCount} activos
            </span>
          </span>
        </div>

        <Link
          href="/mensajes"
          className="text-[11px] text-content-muted hover:text-acid font-bold transition-colors flex items-center gap-1"
        >
          <MessageCircle className="w-3 h-3 text-acid" />
          <span>Abrir Chat</span>
        </Link>
      </div>

      {/* Horizontal Online Users Scroll */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
        {/* Current User Pill */}
        {!currentUser.is_guest && (
          <div className="flex flex-col items-center flex-shrink-0 group">
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-acid to-cyan shadow-acid-sm">
              <UserAvatar
                avatarUrl={currentUser.avatar_url}
                name={currentUser.full_name}
                size="md"
                className="border-2 border-background"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-acid border-2 border-background" />
            </div>
            <span className="text-[10px] font-bold text-acid truncate max-w-[68px] mt-1 text-center">
              Tú
            </span>
            <span className="text-[9px] text-content-muted truncate max-w-[68px]">
              En línea
            </span>
          </div>
        )}

        {/* Other Active Artists */}
        {otherProfiles.map((user) => {
          const statusInfo = ACTIVITIES[user.id] || {
            activity: 'En el cypher',
            tag: user.artistic_disciplines || '🎤 Rap',
          };

          return (
            <div
              key={user.id}
              className="relative flex flex-col items-center flex-shrink-0 group"
            >
              <Link
                href={`/artista/${user.username}`}
                className="relative p-0.5 rounded-full bg-surface-elevated group-hover:bg-acid transition-all duration-300"
                title={`${user.full_name} (@${user.username}) - ${statusInfo.activity}`}
              >
                <UserAvatar
                  avatarUrl={user.avatar_url}
                  name={user.full_name}
                  size="md"
                  className="border-2 border-background"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-acid border-2 border-background ring-1 ring-background" />
              </Link>

              {/* Username */}
              <Link
                href={`/artista/${user.username}`}
                className="text-[10px] font-bold text-content-primary group-hover:text-acid truncate max-w-[70px] mt-1 text-center transition-colors"
              >
                {user.full_name.split(' ')[0]}
              </Link>

              {/* Tag / Activity */}
              <span className="text-[8px] text-content-muted truncate max-w-[70px] font-mono leading-none">
                {statusInfo.tag}
              </span>

              {/* Quick message icon on hover */}
              <Link
                href={`/mensajes?user=${user.username}`}
                className="absolute -top-1 -right-1 p-1 rounded-full bg-surface-elevated border border-acid text-acid opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                title={`Enviar mensaje a @${user.username}`}
              >
                <MessageCircle className="w-2.5 h-2.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
