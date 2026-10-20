'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Home, Compass, PlusCircle, Radio, UserCheck } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { currentUser, isRadioPlaying } = useApp();

  const navItems = [
    { label: 'Inicio', href: '/', icon: Home },
    { label: 'Explorar', href: '/explorar', icon: Compass },
    { label: 'Publicar', href: '/crear', icon: PlusCircle, isAction: true },
    { label: 'Radio', href: '/radio', icon: Radio, hasBadge: isRadioPlaying },
    { label: 'Mi Panel', href: '/panel', icon: UserCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-surface-border px-1 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <div className="w-13 h-13 p-3 rounded-full bg-acid text-background font-bold flex items-center justify-center shadow-acid-glow group-hover:scale-105 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-acid mt-0.5 tracking-wider uppercase">
                  Publicar
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-acid font-bold'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-acid animate-ping" />
                )}
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-acid" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[60px] text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
