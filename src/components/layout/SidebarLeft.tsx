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
  LogIn,
  UserPlus,
  User,
  Sparkles,
  Share2,
} from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';

export const SidebarLeft: React.FC = () => {
  const pathname = usePathname();
  const {
    currentUser,
    unreadNotifsCount,
    isSupabaseConnected,
    isRadioPlaying,
    isAdmin,
    isSuperAdmin,
    logout,
  } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

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

          {/* Super Admin link - ONLY visible for super_admin */}
          {isSuperAdmin && (
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
                <span>Super Admin</span>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-acid/20 text-acid border border-acid/40">
                Super Admin
              </span>
            </Link>
          )}
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

      {/* Bottom User Area: Real Session or Login/Register */}
      <div className="pt-4 border-t border-surface-border relative">
        {currentUser.is_guest ? (
          <div className="space-y-2">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-surface border border-surface-border hover:border-acid text-content-primary text-xs font-bold transition-all"
            >
              <LogIn className="w-4 h-4 text-acid" />
              <span>Iniciar Sesión</span>
            </Link>
            <Link
              href="/registro"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-acid text-background hover:bg-acid-hover text-xs font-black uppercase tracking-wider shadow-acid-glow transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta</span>
            </Link>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-surface border border-surface-border hover:border-acid transition-colors text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <UserAvatar
                  avatarUrl={currentUser.avatar_url}
                  name={currentUser.full_name}
                  size="md"
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

            {/* User Real Session Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-surface-elevated border border-surface-border shadow-2xl z-50 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                  Sesión Activa
                </div>
                <Link
                  href={`/artista/${currentUser.username}`}
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface text-content-primary transition-colors"
                >
                  <User className="w-4 h-4 text-acid" />
                  <span>Mi Perfil Cultural</span>
                </Link>
                <Link
                  href="/panel"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface text-content-primary transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-cyan" />
                  <span>Mi Panel & Billetera</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const refLink = `${window.location.origin}/registro?ref=${currentUser.username}`;
                    navigator.clipboard?.writeText(refLink);
                    setCopiedRef(true);
                    setTimeout(() => setCopiedRef(false), 2000);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface text-content-primary transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 className="w-4 h-4 text-magenta" />
                    <span>Copiar Mi Link de Referido</span>
                  </div>
                  {copiedRef && <Check className="w-3.5 h-3.5 text-acid" />}
                </button>
                <div className="border-t border-surface-border/60 my-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-magenta/10 text-magenta transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
