'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { useApp } from '@/context/AppContext';
import {
  Home,
  Compass,
  Calendar,
  Bookmark,
  Bell,
  HeartHandshake,
  Settings,
  ShieldAlert,
  Plus,
  Users,
  Check,
  ChevronDown,
  LogOut,
  Radio,
  UserCheck,
  MessageCircle,
  Zap,
} from 'lucide-react';

export const SidebarLeft: React.FC = () => {
  const pathname = usePathname();
  const {
    currentUser,
    setCurrentUser,
    availableProfiles,
    unreadNotifsCount,
    isSupabaseConnected,
    isRadioPlaying,
    isAdmin,
    isSuperAdmin,
  } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const mainLinks = [
    { label: 'Inicio', href: '/', icon: Home },
    { label: 'Explorar', href: '/explorar', icon: Compass },
    {
      label: 'Radio 24/7',
      href: '/radio',
      icon: Radio,
      badge: isRadioPlaying ? 'VIVO' : undefined,
      badgeColor: 'bg-acid text-background',
    },
    { label: 'B-Boys & Breaking', href: '/breaking', icon: Zap },
    { label: 'Mensajes', href: '/mensajes', icon: MessageCircle },
    { label: 'Eventos', href: '/eventos', icon: Calendar },
    { label: 'Mi Panel', href: '/panel', icon: UserCheck },
    { label: 'Guardados', href: '/guardados', icon: Bookmark },
    {
      label: 'Notificaciones',
      href: '/notificaciones',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount.toString() : undefined,
      badgeColor: 'bg-magenta text-content-primary',
    },
    { label: 'Apoyar Larvaz', href: '/apoyar-larvaz', icon: HeartHandshake },
    { label: 'Configuración', href: '/configuracion', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 border-r border-surface-border bg-background/80 backdrop-blur-md p-4 lg:p-6 overflow-y-auto">
      {/* Top Brand & Links */}
      <div className="space-y-6">
        <div className="px-2">
          <Logo size="md" showTagline={true} />
        </div>



        {/* Navigation list */}
        <nav className="space-y-1">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-surface text-acid border border-surface-border shadow-acid-sm'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-acid' : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${item.badgeColor || 'bg-magenta text-content-primary'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Admin / Super Admin link */}
          <Link
            href="/admin"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
              pathname === '/admin' || pathname === '/superadmin'
                ? 'bg-surface text-acid border border-acid/40'
                : 'text-content-secondary hover:text-acid hover:bg-surface/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-acid" />
              <span>{isSuperAdmin ? 'Super Admin' : 'Moderación / Admin'}</span>
            </div>
            {isAdmin && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-acid/20 text-acid border border-acid/40">
                {currentUser.role}
              </span>
            )}
          </Link>
        </nav>

        {/* Primary CTA: Publicar */}
        <Link
          href="/crear"
          className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-acid text-background font-display font-black tracking-wider text-lg uppercase shadow-acid-glow hover:bg-acid-hover active:scale-98 transition-all"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>Publicar en el Muro</span>
        </Link>
      </div>

      {/* Bottom User Area & Quick Switcher for Demo */}
      <div className="pt-4 border-t border-surface-border relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-surface border border-surface-border hover:border-acid transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser.full_name}
              className="w-10 h-10 rounded-full object-cover border border-surface-elevated flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-content-primary truncate">
                {currentUser.full_name}
              </p>
              <p className="text-[11px] text-content-secondary truncate">
                @{currentUser.username}
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-content-secondary flex-shrink-0 ml-1" />
        </button>

        {/* User Switcher Dropdown */}
        {showUserMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-surface-elevated border border-surface-border shadow-2xl z-50 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-acid" />
              <span>Cambiar Perfil de Prueba</span>
            </div>
            {availableProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setCurrentUser(p);
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface text-left transition-colors text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <img
                    src={p.avatar_url}
                    alt={p.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="truncate">
                    <span className="font-semibold text-content-primary block truncate">
                      {p.full_name}
                    </span>
                    <span className="text-[10px] text-content-secondary block">
                      @{p.username} {p.role === 'admin' ? '(Admin)' : ''}
                    </span>
                  </div>
                </div>
                {currentUser.id === p.id && (
                  <Check className="w-4 h-4 text-acid flex-shrink-0" />
                )}
              </button>
            ))}

            <div className="border-t border-surface-border pt-1 mt-1 flex justify-between px-2 text-[11px]">
              <Link
                href="/login"
                className="text-content-secondary hover:text-acid py-1"
                onClick={() => setShowUserMenu(false)}
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="text-acid font-bold py-1"
                onClick={() => setShowUserMenu(false)}
              >
                Registrarse
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
