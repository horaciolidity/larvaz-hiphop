'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Settings, Camera, Globe, Music, MapPin, Save, Check, Loader2, Smile } from 'lucide-react';
import { UserAvatar } from '@/components/common/UserAvatar';
import AvatarPicker from '@/components/profile/AvatarPicker';
import { resolveIpfsUrl } from '@/lib/media-utils';


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
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (currentUser.avatar_url && currentUser.avatar_url !== avatarUrl) {
      setAvatarUrl(currentUser.avatar_url);
    }
  }, [currentUser.avatar_url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const finalAvatar = avatarUrl ? (resolveIpfsUrl(avatarUrl) || avatarUrl) : avatarUrl;
    const finalBanner = bannerUrl ? (resolveIpfsUrl(bannerUrl) || bannerUrl) : bannerUrl;

    setTimeout(() => {
      updateProfile({
        full_name: fullName,
        bio,
        location,
        website,
        portfolio_url: portfolioUrl,
        artistic_disciplines: artisticDisciplines,
        avatar_url: finalAvatar,
        banner_url: finalBanner,
      });
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, 300);
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
        {/* Vista Previa del Perfil Cultural */}
        <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-2xl">
          {/* Banner */}
          <div className="relative h-32 w-full bg-gradient-to-r from-surface-elevated via-surface to-background overflow-hidden border-b border-surface-border">
            {bannerUrl ? (
              <img src={resolveIpfsUrl(bannerUrl) || bannerUrl} alt="Portada" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-30 text-content-secondary font-display font-black tracking-widest text-xs">
                PORTADA DE PERFIL (OPCIONAL)
              </div>
            )}
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-content-secondary font-mono">
              Vista previa
            </span>
          </div>

          {/* Profile Details & Avatar Bar */}
          <div className="p-4 sm:p-5 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                onClick={() => setShowAvatarPicker(true)}
                className="cursor-pointer group relative flex-shrink-0"
                title="Cambiar avatar o sticker"
              >
                <UserAvatar
                  avatarUrl={avatarUrl}
                  name={fullName}
                  size="xl"
                  className="border-4 border-surface shadow-2xl group-hover:border-acid transition-all duration-300 transform group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>CAMBIAR</span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-lg text-content-primary truncate">
                    {fullName || 'Tu Nombre'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-acid/20 text-acid text-[10px] font-black uppercase tracking-wider border border-acid/30">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-content-secondary font-mono mt-0.5">
                  @{currentUser.username}
                </p>
                {artisticDisciplines && (
                  <p className="text-[11px] text-content-muted truncate mt-0.5">
                    🎤 {artisticDisciplines}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-acid/50 text-acid font-black text-xs hover:bg-acid hover:text-background flex items-center justify-center gap-2 transition-all shadow-acid-sm flex-shrink-0"
            >
              <Smile className="w-4 h-4" />
              <span>Elegir Sticker o Avatar</span>
            </button>
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
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              onBlur={() => {
                if (avatarUrl.trim()) {
                  const resolved = resolveIpfsUrl(avatarUrl.trim()) || avatarUrl.trim();
                  setAvatarUrl(resolved);
                  updateProfile({ avatar_url: resolved });
                }
              }}
              placeholder="https://... · ipfs://Qm... · CID de IPFS"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            />
            <p className="text-[10px] text-content-muted mt-1">Acepta URLs normales (https://), enlaces IPFS (ipfs://...) o CIDs directos.</p>
          </div>

          {/* Banner URL */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              <Camera className="w-3.5 h-3.5 text-acid" />
              URL de Portada (banner del perfil)
            </label>
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://... · ipfs://Qm... · CID de IPFS"
              className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary focus:border-acid focus:outline-none"
            />
            <p className="text-[11px] text-content-muted mt-1">
              Acepta URLs normales (https://), enlaces IPFS (ipfs://...) o CIDs. Los cambios se guardan inmediatamente al presionar Guardar.
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

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatar={avatarUrl}
          onSelect={(url) => {
            const resolved = resolveIpfsUrl(url) || url;
            setAvatarUrl(resolved);
            updateProfile({ avatar_url: resolved });
            setShowAvatarPicker(false);
          }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}
