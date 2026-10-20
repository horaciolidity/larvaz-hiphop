'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, Camera, Globe, Music, MapPin, Save, Check, Loader2 } from 'lucide-react';

export default function ConfiguracionPage() {
  const { currentUser, updateProfile } = useApp();

  const [fullName, setFullName] = useState(currentUser.full_name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [portfolioUrl, setPortfolioUrl] = useState(currentUser.portfolio_url || '');
  const [artisticDisciplines, setArtisticDisciplines] = useState(currentUser.artistic_disciplines || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser.banner_url || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      updateProfile({
        full_name: fullName,
        bio,
        location,
        website,
        portfolio_url: portfolioUrl,
        artistic_disciplines: artisticDisciplines,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      });
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 500);
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-surface-border pb-4">
        <Settings className="w-5 h-5 text-acid" />
        <div>
          <h1 className="font-display font-black text-2xl text-content-primary tracking-wide">
            CONFIGURAR PERFIL
          </h1>
          <p className="text-xs text-content-secondary mt-0.5">
            @{currentUser.username} · Solo tú puedes editar tu propio perfil.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar & Banner Preview */}
        <div className="relative h-32 rounded-2xl overflow-hidden border border-surface-border bg-surface-elevated">
          {bannerUrl && (
            <img src={bannerUrl} alt="Portada" className="w-full h-full object-cover opacity-70" />
          )}
          <div className="absolute left-4 bottom-0 translate-y-1/2">
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt="Avatar"
              className="w-16 h-16 rounded-xl object-cover border-4 border-background shadow-lg"
            />
          </div>
        </div>

        <div className="pt-8 space-y-4">
          {/* Avatar URL */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              <Camera className="w-3.5 h-3.5 text-acid" />
              URL de Avatar (imagen de perfil)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            />
          </div>

          {/* Banner URL */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              <Camera className="w-3.5 h-3.5 text-acid" />
              URL de Portada (banner del perfil)
            </label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            />
            <p className="text-[11px] text-content-muted mt-1">
              Cuando Supabase Storage esté configurado, podrás subir tus propias imágenes directamente.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              Nombre Público *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nombre artístico o nombre del colectivo"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              Biografía & Descripción Cultural
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale a la comunidad quién eres, qué creas y desde dónde vienes..."
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Disciplines */}
          <div>
            <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              Actividades Artísticas (MC, DJ, Breaking, Graffiti, Beatmaking...)
            </label>
            <input
              type="text"
              value={artisticDisciplines}
              onChange={(e) => setArtisticDisciplines(e.target.value)}
              placeholder="Ej: MC, Freestyle, Rap Consciente"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            />
            <p className="text-[11px] text-content-muted mt-1">
              Puedes describir libremente. No estás obligado a elegir ningún elemento específico.
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              <MapPin className="w-3.5 h-3.5 text-orange" />
              Ciudad / Región (opcional)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Buenos Aires, Argentina"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              <Globe className="w-3.5 h-3.5 text-cyan" />
              Sitio web / Redes sociales (opcional)
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://instagram.com/tu_usuario"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            />
          </div>

          {/* Portfolio */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              <Music className="w-3.5 h-3.5 text-magenta" />
              Enlace de Música / Portafolio (opcional)
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://soundcloud.com/tu_perfil o Spotify"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            />
          </div>
        </div>

        {/* Read-only Username notice */}
        <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border text-xs text-content-secondary">
          <span className="font-bold text-content-primary">@{currentUser.username}</span> es tu identificador único. No puede modificarse en esta versión para preservar la consistencia de los enlaces de perfil.
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-xl bg-acid hover:bg-acid-hover text-background font-display font-black text-lg tracking-wider uppercase shadow-acid-glow flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              <span>¡Perfil Actualizado!</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
