'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Megaphone, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SidebarLeft } from './SidebarLeft';
import { SidebarRight } from './SidebarRight';
import { Navbar } from './Navbar';
import { TopLocationBar } from './TopLocationBar';
import { BottomNav } from './BottomNav';
import { RadioMiniPlayer } from '@/components/radio/RadioMiniPlayer';
import { GuestWall } from '@/components/common/GuestWall';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { platformSettings } = useApp();
  const [dismissedAnnouncement, setDismissedAnnouncement] = useState('');
  const isAuthPage = pathname === '/login' || pathname === '/registro';
  const announcement = platformSettings.announcement || '';
  const showAnnouncement = Boolean(announcement) && dismissedAnnouncement !== announcement;

  if (isAuthPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-background text-content-primary flex flex-col md:flex-row justify-center selection:bg-acid selection:text-background">
      {/* 1. Left Sidebar Navigation (Desktop) */}
      <SidebarLeft />

      {/* 2. Central Feed & Content Area */}
      <div className="flex-1 max-w-2xl min-h-screen border-x border-surface-border/50 flex flex-col">
        <TopLocationBar />
        <Navbar />
        {showAnnouncement && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-orange/40 bg-orange/10 px-3 py-2 text-[11px] text-orange">
            <Megaphone className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="flex-1 leading-snug font-bold">{announcement}</p>
            <button
              type="button"
              onClick={() => setDismissedAnnouncement(announcement)}
              className="p-0.5 rounded hover:bg-orange/20 transition-colors"
              aria-label="Cerrar anuncio"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <main className="flex-1 pb-24 md:pb-12">{children}</main>
      </div>

      {/* 3. Right Sidebar Discoveries (Desktop XL) */}
      <SidebarRight />

      {/* 4. Global Persistent Radio Player */}
      {platformSettings.features.radioEnabled && <RadioMiniPlayer />}

      {/* 5. Bottom Mobile Navigation Menu */}
      <BottomNav />

      {/* 6. Guest Wall — se muestra a visitantes no registrados tras 60 segundos */}
      <GuestWall />
    </div>
  );
};
