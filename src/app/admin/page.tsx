'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataStore } from '@/lib/data-store';
import { UserRole } from '@/types';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  ShieldAlert,
  ShieldCheck,
  Flag,
  EyeOff,
  Check,
  X,
  Users,
  Coins,
  Radio,
  Trash2,
  AlertTriangle,
  Lock,
  BarChart3,
  UserX,
  UserCheck,
  Play,
  Pause,
} from 'lucide-react';

export default function SuperAdminPage() {
  const {
    currentUser,
    updateUserRole,
    toggleUserBan,
    deletePost,
    isRadioPlaying,
    toggleRadio,
    changeStation,
    currentStation,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'metricas' | 'usuarios' | 'reportes' | 'radio'>('metricas');
  const [reports, setReports] = useState(dataStore.getAdminReports());
  const [profiles, setProfiles] = useState(dataStore.getAllProfiles());
  const [stats, setStats] = useState(dataStore.getGlobalStats());

  const isSuperAdmin = currentUser.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-magenta/10 border border-magenta/30 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-magenta" />
        </div>
        <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
          ACCESO RESTRINGIDO
        </h1>
        <p className="text-xs text-content-secondary leading-relaxed">
          Este panel de control es exclusivo para la cuenta de Super Administrador de Larvaz Hip-Hop.
        </p>
        <p className="text-[11px] text-content-muted">
          Usuario: @{currentUser.username} · Rol: {currentUser.role}
        </p>
      </div>
    );
  }

  const handleResolveReport = (id: string, action: 'hide' | 'dismiss') => {
    dataStore.resolveReport(id, action);
    setReports([...dataStore.getAdminReports()]);
    setStats(dataStore.getGlobalStats());
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateUserRole(userId, newRole);
    setProfiles([...dataStore.getAllProfiles()]);
  };

  const handleToggleBan = (userId: string) => {
    toggleUserBan(userId);
    setProfiles([...dataStore.getAllProfiles()]);
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const resolvedReports = reports.filter((r) => r.status !== 'pending');

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-surface-border pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-acid" />
            <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
              PANEL SUPER ADMIN & MODERACIÓN
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Gestión global de la plataforma Larvaz Hip-Hop · Cultura & Seguridad
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-acid/20 text-acid font-display font-black tracking-wider uppercase border border-acid/40">
            {currentUser.role}
          </span>
          <span className="text-content-secondary font-bold">@{currentUser.username}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-border text-xs font-bold pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('metricas')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'metricas'
              ? 'bg-acid text-background shadow-acid-glow font-black'
              : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Métricas Globales</span>
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'usuarios'
              ? 'bg-acid text-background shadow-acid-glow font-black'
              : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Usuarios ({profiles.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reportes')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'reportes'
              ? 'bg-acid text-background shadow-acid-glow font-black'
              : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Denuncias ({pendingReports.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('radio')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'radio'
              ? 'bg-acid text-background shadow-acid-glow font-black'
              : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Radio en Vivo</span>
        </button>
      </div>

      {/* 1. Tab: Métricas Globales */}
      {activeTab === 'metricas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <p className="text-xs font-bold text-content-secondary uppercase">Usuarios Registrados</p>
              <p className="font-display font-black text-3xl text-acid mt-1">{stats.totalUsers}</p>
              <p className="text-[10px] text-content-muted mt-0.5">MC, DJs, Bboys, Graffiteros</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <p className="text-xs font-bold text-content-secondary uppercase">Publicaciones Activas</p>
              <p className="font-display font-black text-3xl text-cyan mt-1">{stats.totalPosts}</p>
              <p className="text-[10px] text-content-muted mt-0.5">Muro unificado compartido</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <p className="text-xs font-bold text-content-secondary uppercase">Volumen Cripto Tips</p>
              <p className="font-display font-black text-3xl text-magenta mt-1">${stats.totalTipsUsd}</p>
              <p className="text-[10px] text-content-muted mt-0.5">{stats.totalTipsCount} propinas directas</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <p className="text-xs font-bold text-content-secondary uppercase">Eventos en Agenda</p>
              <p className="font-display font-black text-3xl text-orange mt-1">{stats.totalEvents}</p>
              <p className="text-[10px] text-content-muted mt-0.5">Jams, batallas y expos</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <p className="text-xs font-bold text-content-secondary uppercase">Oyentes de la Radio</p>
              <p className="font-display font-black text-3xl text-acid mt-1">{stats.totalRadioListeners}</p>
              <p className="text-[10px] text-content-muted mt-0.5">Streaming underground 24/7</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <p className="text-xs font-bold text-content-secondary uppercase">Denuncias Pendientes</p>
              <p className={`font-display font-black text-3xl mt-1 ${stats.pendingReports > 0 ? 'text-magenta' : 'text-acid'}`}>
                {stats.pendingReports}
              </p>
              <p className="text-[10px] text-content-muted mt-0.5">Moderación comunitaria</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Tab: Gestión de Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="space-y-3">
          <p className="text-xs text-content-secondary">
            Cambia roles de permisos o suspende cuentas infractoras. Los cambios se sincronizan en tiempo real.
          </p>

          <div className="space-y-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-surface border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatarUrl={p.avatar_url}
                    name={p.username}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-content-primary">{p.full_name}</span>
                      <span className="text-acid font-bold">@{p.username}</span>
                      {p.is_banned && (
                        <span className="px-1.5 py-0.5 rounded bg-magenta/20 text-magenta font-black text-[9px] uppercase">
                          SUSPENDIDO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-content-muted">{p.artistic_disciplines || 'Comunidad'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Role Selector */}
                  <select
                    value={p.role}
                    onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                    className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
                  >
                    <option value="user">Usuario</option>
                    <option value="moderator">Moderador</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>

                  {/* Ban/Unban Button */}
                  <button
                    onClick={() => handleToggleBan(p.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      p.is_banned
                        ? 'bg-acid/20 text-acid hover:bg-acid/30 border border-acid/40'
                        : 'bg-magenta/20 text-magenta hover:bg-magenta/30 border border-magenta/40'
                    }`}
                  >
                    {p.is_banned ? 'Reactivar' : 'Suspender'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Tab: Denuncias */}
      {activeTab === 'reportes' && (
        <div className="space-y-4">
          {pendingReports.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface border border-surface-border text-xs text-content-secondary">
              No hay denuncias pendientes en este momento. ¡El muro está limpio!
            </div>
          ) : (
            pendingReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-2xl bg-surface border border-magenta/30 space-y-3"
              >
                <div className="flex items-start justify-between gap-2 text-xs">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-magenta/10 text-magenta font-black text-[10px] uppercase border border-magenta/30">
                      REPORTE DE {report.target_type}
                    </span>
                    <p className="font-bold text-content-primary text-sm mt-1">{report.reason}</p>
                    {report.details && (
                      <p className="text-content-secondary mt-1">{report.details}</p>
                    )}
                    <p className="text-[10px] text-content-muted mt-1">
                      Reportado por @{report.reporter?.username} · ID objetivo: {report.target_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleResolveReport(report.id, 'hide')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-magenta/20 hover:bg-magenta/30 text-magenta text-xs font-bold border border-magenta/40 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar Contenido</span>
                  </button>

                  {report.target_type === 'post' && (
                    <button
                      onClick={() => {
                        deletePost(report.target_id);
                        handleResolveReport(report.id, 'hide');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-magenta text-background text-xs font-bold hover:bg-magenta/90 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Post Definitivamente</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleResolveReport(report.id, 'dismiss')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface-hover text-content-secondary text-xs font-bold border border-surface-border transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Desestimar</span>
                  </button>
                </div>
              </div>
            ))
          )}

          {resolvedReports.length > 0 && (
            <div className="pt-4 border-t border-surface-border space-y-2">
              <h3 className="text-xs font-bold text-content-secondary uppercase">
                Historial de Denuncias Resueltas
              </h3>
              {resolvedReports.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-surface/40 border border-surface-border text-xs flex items-center justify-between opacity-70"
                >
                  <span className="text-content-secondary truncate">{r.reason}</span>
                  <span className="font-bold text-acid uppercase text-[10px]">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Tab: Radio Control */}
      {activeTab === 'radio' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <h3 className="font-display font-black text-base text-content-primary">
              CONTROL DE TRANSMISIÓN DE RADIO
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              La radio underground emite 24/7 boom-bap, rap en español y sesiones de scratch para toda la comunidad.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={toggleRadio}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-acid text-background font-display font-black tracking-wider uppercase text-sm shadow-acid-glow hover:bg-acid-hover transition-colors"
              >
                {isRadioPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pausar Emisión Global</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Reproducción de Prueba</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-content-secondary uppercase">
              Emisoras Configuradas
            </h4>
            {dataStore.getRadioStations().map((st) => (
              <div
                key={st.id}
                className="p-4 rounded-2xl bg-surface border border-surface-border flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-content-primary">{st.name}</p>
                    {st.is_live && (
                      <span className="px-1.5 py-0.5 rounded bg-acid/20 text-acid font-black text-[9px] uppercase">
                        EN VIVO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-content-secondary mt-0.5">{st.tagline}</p>
                  <p className="text-[11px] text-content-muted mt-1">{st.listeners_count} oyentes conectados</p>
                </div>

                <button
                  onClick={() => changeStation(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentStation.id === st.id
                      ? 'bg-acid text-background shadow-acid-glow font-black'
                      : 'bg-surface-elevated hover:bg-surface-hover text-content-primary border border-surface-border'
                  }`}
                >
                  {currentStation.id === st.id ? 'Emisora Activa' : 'Sintonizar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
