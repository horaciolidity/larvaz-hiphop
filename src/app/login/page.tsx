'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/common/Logo';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { availableProfiles, setCurrentUser, isSupabaseConnected, login } = useApp();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleQuickLogin = (profile: any) => {
    setCurrentUser(profile);
    setSuccess(true);
    setTimeout(() => {
      router.push('/panel');
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await login(usernameOrEmail, password);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/panel');
        }, 500);
      } else {
        setError(res.error || 'No se pudo iniciar sesión. Verifica los datos ingresados.');
      }
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error al conectar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-8 relative">
      {/* Background glow texture */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(198,255,0,0.06),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(255,45,149,0.05),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Logo size="lg" showTagline className="justify-center" />
        </div>

        {/* Main Card */}
        <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-2xl space-y-5">
          <div className="text-center sm:text-left">
            <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
              ENTRAR AL MURO
            </h1>
            <p className="text-xs text-content-secondary mt-1">
              Accede a tu cuenta comunitaria para publicar, dar props y sintonizar la radio.
            </p>
          </div>

          {success && (
            <div className="p-4 rounded-2xl bg-acid/10 border border-acid/50 flex items-center gap-3 text-acid animate-fade-in">
              <Check className="w-5 h-5 stroke-[3]" />
              <div>
                <p className="font-bold text-xs">¡Inicio de sesión exitoso!</p>
                <p className="text-[11px] text-content-secondary">Entrando a tu panel cultural...</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Usuario o Correo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="ej: kronos_graff o tu@correo.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-magenta/10 border border-magenta/30 text-xs text-magenta">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 rounded-xl bg-acid hover:bg-acid-hover text-background font-display font-black text-base tracking-wider uppercase shadow-acid-glow transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Verificando credenciales...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Quick 1-Click Login Selector */}
          <div className="pt-2 border-t border-surface-border">
            <p className="text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-2 text-center">
              O entra directamente con 1 clic:
            </p>
            <div className="space-y-1.5">
              {availableProfiles.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickLogin(p)}
                  className="w-full p-2.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border hover:border-acid/40 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={p.username}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div className="text-left">
                      <p className="font-bold text-content-primary">{p.full_name}</p>
                      <p className="text-[10px] text-content-muted">@{p.username} · {p.role}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-acid" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-content-secondary pt-2 border-t border-surface-border/50">
            <Link href="/registro" className="text-acid font-bold hover:underline">
              Crear cuenta nueva
            </Link>
            <Link href="/" className="hover:text-content-primary transition-colors">
              Volver al muro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
