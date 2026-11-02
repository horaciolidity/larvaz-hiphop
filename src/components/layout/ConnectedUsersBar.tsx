'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { UserAvatar } from '@/components/common/UserAvatar';
import { MessageCircle, Radio, Sparkles, Users } from 'lucide-react';
import { getLocationFlag } from '@/lib/country-utils';

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
  const { availableProfiles, totalMembersCount, currentUser, isAdmin, userLocation } = useApp();
  const currentFlag = getLocationFlag(userLocation || currentUser.location);

  // Exclude current user and admin profiles (unless logged user is admin)
  // Put newly registered users first (they have newer timestamps or custom IDs)
  const otherProfiles = [...availableProfiles]
    .filter((p) => {
      if (p.id === currentUser.id) return false;
      // Hide admin/super_admin profiles from regular users
      if (!isAdmin && (p.role === 'admin' || p.role === 'super_admin')) return false;
      return true;
    })
    .sort((a, b) => {
      const isCustomA = a.is_custom || !a.id.startsWith('user-');
      const isCustomB = b.is_custom || !b.id.startsWith('user-');
      if (isCustomA !== isCustomB) return isCustomA ? -1 : 1;
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  const onlineCount = otherProfiles.length + (currentUser.is_guest ? 0 : 1);
  const totalJoinedCount = totalMembersCount || availableProfiles.length;

  return (
    <div className="border-b border-surface-border bg-surface/30 backdrop-blur-sm px-4 py-3">
      {/* Header title & User quantification */}
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-acid" />
            <span className="absolute w-2.5 h-2.5 rounded-full bg-acid animate-ping opacity-75" />
          </div>
          <span className="font-display font-black text-xs uppercase tracking-wider text-content-primary">
            Comunidad en Vivo
          </span>

          {/* Conectados en vivo */}
          <span
            className="px-2 py-0.5 rounded-full bg-acid/20 text-acid border border-acid/30 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-acid-sm"
            title="Usuarios conectados en vivo ahora"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-acid animate-pulse" />
            <span>{onlineCount} conectados</span>
          </span>

          {/* Total de usuarios que se unieron */}
          <span
            className="px-2 py-0.5 rounded-full bg-surface border border-surface-border text-content-secondary text-[11px] font-mono flex items-center gap-1.5"
            title="Total de artistas y usuarios que se unieron a la comunidad Larvaz"
          >
            <Users className="w-3 h-3 text-cyan" />
            <span>
              <strong className="text-content-primary font-bold">{totalJoinedCount}</strong> registrados
            </span>
          </span>
        </div>

        <Link
          href="/mensajes"
          className="text-[11px] text-content-muted hover:text-acid font-bold transition-colors flex items-center gap-1 ml-auto"
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
              {currentFlag && (
                <span
                  className="absolute -top-1 -right-1 text-[11px] leading-none bg-surface border border-surface-border rounded-full w-4 h-4 flex items-center justify-center shadow-sm pointer-events-none"
                  title={userLocation || currentUser.location || ''}
                  aria-hidden="true"
                >
                  {currentFlag}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-acid truncate max-w-[68px] mt-1 text-center flex items-center gap-0.5 justify-center">
              <span>Tú</span>
              {currentFlag && <span className="text-[9px]">{currentFlag}</span>}
            </span>
            <span className="text-[9px] text-content-muted truncate max-w-[68px]">
              En línea
            </span>
          </div>
        )}

        {/* Other Active Artists */}
        {otherProfiles.map((user) => {
          const isNewUser = user.is_custom || !user.id.startsWith('user-');
          const statusInfo = ACTIVITIES[user.id] || {
            activity: isNewUser ? 'Recién llegado a la plaza' : 'En el cypher',
            tag: isNewUser ? '✨ Nuevo' : (user.artistic_disciplines || '🎤 Rap'),
          };
          const userFlag = getLocationFlag(user.location);

          return (
            <div
              key={user.id}
              className="relative flex flex-col items-center flex-shrink-0 group"
            >
              <Link
                href={`/artista/${user.username}`}
                className={`relative p-0.5 rounded-full transition-all duration-300 ${isNewUser
                    ? 'bg-gradient-to-tr from-cyan via-acid to-magenta p-[2px] shadow-acid-sm'
                    : 'bg-surface-elevated group-hover:bg-acid'
                  }`}
                title={`${user.full_name} (@${user.username}) - ${statusInfo.activity}${user.location ? ` • ${user.location}` : ''}`}
              >
                <UserAvatar
                  avatarUrl={user.avatar_url}
                  name={user.full_name}
                  size="md"
                  className="border-2 border-background"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-acid border-2 border-background ring-1 ring-background" />
                {isNewUser ? (
                  <span
                    className="absolute -top-1 -left-1 text-[8px] bg-acid text-background font-black px-1 rounded-full uppercase tracking-tighter"
                    title="Usuario nuevo registrado"
                  >
                    Nuevo
                  </span>
                ) : null}
                {userFlag && (
                  <span
                    className="absolute -top-1 -right-1 text-[11px] leading-none bg-surface border border-surface-border rounded-full w-4 h-4 flex items-center justify-center shadow-sm pointer-events-none"
                    title={user.location || ''}
                    aria-hidden="true"
                  >
                    {userFlag}
                  </span>
                )}
              </Link>

              {/* Username */}
              <Link
                href={`/artista/${user.username}`}
                className="text-[10px] font-bold text-content-primary group-hover:text-acid truncate max-w-[70px] mt-1 text-center transition-colors flex items-center gap-0.5 justify-center"
              >
                <span className="truncate">{user.full_name.split(' ')[0]}</span>
                {userFlag && <span className="text-[9px] flex-shrink-0">{userFlag}</span>}
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
