'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { dataStore } from '@/lib/data-store';
import { PostCard } from '@/components/feed/PostCard';
import AvatarPicker, { EmojiAvatarDisplay, isEmojiAvatar } from '@/components/profile/AvatarPicker';
import { UserAvatar } from '@/components/common/UserAvatar';
import { resolveIpfsUrl } from '@/lib/media-utils';
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
  AlertCircle,
  Wallet,
  ArrowDownToLine,
  Gift,
  Share2,
  Camera,
} from 'lucide-react';

export default function UserPanelPage() {
  const {
    currentUser,
    updateProfile,
    posts,
    events,
    balance,
    withdrawals,
    requestWithdrawal,
    getReferredUsers,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'resumen' | 'cripto' | 'referidos' | 'publicaciones' | 'eventos'>('resumen');
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const referredUsers = getReferredUsers();
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/registro?ref=${currentUser.username}` : '';

  // Wallet form state
  const [solWallet, setSolWallet] = useState(currentUser.wallet_addresses?.sol || '');
  const [usdtWallet, setUsdtWallet] = useState(currentUser.wallet_addresses?.usdt || '');
  const [btcWallet, setBtcWallet] = useState(currentUser.wallet_addresses?.btc || '');
  const [ethWallet, setEthWallet] = useState(currentUser.wallet_addresses?.eth || '');
  const [walletsSaved, setWalletsSaved] = useState(false);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawNetwork, setWithdrawNetwork] = useState<'Solana' | 'Polygon' | 'Ethereum'>('Solana');
  const [withdrawResult, setWithdrawResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

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

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawing(true);
    setWithdrawResult(null);
    const amount = parseFloat(withdrawAmount);
    const res = requestWithdrawal({
      amountUsdc: amount,
      walletAddress: withdrawAddress,
      network: withdrawNetwork,
    });
    setIsWithdrawing(false);
    if (res.success) {
      setWithdrawResult({ success: true, message: `✅ Retiro de ${amount} USDC solicitado. TX: ${res.withdrawal?.tx_hash}` });
      setWithdrawAmount('');
      setWithdrawAddress('');
    } else {
      setWithdrawResult({ success: false, message: res.error || 'Error al procesar el retiro.' });
    }
  };

  const handleAvatarSelect = (url: string) => {
    updateProfile({ avatar_url: url });
    setShowAvatarPicker(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* 1. Profile Header Card */}
      <div className="relative p-5 rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(198,255,0,0.1),transparent_70%)] pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {/* Avatar display */}
              <div
                className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-acid/50 shadow-lg cursor-pointer hover:border-acid transition-colors flex items-center justify-center bg-surface-elevated"
                onClick={() => setShowAvatarPicker(true)}
                title="Cambiar avatar"
              >
                <UserAvatar
                  avatarUrl={currentUser.avatar_url}
                  name={currentUser.full_name}
                  size="xl"
                  className="!rounded-2xl"
                />
              </div>
              {/* Camera overlay on hover */}
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Cambiar avatar"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
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
          onClick={() => setActiveTab('referidos')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'referidos'
              ? 'bg-acid text-background shadow-acid-glow font-black'
              : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Referidos ({currentUser.referrals_count || referredUsers.length})</span>
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

          {/* Referral Link & Props Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-acid/10 via-surface to-surface border border-acid/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-acid font-display font-black text-sm uppercase tracking-wide">
                <Gift className="w-4 h-4" />
                <span>TU ENLACE DE REFERIDO ÚNICO</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-acid/20 text-acid font-bold text-[10px]">
                +50 Props por amigo
              </span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Comparte tu link personal. Cada persona que ingrese y se registre con tu enlace sumará props a tu cuenta y se integrará a tu red comunitaria.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border font-mono text-xs text-content-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(referralLink);
                  setCopiedReferral(true);
                  setTimeout(() => setCopiedReferral(false), 2000);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                  copiedReferral
                    ? 'bg-acid text-background shadow-acid-glow'
                    : 'bg-surface hover:bg-surface-elevated text-content-primary border border-surface-border hover:border-acid'
                }`}
              >
                {copiedReferral ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-acid" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-surface-border/40 text-[11px] text-content-secondary">
              <span>Referidos activos: <strong className="text-content-primary">{currentUser.referrals_count || referredUsers.length}</strong></span>
              <span>Props obtenidos: <strong className="text-acid">+{currentUser.referral_props_earned || (referredUsers.length * 50)}</strong></span>
            </div>
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

          {/* Balance & Withdrawal Section */}
          <div className="space-y-4">
            {/* Balance Card */}
            <div className="p-4 rounded-2xl bg-surface border border-surface-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-acid/10">
                  <Wallet className="w-5 h-5 text-acid" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-content-secondary uppercase tracking-wider">
                    Saldo Disponible
                  </p>
                  <p className="font-display font-black text-2xl text-acid">
                    {balance.toFixed(2)} <span className="text-sm font-bold">USDC</span>
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-content-muted leading-relaxed">
                <p>Retiro mínimo:</p>
                <p className="font-bold text-content-secondary">10 USDC</p>
              </div>
            </div>

            {/* Withdrawal Form */}
            <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
              <h3 className="font-display font-black text-sm text-content-primary uppercase tracking-wider flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-acid" />
                Solicitar Retiro
              </h3>
              <p className="text-[11px] text-content-secondary leading-relaxed">
                Retirá las propinas recibidas directamente a tu billetera cripto. Disponible a partir de <span className="font-bold text-acid">10 USDC</span>. Sin comisiones de la plataforma.
              </p>

              {withdrawResult && (
                <div className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${withdrawResult.success ? 'bg-acid/10 border-acid/40 text-acid' : 'bg-magenta/10 border-magenta/30 text-magenta'}`}>
                  {withdrawResult.success
                    ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5 stroke-[3]" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <p className="font-mono break-all">{withdrawResult.message}</p>
                </div>
              )}

              <form onSubmit={handleWithdraw} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                    Monto (USDC)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="0.01"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Ej: 10.00"
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border font-mono text-xs text-content-primary focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                    Red de Destino
                  </label>
                  <select
                    value={withdrawNetwork}
                    onChange={(e) => setWithdrawNetwork(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
                  >
                    <option value="Solana">Solana (SOL) — Comisiones mínimas</option>
                    <option value="Polygon">Polygon (USDT/USDC EVM)</option>
                    <option value="Ethereum">Ethereum (ETH Mainnet)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                    Dirección de Billetera Destino
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder={withdrawNetwork === 'Solana' ? 'Ej: 7nY2kro...' : 'Ej: 0x32A4...'}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border font-mono text-xs text-content-primary focus:border-acid focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isWithdrawing || balance < 10}
                  className="w-full py-2.5 rounded-xl bg-acid hover:bg-acid-hover disabled:opacity-40 text-background font-display font-black text-sm tracking-wider uppercase shadow-acid-glow flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  {isWithdrawing ? 'Procesando...' : balance < 10 ? `Saldo insuficiente (mín. 10 USDC)` : 'Solicitar Retiro'}
                </button>
              </form>
            </div>

            {/* Withdrawal History */}
            {withdrawals.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display font-black text-sm text-content-primary uppercase tracking-wider">
                  Historial de Retiros ({withdrawals.length})
                </h3>
                {withdrawals.map((w) => (
                  <div key={w.id} className="p-3 rounded-xl bg-surface border border-surface-border flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${w.status === 'completed' ? 'bg-acid/20 text-acid' : w.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-magenta/20 text-magenta'}`}>
                          {w.status}
                        </span>
                        <span className="text-content-muted">·</span>
                        <span className="text-content-secondary">{w.network}</span>
                      </div>
                      <p className="font-mono text-[10px] text-content-muted mt-1 truncate max-w-[200px]">
                        → {w.wallet_address}
                      </p>
                      {w.tx_hash && (
                        <p className="font-mono text-[10px] text-content-muted truncate max-w-[200px]">
                          TX: {w.tx_hash}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-acid text-sm">-{w.amount_usdc} USDC</p>
                      <p className="text-[10px] text-content-muted">{new Date(w.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Sistema de Referidos */}
      {activeTab === 'referidos' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-acid/15 via-surface to-surface border border-acid/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-base text-acid tracking-wide flex items-center gap-2">
                <Gift className="w-5 h-5" />
                SISTEMA DE REFERIDOS Y CRECIMIENTO COMUNITARIO
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-acid/20 text-acid font-bold text-xs border border-acid/30">
                +50 Props por Amigo
              </span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Expande la cultura hip-hop subterránea. Cada vez que alguien entra con tu enlace y se registra en Larvaz, se suma automáticamente a tu red de comunidad y ambos reciben recompensas de reputación.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 px-3 py-2.5 rounded-xl bg-surface-elevated border border-surface-border font-mono text-xs text-content-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(referralLink);
                  setCopiedReferral(true);
                  setTimeout(() => setCopiedReferral(false), 2000);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-acid hover:bg-acid-hover text-background shadow-acid-glow transition-all"
              >
                {copiedReferral ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡Enlace Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Referred Members List */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-border space-y-3">
            <h4 className="font-display font-black text-sm text-content-primary uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-cyan" />
              <span>Miembros Registrados con tu Enlace ({referredUsers.length})</span>
            </h4>

            {referredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-content-secondary space-y-2">
                <p>Aún no tienes miembros vinculados con tu código de referido.</p>
                <p className="text-[11px] text-content-muted">
                  ¡Copia tu enlace arriba y compártelo con tus amigos, crew o en tus redes sociales para sumar props!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {referredUsers.map((u) => (
                  <div key={u.id} className="py-2.5 flex items-center justify-between">
                    <Link href={`/artista/${u.username}`} className="flex items-center gap-2.5 group">
                      <img
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={u.username}
                        className="w-8 h-8 rounded-full object-cover border border-surface-elevated group-hover:border-acid"
                      />
                      <div>
                        <p className="text-xs font-bold text-content-primary group-hover:text-acid truncate">{u.full_name}</p>
                        <p className="text-[10px] text-content-secondary truncate">@{u.username}</p>
                      </div>
                    </Link>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-acid/10 text-acid font-bold border border-acid/30">
                      +50 Props Comunitarios
                    </span>
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

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatar={currentUser.avatar_url}
          onSelect={(url) => handleAvatarSelect(url)}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}
