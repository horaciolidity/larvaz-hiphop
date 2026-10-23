'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/common/Logo';
import { Lock, Mail, User, AtSign, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

export default function RegistroPage() {
  const router = useRouter();
  const { register } = useApp();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await register({
        email,
        password,
        fullName,
        username,
      });

      if (res.success) {
        setSuccess(true);
        if (res.message) setMessage(res.message);
        setTimeout(() => {
          router.push('/panel');
        }, 800);
      } else {
        setError(res.error || 'No se pudo crear la cuenta.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al conectar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-8 relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(198,255,0,0.06),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(0,217,255,0.05),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center">
          <Logo size="lg" showTagline className="justify-center" />
        </div>

        <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-2xl space-y-5">
          <div>
            <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
              UNIRTE A LARVAZ
            </h1>
            <p className="text-xs text-content-secondary mt-1">
              Crea tu perfil como artista, colectivo o seguidor de la cultura hip-hop.
            </p>
          </div>

          {success && (
            <div className="p-4 rounded-2xl bg-acid/10 border border-acid/50 flex items-center gap-3 text-acid animate-fade-in">
              <Check className="w-5 h-5 stroke-[3]" />
              <div>
                <p className="font-bold text-xs">¡Cuenta creada con éxito!</p>
                <p className="text-[11px] text-content-secondary">
                  {message || 'Configurando tu panel de artista...'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-magenta/10 border border-magenta/30 text-xs text-magenta">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Nombre Público o Artístico *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre artístico o alias"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Nombre de Usuario Único (@) *
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="tu_usuario"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-content-secondary uppercase tracking-wider mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 rounded-xl bg-acid hover:bg-acid-hover text-background font-display font-black text-base tracking-wider uppercase shadow-acid-glow transition-all disabled:opacity-60"
            >
              {isLoading ? 'Creando perfil cultural...' : 'Crear Cuenta y Entrar'}
            </button>
          </form>

          <div className="text-center text-xs text-content-secondary pt-2 border-t border-surface-border/50">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-acid font-bold hover:underline">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
