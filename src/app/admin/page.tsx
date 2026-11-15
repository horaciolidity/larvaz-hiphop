'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { dataStore } from '@/lib/data-store';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_PLATFORM_SETTINGS,
  PlatformFeatureSettings,
  PlatformMediaSettings,
  PlatformSettings,
  PlatformWalletSettings,
} from '@/lib/platform-settings';
import { UserRole } from '@/types';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  getSuggestedNpcComments,
  randomSeed,
  SuggestedNpcComment,
  TEST_COMMENT_TONES,
  TestCommentTone,
} from '@/lib/test-comments';
import {
  ShieldAlert,
  Flag,
  EyeOff,
  X,
  Users,
  Radio,
  Trash2,
  Lock,
  BarChart3,
  Play,
  Pause,
  HardDrive,
  Wallet,
  SlidersHorizontal,
  LayoutDashboard,
  Save,
  RefreshCw,
  MessageSquare,
  CalendarDays,
  Database,
  Megaphone,
  Mail,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Image as ImageIcon,
  FlaskConical,
  Heart,
  Eye,
  Bookmark,
  Share2,
  Sparkles,
} from 'lucide-react';

type AdminTab =
  | 'resumen'
  | 'usuarios'
  | 'reportes'
  | 'radio'
  | 'medios'
  | 'wallets'
  | 'funciones'
  | 'pruebas';

interface OverviewData {
  counts: {
    users: number;
    posts: number;
    comments: number;
    events: number;
    pendingReports: number;
  };
  storage: { files: number; bytes: number };
  generatedAt: string;
}

interface TestPostRow {
  id: string;
  description: string;
  likes_count?: number;
  comments_count?: number;
  post_metadata?: any;
  profiles?: any;
}

interface TestReactionResult {
  applied: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    views: number;
    tone: TestCommentTone;
  };
  counters: {
    likes_count: number;
    comments_count: number;
    views_count: number;
    shares_count: number;
    bookmarks_count: number;
  };
  comments: Array<{
    id: string;
    content: string;
    author_name: string;
    username: string;
    persona_id: string;
    persona_label: string;
  }>;
}

function rawMetadataOf(post: any): Record<string, any> {
  const meta = Array.isArray(post?.post_metadata) ? post.post_metadata[0] : post?.post_metadata;
  const raw = meta?.raw_metadata;
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function formatMegabytes(bytes: number): string {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

const NumberField: React.FC<{
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}> = ({ label, hint, value, min, max, step = 1, suffix, onChange }) => (
  <label className="block space-y-1">
    <span className="text-[11px] font-bold text-content-secondary">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
      />
      {suffix ? <span className="text-[10px] text-content-muted whitespace-nowrap">{suffix}</span> : null}
    </div>
    {hint ? <span className="block text-[10px] text-content-muted leading-snug">{hint}</span> : null}
  </label>
);

const ToggleRow: React.FC<{
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}> = ({ title, description, checked, onChange, icon }) => (
  <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-surface-elevated border border-surface-border">
    <div className="flex items-start gap-2 min-w-0">
      {icon ? <span className="text-acid mt-0.5">{icon}</span> : null}
      <div className="min-w-0">
        <p className="text-xs font-bold text-content-primary">{title}</p>
        <p className="text-[10px] text-content-muted leading-snug mt-0.5">{description}</p>
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${
        checked ? 'bg-acid' : 'bg-surface-hover border border-surface-border'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-background transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  </div>
);

export default function SuperAdminPage() {
  const {
    currentUser,
    isSuperAdmin,
    platformSettings,
    updatePlatformSettings,
    refreshPlatformSettings,
    toggleUserBan,
    deletePost,
    refreshPosts,
    isRadioPlaying,
    toggleRadio,
    changeStation,
    currentStation,
  } = useApp();

  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<AdminTab>('resumen');
  const [reports, setReports] = useState(dataStore.getAdminReports());
  const [profiles, setProfiles] = useState(dataStore.getAllProfiles());
  const [stats, setStats] = useState(dataStore.getGlobalStats());
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [draft, setDraft] = useState<PlatformSettings>(platformSettings || DEFAULT_PLATFORM_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [usersMessage, setUsersMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Estado del modo de pruebas (solo Super Admin)
  const [testPosts, setTestPosts] = useState<TestPostRow[]>([]);
  const [testPostId, setTestPostId] = useState('');
  const [testCounts, setTestCounts] = useState({
    likes: 10,
    comments: 5,
    shares: 3,
    saves: 2,
    views: 50,
  });
  const [testTone, setTestTone] = useState<TestCommentTone>('mixed');
  const [testPreviewSeed, setTestPreviewSeed] = useState(1);
  const [testPreview, setTestPreview] = useState<SuggestedNpcComment[]>([]);
  const [testBusy, setTestBusy] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<TestReactionResult | null>(null);

  const getToken = useCallback(async (): Promise<string> => {
    if (!supabase) return '';
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || '';
    } catch {
      return '';
    }
  }, [supabase]);

  useEffect(() => {
    setDraft(platformSettings || DEFAULT_PLATFORM_SETTINGS);
  }, [platformSettings]);

  useEffect(() => {
    setProfiles([...dataStore.getAllProfiles()]);
    setReports(dataStore.getAdminReports());
    setStats(dataStore.getGlobalStats());
  }, [platformSettings]);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const token = await getToken();
      if (!token) {
        setOverviewError('Necesitás una sesión activa de Supabase.');
        return;
      }
      const res = await fetch(`/api/admin/overview?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOverviewError(payload?.error || 'No se pudieron cargar las métricas.');
        return;
      }
      setOverview(payload as OverviewData);
    } catch (err: any) {
      setOverviewError(String(err?.message || err));
    } finally {
      setOverviewLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadOverview();
      refreshPlatformSettings();
    }
  }, [isSuperAdmin, loadOverview, refreshPlatformSettings]);

  const loadTestPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/feed?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const payload = await res.json().catch(() => ({}));
      const rows = Array.isArray(payload?.posts) ? payload.posts : [];
      setTestPosts(rows.filter((post: any) => isUUID(String(post?.id))));
    } catch {
      // la lista se puede reintentar con el botón de recargar
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) loadTestPosts();
  }, [isSuperAdmin, loadTestPosts]);

  useEffect(() => {
    const previewCount = Math.max(3, Math.min(testCounts.comments || 3, 8));
    setTestPreview(getSuggestedNpcComments(previewCount, testTone, testPreviewSeed));
  }, [testTone, testPreviewSeed, testCounts.comments]);

  const handleResolveReport = (id: string, action: 'hide' | 'dismiss') => {
    dataStore.resolveReport(id, action);
    setReports([...dataStore.getAdminReports()]);
    setStats(dataStore.getGlobalStats());
  };

  const persistUserPatch = async (
    userId: string,
    patch: { role?: UserRole; is_banned?: boolean }
  ) => {
    if (!isUUID(userId)) {
      setUsersMessage({
        type: 'error',
        text: 'Este perfil es de demostración local y no existe en Supabase.',
      });
      return;
    }
    setUsersMessage(null);
    try {
      const token = await getToken();
      if (!token) {
        setUsersMessage({ type: 'error', text: 'Sesión de administrador requerida.' });
        return;
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, ...patch }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setUsersMessage({ type: 'error', text: payload?.error || 'No se pudo actualizar el usuario.' });
        return;
      }

      if (payload?.profile) {
        dataStore.mergeProfiles([payload.profile]);
      }
      if (patch.is_banned !== undefined) {
        toggleUserBan(userId);
      }
      setProfiles([...dataStore.getAllProfiles()]);
      setUsersMessage({ type: 'ok', text: 'Usuario actualizado correctamente.' });
    } catch (err: any) {
      setUsersMessage({ type: 'error', text: String(err?.message || err) });
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveMessage(null);
    const result = await updatePlatformSettings(draft);
    setSaving(false);
    if (result.success) {
      setSaveMessage({ type: 'ok', text: 'Configuración guardada y publicada para toda la plataforma.' });
      loadOverview();
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'No se pudo guardar.' });
    }
  };

  const updateDraftMedia = (patch: Partial<PlatformMediaSettings>) =>
    setDraft((prev) => ({ ...prev, media: { ...prev.media, ...patch } }));

  const updateDraftWallet = (patch: Partial<PlatformWalletSettings>) =>
    setDraft((prev) => ({ ...prev, wallets: { ...prev.wallets, ...patch } }));

  const updateDraftFeature = (patch: Partial<PlatformFeatureSettings>) =>
    setDraft((prev) => ({ ...prev, features: { ...prev.features, ...patch } }));

  const handleTestReactions = async () => {
    setTestMessage(null);

    if (!testPostId) {
      setTestMessage({ type: 'error', text: 'Elegí una publicación para la prueba.' });
      return;
    }

    const total =
      testCounts.likes + testCounts.comments + testCounts.shares + testCounts.saves + testCounts.views;
    if (total <= 0) {
      setTestMessage({ type: 'error', text: 'Indicá al menos una cantidad mayor a cero.' });
      return;
    }

    setTestBusy(true);
    try {
      const token = await getToken();
      if (!token) {
        setTestMessage({ type: 'error', text: 'Sesión de administrador requerida.' });
        return;
      }

      const res = await fetch('/api/admin/test-reactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          post_id: testPostId,
          ...testCounts,
          tone: testTone,
        }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setTestMessage({
          type: 'error',
          text: payload?.error || 'No se pudo aplicar la prueba.',
        });
        return;
      }

      setTestResult(payload as TestReactionResult);
      setTestMessage({
        type: 'ok',
        text: 'Prueba aplicada. Los contadores ya se ven en la plataforma.',
      });
      await loadTestPosts();
      refreshPosts();
    } catch (err: any) {
      setTestMessage({ type: 'error', text: String(err?.message || err) });
    } finally {
      setTestBusy(false);
    }
  };

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

  const pendingReports = reports.filter((r) => r.status === 'pending');
  const resolvedReports = reports.filter((r) => r.status !== 'pending');
  const usedMb = overview ? overview.storage.bytes / (1024 * 1024) : 0;
  const quotaMb = draft.media.storageQuotaMb || DEFAULT_PLATFORM_SETTINGS.media.storageQuotaMb;
  const storagePercent = Math.min(100, Math.round((usedMb / quotaMb) * 100));
  const isSettingsTab = activeTab === 'medios' || activeTab === 'wallets' || activeTab === 'funciones';
  const selectedTestPost = testPosts.find((post) => post.id === testPostId) || null;

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'usuarios', label: `Usuarios (${profiles.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'reportes', label: `Denuncias (${pendingReports.length})`, icon: <Flag className="w-3.5 h-3.5" /> },
    { id: 'radio', label: 'Radio', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'medios', label: 'Medios y almacenamiento', icon: <HardDrive className="w-3.5 h-3.5" /> },
    { id: 'wallets', label: 'Wallets', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'funciones', label: 'Funciones', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: 'pruebas', label: 'Pruebas', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-surface-border pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-acid" />
            <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
              PANEL SUPER ADMIN
            </h1>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Control total de la plataforma: comunidad, medios, wallets y funciones.
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
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSaveMessage(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-acid text-background shadow-acid-glow font-black'
                : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {isSettingsTab && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-2xl bg-surface border border-surface-border">
          <div>
            <p className="text-xs font-bold text-content-primary">Configuración global</p>
            <p className="text-[10px] text-content-muted">
              Los cambios afectan a todos los usuarios al guardar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saveMessage && (
              <span
                className={`text-[11px] font-bold flex items-center gap-1 ${
                  saveMessage.type === 'ok' ? 'text-acid' : 'text-magenta'
                }`}
              >
                {saveMessage.type === 'ok' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {saveMessage.text}
              </span>
            )}
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-acid text-background font-display font-black text-xs uppercase tracking-wider shadow-acid-glow hover:bg-acid-hover disabled:opacity-60 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando…' : 'Guardar cambios'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── RESUMEN ─────────────────────────────────────────────────────── */}
      {activeTab === 'resumen' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-content-muted">
              {overview
                ? `Actualizado: ${new Date(overview.generatedAt).toLocaleString('es-AR')}`
                : 'Métricas en tiempo real de Supabase'}
            </p>
            <button
              type="button"
              onClick={loadOverview}
              disabled={overviewLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-[11px] font-bold text-content-secondary hover:text-acid disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {overviewError && (
            <div className="p-3 rounded-xl bg-magenta/10 border border-magenta/30 text-[11px] text-magenta flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {overviewError}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Usuarios', value: overview?.counts.users ?? stats.totalUsers, icon: <Users className="w-4 h-4" />, tone: 'text-acid' },
              { label: 'Publicaciones', value: overview?.counts.posts ?? stats.totalPosts, icon: <ImageIcon className="w-4 h-4" />, tone: 'text-cyan' },
              { label: 'Comentarios', value: overview?.counts.comments ?? 0, icon: <MessageSquare className="w-4 h-4" />, tone: 'text-orange' },
              { label: 'Eventos', value: overview?.counts.events ?? stats.totalEvents, icon: <CalendarDays className="w-4 h-4" />, tone: 'text-magenta' },
              { label: 'Denuncias pendientes', value: overview?.counts.pendingReports ?? stats.pendingReports, icon: <Flag className="w-4 h-4" />, tone: 'text-magenta' },
              { label: 'Archivos en Storage', value: overview?.storage.files ?? 0, icon: <Database className="w-4 h-4" />, tone: 'text-acid' },
            ].map((card) => (
              <div key={card.label} className="p-4 rounded-2xl bg-surface border border-surface-border">
                <div className={`flex items-center gap-1.5 ${card.tone}`}>
                  {card.icon}
                  <p className="text-[10px] font-bold uppercase tracking-wider">{card.label}</p>
                </div>
                <p className={`font-display font-black text-3xl mt-1 ${card.tone}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Storage usage */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-acid" />
                <p className="text-xs font-bold text-content-primary">Uso de almacenamiento</p>
              </div>
              <span className="text-[11px] text-content-secondary font-bold">
                {formatMegabytes(overview?.storage.bytes || 0)} / {quotaMb} MB
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-elevated overflow-hidden border border-surface-border">
              <div
                className={`h-full transition-all ${
                  storagePercent > 85 ? 'bg-magenta' : storagePercent > 60 ? 'bg-orange' : 'bg-acid'
                }`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="text-[10px] text-content-muted">
              {overview?.storage.files || 0} archivos · cuota orientativa configurable en Medios.
            </p>
          </div>
        </div>
      )}

      {/* ── USUARIOS ────────────────────────────────────────────────────── */}
      {activeTab === 'usuarios' && (
        <div className="space-y-3">
          <p className="text-xs text-content-secondary">
            Cambiá roles o suspendé cuentas. Los cambios se guardan directo en Supabase.
          </p>

          {usersMessage && (
            <div
              className={`p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 ${
                usersMessage.type === 'ok'
                  ? 'bg-acid/10 border border-acid/30 text-acid'
                  : 'bg-magenta/10 border border-magenta/30 text-magenta'
              }`}
            >
              {usersMessage.text}
            </div>
          )}

          <div className="space-y-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-surface border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar avatarUrl={p.avatar_url} name={p.username} size="md" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-content-primary truncate">{p.full_name}</span>
                      <span className="text-acid font-bold">@{p.username}</span>
                      {p.role === 'super_admin' && (
                        <span className="px-1.5 py-0.5 rounded bg-acid/20 text-acid font-black text-[9px] uppercase">
                          SUPER ADMIN
                        </span>
                      )}
                      {p.is_banned && (
                        <span className="px-1.5 py-0.5 rounded bg-magenta/20 text-magenta font-black text-[9px] uppercase">
                          SUSPENDIDO
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-content-muted">
                      {p.artistic_disciplines || 'Comunidad'} · {p.id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <select
                    value={p.role}
                    disabled={p.id === currentUser.id || !isUUID(p.id)}
                    onChange={(e) => persistUserPatch(p.id, { role: e.target.value as UserRole })}
                    className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none disabled:opacity-50"
                  >
                    <option value="user">Usuario</option>
                    <option value="moderator">Moderador</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>

                  <button
                    type="button"
                    disabled={p.id === currentUser.id || !isUUID(p.id)}
                    onClick={() => persistUserPatch(p.id, { is_banned: !p.is_banned })}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors disabled:opacity-40 ${
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

      {/* ── DENUNCIAS ───────────────────────────────────────────────────── */}
      {activeTab === 'reportes' && (
        <div className="space-y-4">
          {pendingReports.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface border border-surface-border text-xs text-content-secondary">
              No hay denuncias pendientes. ¡El muro está limpio!
            </div>
          ) : (
            pendingReports.map((report) => (
              <div key={report.id} className="p-4 rounded-2xl bg-surface border border-magenta/30 space-y-3">
                <div className="text-xs">
                  <span className="inline-block px-2 py-0.5 rounded bg-magenta/10 text-magenta font-black text-[10px] uppercase border border-magenta/30">
                    REPORTE DE {report.target_type}
                  </span>
                  <p className="font-bold text-content-primary text-sm mt-1">{report.reason}</p>
                  {report.details && <p className="text-content-secondary mt-1">{report.details}</p>}
                  <p className="text-[10px] text-content-muted mt-1">
                    Reportado por @{report.reporter?.username} · ID: {report.target_id}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => handleResolveReport(report.id, 'hide')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-magenta/20 hover:bg-magenta/30 text-magenta text-xs font-bold border border-magenta/40 transition-colors"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar contenido</span>
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
                      <span>Eliminar publicación</span>
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
              <h3 className="text-xs font-bold text-content-secondary uppercase">Historial</h3>
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

      {/* ── RADIO ───────────────────────────────────────────────────────── */}
      {activeTab === 'radio' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <h3 className="font-display font-black text-base text-content-primary">
              CONTROL DE TRANSMISIÓN
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              La radio underground emite 24/7 boom-bap, rap en español y sesiones de scratch.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={toggleRadio}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-acid text-background font-display font-black tracking-wider uppercase text-sm shadow-acid-glow hover:bg-acid-hover transition-colors"
              >
                {isRadioPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pausar emisión</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar reproducción</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-content-secondary uppercase">Emisoras configuradas</h4>
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
                  <p className="text-[11px] text-content-muted mt-1">{st.listeners_count} oyentes</p>
                </div>

                <button
                  onClick={() => changeStation(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentStation.id === st.id
                      ? 'bg-acid text-background shadow-acid-glow font-black'
                      : 'bg-surface-elevated hover:bg-surface-hover text-content-primary border border-surface-border'
                  }`}
                >
                  {currentStation.id === st.id ? 'Activa' : 'Sintonizar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MEDIOS Y ALMACENAMIENTO ─────────────────────────────────────── */}
      {activeTab === 'medios' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan" />
              <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                Límites por publicación
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <NumberField
                label="Máximo de fotos por publicación"
                value={draft.media.maxImagesPerPost}
                min={1}
                max={10}
                onChange={(v) => updateDraftMedia({ maxImagesPerPost: v })}
              />
              <NumberField
                label="Máximo de audios por publicación"
                value={draft.media.maxAudiosPerPost}
                min={1}
                max={10}
                onChange={(v) => updateDraftMedia({ maxAudiosPerPost: v })}
              />
              <NumberField
                label="Tamaño máximo de imagen original"
                value={draft.media.maxImageMb}
                min={1}
                max={20}
                suffix="MB"
                onChange={(v) => updateDraftMedia({ maxImageMb: v })}
              />
              <NumberField
                label="Tamaño máximo de audio original"
                value={draft.media.maxAudioMb}
                min={1}
                max={30}
                suffix="MB"
                onChange={(v) => updateDraftMedia({ maxAudioMb: v })}
              />
              <NumberField
                label="Tamaño máximo de video"
                value={draft.media.maxVideoMb}
                min={1}
                max={30}
                suffix="MB"
                onChange={(v) => updateDraftMedia({ maxVideoMb: v })}
              />
              <NumberField
                label="Límite real de subida por archivo"
                hint="Máximo 4.2 MB por el límite de body de Vercel."
                value={draft.media.maxUploadMb}
                min={0.5}
                max={4.2}
                step={0.1}
                suffix="MB"
                onChange={(v) => updateDraftMedia({ maxUploadMb: v })}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-acid" />
              <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                Compresión de audio (ahorro de espacio)
              </h3>
            </div>
            <p className="text-[11px] text-content-muted leading-relaxed">
              Todos los MP3 se recomprimen en el navegador a mono con lamejs antes de subirse.
              Un tema de 320 kbps puede bajar a 64 kbps ocupando ~5 veces menos.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <NumberField
                label="Bitrate MP3 final"
                hint="Recomendado: 64 kbps. Menos kbps = más ahorro."
                value={draft.media.audioBitrateKbps}
                min={32}
                max={128}
                suffix="kbps"
                onChange={(v) => updateDraftMedia({ audioBitrateKbps: v })}
              />
              <NumberField
                label="Duración máxima de audio"
                value={draft.media.audioMaxDurationSec}
                min={30}
                max={3600}
                step={30}
                suffix="seg"
                onChange={(v) => updateDraftMedia({ audioMaxDurationSec: v })}
              />
            </div>
            <ToggleRow
              title="Recomprimir audios automáticamente"
              description="Si está activo, los audios se convierten a MP3 liviano antes de subirse."
              checked={draft.media.audioCompressionEnabled}
              onChange={(v) => updateDraftMedia({ audioCompressionEnabled: v })}
            />
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-orange" />
              <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                Optimización de imágenes y cuota
              </h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <NumberField
                label="Lado máximo de imagen"
                value={draft.media.imageMaxDimension}
                min={480}
                max={2400}
                step={80}
                suffix="px"
                onChange={(v) => updateDraftMedia({ imageMaxDimension: v })}
              />
              <NumberField
                label="Calidad JPEG"
                value={Math.round(draft.media.imageQuality * 100)}
                min={40}
                max={95}
                suffix="%"
                onChange={(v) => updateDraftMedia({ imageQuality: v / 100 })}
              />
              <NumberField
                label="Cuota de almacenamiento"
                hint="Solo indicador visual del panel."
                value={draft.media.storageQuotaMb}
                min={100}
                max={10240}
                step={100}
                suffix="MB"
                onChange={(v) => updateDraftMedia({ storageQuotaMb: v })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── WALLETS ─────────────────────────────────────────────────────── */}
      {activeTab === 'wallets' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-acid" />
              <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                Wallets de la plataforma
              </h3>
            </div>
            <p className="text-[11px] text-content-muted leading-relaxed">
              Direcciones públicas usadas para donaciones y como respaldo cuando un artista no
              configuró su propia wallet. Nunca guardes claves privadas acá.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-content-secondary">Bitcoin (BTC)</span>
                <input
                  type="text"
                  value={draft.wallets.btc}
                  onChange={(e) => updateDraftWallet({ btc: e.target.value })}
                  placeholder="bc1..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono text-content-primary focus:border-acid focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-content-secondary">Ethereum (ETH)</span>
                <input
                  type="text"
                  value={draft.wallets.eth}
                  onChange={(e) => updateDraftWallet({ eth: e.target.value })}
                  placeholder="0x..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono text-content-primary focus:border-acid focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-content-secondary">Solana (SOL)</span>
                <input
                  type="text"
                  value={draft.wallets.sol}
                  onChange={(e) => updateDraftWallet({ sol: e.target.value })}
                  placeholder="Dirección Solana"
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono text-content-primary focus:border-acid focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-content-secondary">USDT</span>
                <input
                  type="text"
                  value={draft.wallets.usdt}
                  onChange={(e) => updateDraftWallet({ usdt: e.target.value })}
                  placeholder="0x... / dirección TRC20"
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono text-content-primary focus:border-acid focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-content-secondary">USDC</span>
                <input
                  type="text"
                  value={draft.wallets.usdc}
                  onChange={(e) => updateDraftWallet({ usdc: e.target.value })}
                  placeholder="0x... / dirección Solana"
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono text-content-primary focus:border-acid focus:outline-none"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-bold text-content-secondary flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Correo de contacto
                </span>
                <input
                  type="email"
                  value={draft.wallets.contactEmail}
                  onChange={(e) => updateDraftWallet({ contactEmail: e.target.value })}
                  placeholder="contacto@larvazhiphop.org"
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
                />
              </label>
            </div>
          </div>

          <ToggleRow
            title="Propinas cripto habilitadas"
            description="Muestra el botón de propina en las publicaciones y permite enviar tips."
            checked={draft.features.tipsEnabled}
            onChange={(v) => updateDraftFeature({ tipsEnabled: v })}
            icon={<Wallet className="w-4 h-4" />}
          />
        </div>
      )}

      {/* ── FUNCIONES ───────────────────────────────────────────────────── */}
      {activeTab === 'funciones' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <ToggleRow
              title="Comentarios"
              description="Permite comentar en las publicaciones. Si se apaga, el historial se conserva."
              checked={draft.features.commentsEnabled}
              onChange={(v) => updateDraftFeature({ commentsEnabled: v })}
              icon={<MessageSquare className="w-4 h-4" />}
            />
            <ToggleRow
              title="Subida de fotos y audios"
              description="Habilita el almacenamiento de archivos en Supabase Storage."
              checked={draft.features.uploadsEnabled}
              onChange={(v) => updateDraftFeature({ uploadsEnabled: v })}
              icon={<HardDrive className="w-4 h-4" />}
            />
            <ToggleRow
              title="Registro de nuevos usuarios"
              description="Permite crear cuentas nuevas desde /registro."
              checked={draft.features.registrationsEnabled}
              onChange={(v) => updateDraftFeature({ registrationsEnabled: v })}
              icon={<Users className="w-4 h-4" />}
            />
            <ToggleRow
              title="Programa de referidos"
              description="Cuenta referidos y otorga Props a quienes invitan artistas."
              checked={draft.features.referralsEnabled}
              onChange={(v) => updateDraftFeature({ referralsEnabled: v })}
              icon={<Users className="w-4 h-4" />}
            />
            <ToggleRow
              title="Propinas cripto"
              description="Muestra el botón de propina y las wallets públicas."
              checked={draft.features.tipsEnabled}
              onChange={(v) => updateDraftFeature({ tipsEnabled: v })}
              icon={<Wallet className="w-4 h-4" />}
            />
            <ToggleRow
              title="Radio comunitaria"
              description="Muestra el reproductor y las emisoras de la plataforma."
              checked={draft.features.radioEnabled}
              onChange={(v) => updateDraftFeature({ radioEnabled: v })}
              icon={<Radio className="w-4 h-4" />}
            />
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-2">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange" />
              <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                Anuncio global
              </h3>
            </div>
            <p className="text-[10px] text-content-muted">
              Se muestra como banner en la parte superior del muro. Dejalo vacío para ocultarlo.
            </p>
            <textarea
              value={draft.announcement}
              maxLength={240}
              rows={3}
              onChange={(e) => setDraft((prev) => ({ ...prev, announcement: e.target.value }))}
              placeholder="Ej: Este sábado hay cypher abierto en la plaza. Traé tus barras."
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none resize-none"
            />
            <p className="text-[10px] text-content-muted text-right">{draft.announcement.length}/240</p>
          </div>
        </div>
      )}

      {/* ── PRUEBAS (solo Super Admin) ──────────────────────────────────── */}
      {activeTab === 'pruebas' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-orange/10 border border-orange/30 flex items-start gap-3">
            <FlaskConical className="w-5 h-5 text-orange shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-black text-content-primary uppercase tracking-wider">
                Modo de pruebas de interacciones
              </h3>
              <p className="text-[11px] text-content-secondary leading-relaxed">
                Inyectá likes, comentarios, compartidos, guardados y vistas en una publicación.
                Poné 0 en lo que quieras saltear. Los comentarios se firman con perfiles anónimos
                técnicos, sin registro público.
              </p>
            </div>
          </div>

          {/* Publicación objetivo */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-acid" />
                <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                  Publicación objetivo
                </h3>
              </div>
              <button
                type="button"
                onClick={loadTestPosts}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-[11px] font-bold text-content-secondary hover:text-acid"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recargar
              </button>
            </div>

            <select
              value={testPostId}
              onChange={(e) => {
                setTestPostId(e.target.value);
                setTestResult(null);
                setTestMessage(null);
              }}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            >
              <option value="">Elegí una publicación…</option>
              {testPosts.map((post) => (
                <option key={post.id} value={post.id}>
                  {`@${post.profiles?.username || 'artista'} · ${String(post.description || '')
                    .replace(/\s+/g, ' ')
                    .slice(0, 70)}`}
                </option>
              ))}
            </select>

            {selectedTestPost && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                {[
                  { label: 'Likes', value: Number(selectedTestPost.likes_count || 0), icon: <Heart className="w-3.5 h-3.5" /> },
                  { label: 'Comentarios', value: Number(selectedTestPost.comments_count || 0), icon: <MessageSquare className="w-3.5 h-3.5" /> },
                  { label: 'Vistas', value: Number(rawMetadataOf(selectedTestPost).views_count || 0), icon: <Eye className="w-3.5 h-3.5" /> },
                  { label: 'Compartidos', value: Number(rawMetadataOf(selectedTestPost).shares_count || 0), icon: <Share2 className="w-3.5 h-3.5" /> },
                  { label: 'Guardados', value: Number(rawMetadataOf(selectedTestPost).bookmarks_count || 0), icon: <Bookmark className="w-3.5 h-3.5" /> },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-2 rounded-xl bg-surface-elevated border border-surface-border"
                  >
                    <div className="flex items-center justify-center gap-1 text-content-muted">
                      {item.icon}
                      <span className="text-[9px] font-bold uppercase tracking-wider">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-sm font-display font-black text-content-primary">
                      {item.value.toLocaleString('es-AR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cantidades */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-acid" />
              <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                Cantidad por reacción
              </h3>
            </div>
            <p className="text-[10px] text-content-muted">
              Cada reacción aplica solo si su cantidad es mayor a cero. Se suman a lo que ya
              tiene la publicación.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { key: 'likes' as const, label: 'Likes', icon: <Heart className="w-3.5 h-3.5 text-magenta" />, max: 5000 },
                { key: 'comments' as const, label: 'Comentarios', icon: <MessageSquare className="w-3.5 h-3.5 text-acid" />, max: 60 },
                { key: 'shares' as const, label: 'Compartidos', icon: <Share2 className="w-3.5 h-3.5 text-orange" />, max: 5000 },
                { key: 'saves' as const, label: 'Guardados', icon: <Bookmark className="w-3.5 h-3.5 text-cyan" />, max: 5000 },
                { key: 'views' as const, label: 'Vistas', icon: <Eye className="w-3.5 h-3.5 text-content-secondary" />, max: 100000 },
              ].map((field) => (
                <label key={field.key} className="block space-y-1">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-content-secondary">
                    {field.icon}
                    {field.label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={field.max}
                    step={1}
                    value={testCounts[field.key]}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const next = Number.isFinite(raw)
                        ? Math.max(0, Math.min(field.max, Math.floor(raw)))
                        : 0;
                      setTestCounts((prev) => ({ ...prev, [field.key]: next }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono text-content-primary focus:border-acid focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Tono y sugerencias */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-acid" />
                <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                  Tanda de comentarios sugerida
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTestPreviewSeed(randomSeed())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-[11px] font-bold text-content-secondary hover:text-acid"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Otra tanda
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEST_COMMENT_TONES.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => setTestTone(tone.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    testTone === tone.id
                      ? 'bg-acid/15 border-acid text-content-primary'
                      : 'bg-surface-elevated border-surface-border text-content-secondary hover:border-acid/50'
                  }`}
                >
                  <p className="text-[11px] font-black">{tone.label}</p>
                  <p className="text-[9px] text-content-muted">{tone.hint}</p>
                </button>
              ))}
            </div>

            <ul className="space-y-1.5">
              {testPreview.map((comment, index) => (
                <li
                  key={`${testPreviewSeed}-${index}`}
                  className="p-2.5 rounded-xl bg-surface-elevated border border-surface-border text-[11px] text-content-secondary space-y-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black text-content-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-acid/15 text-acid border border-acid/30 text-[9px] font-black uppercase tracking-wider">
                      {comment.persona_label}
                    </span>
                    <span className="text-[9px] text-content-muted">@{comment.username}</span>
                  </div>
                  <p className="leading-relaxed">{comment.text}</p>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-content-muted">
              Cada bot comenta con su propia voz: callejero, vieja escuela, bardero, buena onda
              y oyente coloquial. Al aplicar se genera una tanda nueva con el mismo tono.
            </p>
          </div>

          {testMessage && (
            <div
              className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                testMessage.type === 'ok'
                  ? 'bg-acid/10 border-acid/30 text-acid'
                  : 'bg-magenta/10 border-magenta/30 text-magenta'
              }`}
            >
              {testMessage.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {testMessage.text}
            </div>
          )}

          <button
            type="button"
            onClick={handleTestReactions}
            disabled={testBusy || !testPostId}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-acid text-background font-display font-black text-xs uppercase tracking-wider shadow-acid-glow hover:bg-acid-hover disabled:opacity-50 transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            {testBusy ? 'Aplicando prueba…' : 'Aplicar prueba de reacciones'}
          </button>

          {testResult && (
            <div className="p-4 rounded-2xl bg-surface border border-acid/30 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-acid" />
                <h3 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                  Resultado aplicado
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                {[
                  { label: 'Likes', value: testResult.counters.likes_count, icon: <Heart className="w-3.5 h-3.5" /> },
                  { label: 'Comentarios', value: testResult.counters.comments_count, icon: <MessageSquare className="w-3.5 h-3.5" /> },
                  { label: 'Vistas', value: testResult.counters.views_count, icon: <Eye className="w-3.5 h-3.5" /> },
                  { label: 'Compartidos', value: testResult.counters.shares_count, icon: <Share2 className="w-3.5 h-3.5" /> },
                  { label: 'Guardados', value: testResult.counters.bookmarks_count, icon: <Bookmark className="w-3.5 h-3.5" /> },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-2 rounded-xl bg-surface-elevated border border-surface-border"
                  >
                    <div className="flex items-center justify-center gap-1 text-content-muted">
                      {item.icon}
                      <span className="text-[9px] font-bold uppercase tracking-wider">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-sm font-display font-black text-acid">
                      {item.value.toLocaleString('es-AR')}
                    </p>
                  </div>
                ))}
              </div>

              {testResult.comments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
                    Comentarios anónimos insertados ({testResult.comments.length})
                  </p>
                  {testResult.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-2.5 rounded-xl bg-surface-elevated border border-surface-border text-[11px] text-content-secondary space-y-1"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-content-primary">
                          {comment.author_name}
                        </span>
                        <span className="text-content-muted">@{comment.username}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-acid/15 text-acid border border-acid/30 text-[9px] font-black uppercase tracking-wider">
                          {comment.persona_label}
                        </span>
                      </div>
                      <p className="leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
