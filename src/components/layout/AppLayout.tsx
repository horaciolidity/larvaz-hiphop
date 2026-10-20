'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarLeft } from './SidebarLeft';
import { SidebarRight } from './SidebarRight';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { RadioMiniPlayer } from '@/components/radio/RadioMiniPlayer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/registro';

  if (isAuthPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-background text-content-primary flex flex-col md:flex-row justify-center selection:bg-acid selection:text-background">
      {/* 1. Left Sidebar Navigation (Desktop) */}
      <SidebarLeft />

      {/* 2. Central Feed & Content Area */}
      <div className="flex-1 max-w-2xl min-h-screen border-x border-surface-border/50 flex flex-col">
        <Navbar />
        <main className="flex-1 pb-24 md:pb-12">{children}</main>
      </div>

      {/* 3. Right Sidebar Discoveries (Desktop XL) */}
      <SidebarRight />

      {/* 4. Global Persistent Radio Player */}
      <RadioMiniPlayer />

      {/* 5. Bottom Mobile Navigation Menu */}
      <BottomNav />
    </div>
  );
};
