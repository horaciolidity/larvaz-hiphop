'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MapPinned,
  Save,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatDisciplines } from '@/lib/disciplines';

const MODALITIES = [
  { id: 'economico', label: 'Económico', hint: 'Pago por proyecto o caché' },
  { id: 'productos', label: 'Productos', hint: 'Indumentaria, equipos, materiales' },
  { id: 'logistico', label: 'Logístico', hint: 'Viajes, transporte, espacio' },
  { id: 'mixto', label: 'Mixto', hint: 'Combinación de aportes' },
  { id: 'cripto', label: 'Cripto', hint: 'Pagos en USDT / SOL / ETH' },
];

/**
 * Formulario de perfil de patrocinio.
 * Vive dentro de /configuracion y persiste en profiles/community_profiles con
 * la aceptación de términos fechada y auditables.
 */
export const SponsorshipProfileForm: React.FC = () => {
  const { currentUser, updateProfile } = useApp();

  const [available, setAvailable] = useState(Boolean(currentUser.sponsorship_available));
  const [experience, setExperience] = useState(currentUser.sponsorship_experience || '');
  const [modalities, setModalities] = useState<string[]>(
    currentUser.sponsorship_modalities || []
  );
  const [travel, setTravel] = useState(Boolean(currentUser.sponsorship_travel));
  const [contactEmail, setContactEmail] = useState(
    currentUser.sponsorship_contact_email || ''
  );
  const [portfolioUrl, setPortfolioUrl] = useState(
    currentUser.sponsorship_portfolio_url || currentUser.portfolio_url || ''
  );
  const [acceptedTerms, setAcceptedTerms] = useState(
    Boolean(currentUser.sponsorship_terms_accepted_at)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAvailable(Boolean(currentUser.sponsorship_available));
    setExperience(currentUser.sponsorship_experience || '');
    setModalities(currentUser.sponsorship_modalities || []);
    setTravel(Boolean(currentUser.sponsorship_travel));
    setContactEmail(currentUser.sponsorship_contact_email || '');
    setPortfolioUrl(
      currentUser.sponsorship_portfolio_url || currentUser.portfolio_url || ''
    );
    setAcceptedTerms(Boolean(currentUser.sponsorship_terms_accepted_at));
  }, [
    currentUser.sponsorship_available,
    currentUser.sponsorship_experience,
    currentUser.sponsorship_modalities,
    currentUser.sponsorship_travel,
    currentUser.sponsorship_contact_email,
    currentUser.sponsorship_portfolio_url,
    currentUser.sponsorship_terms_accepted_at,
    currentUser.portfolio_url,
  ]);

  const toggleModality = (id: string) => {
    setModalities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (available && !acceptedTerms) {
      setError('Para recibir patrocinios tenés que aceptar los términos del programa.');
      return;
    }
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setError('El correo de contacto no parece válido.');
      return;
    }
    if (portfolioUrl.trim() && !/^(https?:\/\/|ipfs:\/\/|\/)/i.test(portfolioUrl.trim())) {
      setError('El portfolio debe empezar con https://, ipfs:// o ser un enlace válido.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile({
        sponsorship_available: available,
        sponsorship_experience: experience.trim(),
        sponsorship_modalities: modalities,
        sponsorship_travel: travel,
        sponsorship_contact_email: contactEmail.trim(),
        sponsorship_portfolio_url: portfolioUrl.trim(),
        sponsorship_terms_accepted_at: acceptedTerms
          ? currentUser.sponsorship_terms_accepted_at || new Date().toISOString()
          : undefined,
      });

      if (!result.success) {
        setError(result.error || 'No se pudo guardar el perfil de patrocinio.');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2600);
    } finally {
      setIsSaving(false);
    }
  };

  const disciplinesText = formatDisciplines(currentUser.disciplines) || 'Sin ramas elegidas';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-acid/30 bg-gradient-to-br from-acid/10 via-surface to-magenta/10 overflow-hidden"
    >
      <div className="flex items-start gap-3 border-b border-acid/20 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-acid text-background">
          <BriefcaseBusiness className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-black tracking-wide text-content-primary">
            PERFIL DE PATROCINIO
          </h2>
          <p className="mt-0.5 text-[11px] leading-snug text-content-secondary">
            Completá este formulario para que las marcas encuentren tu arte. Se muestra
            junto a tus ramas: <span className="font-bold text-acid">{disciplinesText}</span>.
          </p>
        </div>
        {currentUser.sponsorship_terms_accepted_at && (
          <span className="hidden shrink-0 items-center gap-1 rounded-full border border-acid/40 bg-acid/10 px-2 py-0.5 text-[10px] font-bold text-acid sm:inline-flex">
            <ShieldCheck className="h-3 w-3" />
            Términos aceptados
          </span>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* Disponibilidad */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-surface-border bg-surface p-3 transition-colors hover:border-acid/50">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-acid"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-content-primary">
              <BadgeDollarSign className="h-4 w-4 text-acid" />
              Estoy disponible para patrocinios
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-content-secondary">
              Tu perfil aparecerá como artista abierto a propuestas de marcas.
            </span>
          </span>
        </label>

        {/* Experiencia */}
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-content-secondary">
            Experiencia y propuesta artística
          </label>
          <textarea
            rows={4}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Contá qué hacés, con qué marcas trabajaste, qué podés ofrecer (shows, contenido, murales, campañas...)."
            className="w-full resize-none rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs leading-relaxed text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
          />
          <p className="mt-1 text-[10px] text-content-muted">
            Mínimo recomendado: 40 caracteres. Las marcas leen esto antes de contactarte.
          </p>
        </div>

        {/* Modalidades */}
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-content-secondary">
            ¿Qué tipo de patrocinio te interesa?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MODALITIES.map((modality) => {
              const active = modalities.includes(modality.id);
              return (
                <button
                  key={modality.id}
                  type="button"
                  onClick={() => toggleModality(modality.id)}
                  title={modality.hint}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    active
                      ? 'border-acid bg-acid text-background'
                      : 'border-surface-border bg-surface-elevated text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {modality.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Viajes */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-surface-border bg-surface p-3">
          <input
            type="checkbox"
            checked={travel}
            onChange={(e) => setTravel(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-acid"
          />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-xs font-bold text-content-primary">
              <MapPinned className="h-4 w-4 text-cyan" />
              Puedo viajar por proyectos
            </span>
            <span className="mt-0.5 block text-[11px] text-content-secondary">
              Shows, batallas, murales o rodajes fuera de mi ciudad.
            </span>
          </span>
        </label>

        {/* Contacto */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-content-secondary">
              <Mail className="h-3.5 w-3.5 text-acid" />
              Correo de contacto
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-content-secondary">
              <ExternalLink className="h-3.5 w-3.5 text-magenta" />
              Portfolio para marcas
            </label>
            <input
              type="text"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://... · ipfs://..."
              className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs text-content-primary placeholder:text-content-muted focus:border-acid focus:outline-none"
            />
          </div>
        </div>

        {/* Términos */}
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
            available && !acceptedTerms
              ? 'border-magenta/60 bg-magenta/10'
              : 'border-surface-border bg-surface'
          }`}
        >
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-acid"
          />
          <span className="min-w-0 text-[11px] leading-snug text-content-secondary">
            Acepto los{' '}
            <Link href="/terminos" target="_blank" className="font-bold text-acid underline">
              términos y condiciones
            </Link>{' '}
            del programa de patrocinios de Larvaz: veracidad de mis datos, uso de mi
            imagen para campañas acordadas y cumplimiento de las contraprestaciones.
            {available && <span className="ml-1 font-bold text-magenta">Obligatorio.</span>}
          </span>
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-magenta/50 bg-magenta/10 p-2.5 text-[11px] text-magenta">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-3">
          <p className="text-[10px] text-content-muted">
            {acceptedTerms && currentUser.sponsorship_terms_accepted_at
              ? `Aceptaste los términos el ${new Date(
                  currentUser.sponsorship_terms_accepted_at
                ).toLocaleDateString('es-AR')}.`
              : 'La aceptación queda fechada y visible para administración.'}
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-acid px-4 py-2.5 text-xs font-black uppercase tracking-wider text-background shadow-acid-sm transition-all hover:bg-acid-hover disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saved ? 'Patrocinio guardado' : 'Guardar perfil de patrocinio'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default SponsorshipProfileForm;
