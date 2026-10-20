'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { dataStore } from '@/lib/data-store';
import { PostCard } from '@/components/feed/PostCard';
import {
  User,
  Coins,
  Settings,
  PlusCircle,
  Calendar,
  Heart,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  Save,
  Radio,
  ExternalLink,
} from 'lucide-react';

export default function UserPanelPage() {
  const { currentUser, updateProfile, posts, events, availableProfiles, setCurrentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'resumen' | 'cripto' | 'publicaciones' | 'eventos'>('resumen');

  // Wallet form state
  const [solWallet, setSolWallet] = useState(currentUser.wallet_addresses?.sol || '');
  const [usdtWallet, setUsdtWallet] = useState(currentUser.wallet_addresses?.usdt || '');
  const [btcWallet, setBtcWallet] = useState(currentUser.wallet_addresses?.btc || '');
  const [ethWallet, setEthWallet] = useState(currentUser.wallet_addresses?.eth || '');
  const [walletsSaved, setWalletsSaved] = useState(false);

  const userPosts = posts.filter((p) => p.user_id === currentUser.id);
  const userEvents = events.filter((e) => e.organizer_id === currentUser.id);
  const userTips = dataStore.getUserTips(currentUser.id);

  const totalLikesReceived = userPosts.reduce((acc, p) => acc + p.likes_count, 0);
  const totalTipsUsdReceived = userTips.received.reduce((acc, t) => acc + t.amount_usd, 0);

  const handleSaveWallets = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      wallet_addresses: {
        sol: solWallet.trim() || undefined,
        usdt: usdtWallet.trim() || undefined,
        btc: btcWallet.trim() || undefined,
        eth: ethWallet.trim() || undefined,
      },
    });
    setWalletsSaved(true);
    setTimeout(() => setWalletsSaved(false), 2500);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* 1. Profile Header Card */}
      <div className="relative p-5 rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(198,255,0,0.1),transparent_70%)] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={currentUser.username}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-acid/50 shadow-lg"
              />
              {currentUser.verified_artist && (
                <span className="absolute -bottom-1 -right-1 bg-acid text-background p-1 rounded-full shadow-md" title="Artista Verificado">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
                  {currentUser.full_name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-surface-elevated text-[10px] font-bold text-acid uppercase border border-surface-border">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-acid font-bold">@{currentUser.username}</p>
              <p className="text-xs text-content-secondary mt-0.5 line-clamp-1">
                {currentUser.artistic_disciplines || 'Cultura Urbana & Hip-Hop'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/configuracion"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-xs font-bold text-content-primary transition-colors"
            >
              <Settings className="w-4 h-4 text-content-muted" />
              <span>Editar Perfil</span>
            </Link>
            <Link
              href={`/artista/${currentUser.username}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-acid text-background font-bold text-xs shadow-acid-glow hover:bg-acid-hover transition-colors"
            >
              <span>Ver Público</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            </Link>
          </div>
        </div>

        {/* User Switcher Quick Bar */}
        <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-content-secondary">
          <span className="font-bold text-content-muted">Probar como otro usuario:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {availableProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => setCurrentUser(p)}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  p.id === currentUser.id
                    ? 'bg-acid text-background'
                    : 'bg-surface-elevated hover:text-content-primary border border-surface-border'
                }`}
              >
                @{p.username}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-surface border border-surface-border text-center">
          <p className="font-display font-black text-2xl text-acid">{userPosts.length}</p>
          <p className="text-[11px] font-bold text-content-secondary uppercase mt-0.5">Publicaciones</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-surface border border-surface-border text-center">
          <p className="font-display font-black text-2xl text-magenta">{totalLikesReceived}</p>
          <p className="text-[11px] font-bold text-content-secondary uppercase mt-0.5">Me Gusta</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-surface border border-surface-border text-center">
          <p className="font-display font-black text-2xl text-cyan">${totalTipsUsdReceived}</p>
          <p className="text-[11px] font-bold text-content-secondary uppercase mt-0.5">Cripto Tips</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-surface border border-surface-border text-center">
          <p className="font-display font-black text-2xl text-orange">{currentUser.followers_count || 0}</p>
          <p className="text-[11px] font-bold text-content-secondary uppercase mt-0.5">Seguidores</p>
        </div>
      </div>

      {/* 3. Panel Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-surface-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'resumen'
              ? 'bg-acid text-background shadow-acid-glow font-black'
              : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('cripto')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'cripto'
              ? 'bg-acid text-background shadow-acid-glow font-black'
              : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Billetera Cripto ({userTips.received.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('publicaciones')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'publicaciones'
              ? 'bg-acid text-background shadow-acid-glow font-black'
              : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
          }`}
        >
          Mis Posts ({userPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('eventos')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'eventos'
              ? 'bg-acid text-background shadow-acid-glow font-black'
              : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
          }`}
        >
          Eventos ({userEvents.length})
        </button>
      </div>

      {/* 4. Tab: Resumen */}
      {activeTab === 'resumen' && (
        <div className="space-y-4">
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/crear"
              className="p-4 rounded-2xl bg-surface border border-acid/30 hover:border-acid transition-all group flex flex-col justify-between"
            >
              <div className="w-9 h-9 rounded-xl bg-acid/20 text-acid flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="mt-3">
                <p className="font-display font-black text-lg text-content-primary">NUEVO POST</p>
                <p className="text-xs text-content-secondary">Comparte video, música o arte</p>
              </div>
            </Link>

            <Link
              href="/eventos"
              className="p-4 rounded-2xl bg-surface border border-surface-border hover:border-cyan/50 transition-all group flex flex-col justify-between"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan/20 text-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="mt-3">
                <p className="font-display font-black text-lg text-content-primary">AGENDA CULTURAL</p>
                <p className="text-xs text-content-secondary">Crear o ver eventos hip-hop</p>
              </div>
            </Link>
          </div>

          {/* Bio Preview */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-2">
            <h3 className="font-display font-black text-sm text-content-primary uppercase tracking-wider">
              Tu Biografía en el Muro
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              {currentUser.bio || 'Sin biografía cultural todavía. Haz clic en "Editar Perfil" para agregar tus influencias, crew y trayectoria.'}
            </p>
          </div>
        </div>
      )}

      {/* 5. Tab: Cripto & Monetización */}
      {activeTab === 'cripto' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-acid/10 border border-acid/30 space-y-1.5">
            <h3 className="font-display font-black text-base text-acid tracking-wide flex items-center gap-2">
              <Coins className="w-4 h-4" />
              CONFIGURAR BILLETERAS DE MONETIZACIÓN
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Agrega tus direcciones públicas de criptomonedas. Los seguidores podrán enviarte propinas directas (micro-mecenazgo) a tus publicaciones sin comisión de intermediarios.
            </p>
          </div>

          {/* Wallet Address Edit Form */}
          <form onSubmit={handleSaveWallets} className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Dirección SOL (Solana — Comisiones bajas)
              </label>
              <input
                type="text"
                value={solWallet}
                onChange={(e) => setSolWallet(e.target.value)}
                placeholder="Ej: 7nY2kroNosSolanaGraffitiCrewAddress..."
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border font-mono text-xs text-content-primary focus:border-acid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Dirección USDT (Polygon / EVM)
              </label>
              <input
                type="text"
                value={usdtWallet}
                onChange={(e) => setUsdtWallet(e.target.value)}
                placeholder="Ej: 0x32A489F2f1eC855B68A78351B2DbA2718E70441E"
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border font-mono text-xs text-content-primary focus:border-acid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Dirección Bitcoin (BTC)
              </label>
              <input
                type="text"
                value={btcWallet}
                onChange={(e) => setBtcWallet(e.target.value)}
                placeholder="Ej: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border font-mono text-xs text-content-primary focus:border-acid focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Dirección Ethereum (ETH)
              </label>
              <input
                type="text"
                value={ethWallet}
                onChange={(e) => setEthWallet(e.target.value)}
                placeholder="Ej: 0x88C45a279B6C3F2d6d1d4f997C2245b1E1719B5E"
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border font-mono text-xs text-content-primary focus:border-acid focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-acid hover:bg-acid-hover text-background font-display font-black text-sm tracking-wider uppercase shadow-acid-glow flex items-center justify-center gap-2 transition-all"
            >
              {walletsSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Billeteras Guardadas con Éxito!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Direcciones Cripto</span>
                </>
              )}
            </button>
          </form>

          {/* Tips Received List */}
          <div className="space-y-3">
            <h3 className="font-display font-black text-sm text-content-primary uppercase tracking-wider">
              Historial de Propinas Recibidas ({userTips.received.length})
            </h3>

            {userTips.received.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-surface border border-surface-border text-xs text-content-secondary">
                Aún no has recibido propinas en tus publicaciones. ¡Publica tu arte para que la comunidad te apoye!
              </div>
            ) : (
              <div className="space-y-2">
                {userTips.received.map((tip) => (
                  <div
                    key={tip.id}
                    className="p-3.5 rounded-xl bg-surface border border-surface-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-content-primary">
                          De @{tip.sender_username || 'anónimo'}
                        </span>
                        <span className="text-[10px] text-content-muted">
                          · {new Date(tip.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {tip.message && (
                        <p className="text-content-secondary mt-1 italic font-serif">
                          "{tip.message}"
                        </p>
                      )}
                      <p className="text-[10px] text-content-muted font-mono mt-1 truncate max-w-xs">
                        TX: {tip.tx_hash}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-acid text-sm">
                        +{tip.crypto_amount} {tip.currency}
                      </p>
                      <p className="text-[10px] text-content-muted">
                        ${tip.amount_usd} USD
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Tab: Mis Publicaciones */}
      {activeTab === 'publicaciones' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface border border-surface-border text-xs text-content-secondary space-y-3">
              <p>No tienes publicaciones en el muro comunitario aún.</p>
              <Link
                href="/crear"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-acid text-background font-bold text-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publicar mi primera obra</span>
              </Link>
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      )}

      {/* 7. Tab: Mis Eventos */}
      {activeTab === 'eventos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-sm text-content-primary uppercase tracking-wider">
              Eventos que Organizas
            </h3>
            <Link
              href="/eventos"
              className="text-xs text-acid font-bold hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Crear evento</span>
            </Link>
          </div>

          {userEvents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface border border-surface-border text-xs text-content-secondary">
              No tienes eventos organizados. Crea una batalla, jam, expo de graffiti o sesión de beatmaking.
            </div>
          ) : (
            <div className="space-y-3">
              {userEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl bg-surface border border-surface-border flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-sm text-content-primary">{ev.title}</h4>
                    <p className="text-xs text-content-secondary mt-0.5">{ev.location}</p>
                    <p className="text-[11px] text-acid mt-1">
                      {new Date(ev.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/eventos/${ev.slug}`}
                    className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-xs font-bold text-content-primary border border-surface-border"
                  >
                    Ver detalle
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
