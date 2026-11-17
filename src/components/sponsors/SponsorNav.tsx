'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Crown, Flame, Heart, Store, Trophy } from 'lucide-react';

const links = [
  { href: '/sponsors', label: 'Inicio', icon: Crown, exact: true },
  { href: '/sponsors/explorar', label: 'Explorar', icon: Compass },
  { href: '/sponsors/marcas', label: 'Marcas', icon: Store },
  { href: '/sponsors/sorteos', label: 'Sorteos', icon: Trophy },
  { href: '/sponsors/desafios', label: 'Desafíos', icon: Flame },
  { href: '/sponsors/campanas', label: 'Proyectos', icon: Heart },
];

export function SponsorNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-surface-border bg-surface p-1">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition ${
              active ? 'bg-acid text-background' : 'text-content-secondary hover:bg-surface-elevated hover:text-content-primary'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
