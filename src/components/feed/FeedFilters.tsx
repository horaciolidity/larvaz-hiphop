'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { FeedFilter, ContentType } from '@/types';
import { Sparkles, Clock, Flame, Disc3, Video, Palette, Globe, MessageSquare } from 'lucide-react';

export const FeedFilters: React.FC = () => {
  const { feedFilter, setFeedFilter, contentTypeFilter, setContentTypeFilter } = useApp();

  const mainTabs: { key: FeedFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'para_ti', label: 'Para Ti', icon: Sparkles },
    { key: 'reciente', label: 'Reciente', icon: Clock },
    { key: 'popular', label: 'Popular', icon: Flame },
  ];

  const contentFilters: { key: ContentType | 'all'; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'text', label: 'Letras & Barras', icon: MessageSquare },
    { key: 'music', label: 'Música & Beats', icon: Disc3 },
    { key: 'video', label: 'Videos', icon: Video },
    { key: 'visual_art', label: 'Graffiti & Arte', icon: Palette },
    { key: 'link', label: 'Enlaces', icon: Globe },
  ];

  return (
    <div className="border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 md:top-0 z-30 px-4 pt-3 pb-2 space-y-2.5">
      {/* Primary Feed Ordering Tabs */}
      <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-surface-border">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = feedFilter === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setFeedFilter(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-acid text-background shadow-acid-sm'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-background' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Content Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {contentFilters.map((cf) => {
          const Icon = cf.icon;
          const isActive = contentTypeFilter === cf.key;

          return (
            <button
              key={cf.key}
              onClick={() => setContentTypeFilter(cf.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                isActive
                  ? 'bg-surface-elevated text-acid border-acid shadow-acid-sm'
                  : 'bg-surface text-content-secondary border-surface-border hover:border-content-secondary/40'
              }`}
            >
              {Icon && <Icon className="w-3 h-3 text-acid" />}
              <span>{cf.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
