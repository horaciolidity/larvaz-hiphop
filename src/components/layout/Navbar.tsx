'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';
import { useApp } from '@/context/AppContext';
import { Bell, Search, Radio, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { unreadNotifsCount, currentUser, isRadioPlaying } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-surface-border md:hidden px-3 py-2.5 flex items-center justify-between">
      <Logo size="sm" />

      <div className="flex items-center gap-1.5">
        {/* Radio Quick Link */}
        <Link
          href="/radio"
          className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${
            isRadioPlaying
              ? 'bg-acid/10 border-acid text-acid shadow-acid-glow'
              : 'bg-surface border-surface-border text-content-secondary hover:text-acid'
          }`}
          aria-label="Radio Underground"
        >
          <Radio className="w-4 h-4" />
          {isRadioPlaying && <span className="w-1.5 h-1.5 rounded-full bg-acid animate-ping" />}
        </Link>

        {/* Search */}
        <Link
          href="/explorar"
          className="p-2 rounded-xl bg-surface border border-surface-border text-content-secondary hover:text-acid hover:border-acid transition-colors"
          aria-label="Buscar"
        >
          <Search className="w-4 h-4" />
        </Link>

        {/* Notifications */}
        <Link
          href="/notificaciones"
          className="relative p-2 rounded-xl bg-surface border border-surface-border text-content-secondary hover:text-acid hover:border-acid transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-4 h-4" />
          {unreadNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-magenta text-content-primary text-[9px] font-black flex items-center justify-center animate-pulse">
              {unreadNotifsCount}
            </span>
          )}
        </Link>

        {/* User Panel Avatar Link */}
        <Link
          href="/panel"
          className="ml-0.5 p-0.5 rounded-xl border border-surface-border hover:border-acid transition-colors"
          aria-label="Mi Panel"
        >
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={currentUser.username}
            className="w-7 h-7 rounded-lg object-cover"
          />
        </Link>
      </div>
    </header>
  );
};
