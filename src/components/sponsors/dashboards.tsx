'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  BarChart3,
  Check,
  CheckCircle2,
  Crown,
  ExternalLink,
  FileText,
  HandCoins,
  Heart,
  Megaphone,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  Trophy,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type {
  AgreementStatus,
  ApplicationStatus,
  BrandVerificationStatus,
  CounterpartStatus,
  PrizeDeliveryStatus,
} from '@/types/sponsors';
import { useSponsors } from '@/context/SponsorsContext';
import { brandHref } from '@/lib/sponsors/links';
import {
  AGREEMENT_STATUS_LABEL,
  APPLICATION_STATUS_LABEL,
  PRIZE_STATUS_LABEL,
  POINTS_RULES,
  formatDate,
  formatDateTime,
  formatMoney,
  timeAgo,
} from '@/lib/sponsors/catalog';
import {
  AgreementCard,
  ApplicationCard,
  BrandCard,
  CampaignCard,
  ChallengeCard,
  OpportunityCard,
  PrizeCard,
  SponsorPostCard,
  SweepstakeCard,
} from './cards';
import { OpportunityForm } from './forms';
import {
  BrandAvatar,
  Btn,
  BtnLink,
  EmptyState,
  Field,
  Input,
  Modal,
  Notice,
  Pill,
  SectionHeading,
  Select,
  StatTile,
  Tabs,
  Textarea,
  sponsorCard,
} from './ui';

// ============================================================================
// Helpers
// ============================================================================

function useInitialTab<T extends string>(tabs: readonly T[], fallback: T): [T, (id: T) => void] {
  const [tab, setTab] = useState<T>(fallback);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && (tabs as readonly string[]).includes(requested)) {
      setTab(requested as T);
    }
  }, [tabs]);
  return [tab, setTab];
}

function OfferModal({
  open,
  onClose,
  applicationId,
}: {
  open: string | null;
  onClose: () => void;
  applicationId: string | null;
}) {
  const { actor, store } = useSponsors();
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState<string | null>(null);

  if (!applicationId) return null;

  const send = () => {
    const res = store.sendOffer(actor, applicationId, {
      note,
      amount: amount ? Number(amount) : undefined,
      currency,
    });
    if (!res.ok) {
      setError(res.error || 'No se pudo enviar la oferta.');
      return;
    }
    setNote('');
    setAmount('');
    setError(null);
    onClose();
  };

  return (
    <Modal open={Boolean(open)} onClose={onClose} title="Enviar oferta al artista">
      <Notice error={error} />
      <div className="space-y-3">
        <Field label="Detalle de la oferta" required>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Beneficios, fechas y condiciones de la colaboración." />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Monto">
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Moneda">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
              <option value="CLP">CLP</option>
              <option value="COP">COP</option>
              <option value="MXN">MXN</option>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn onClick={send}>Enviar oferta</Btn>
        </div>
      </div>
    </Modal>
  );
}

function ReviewModal({
  agreementId,
  onClose,
}: {
  agreementId: string | null;
  onClose: () => void;
}) {
  const { actor, store } = useSponsors();
  const [ratings, setRatings] = useState({ seriousness: 5, compliance: 5, communication: 5, quality: 5 });
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setRatings({ seriousness: 5, compliance: 5, communication: 5, quality: 5 });
    setComment('');
    setError(null);
    setDone(false);
  }, [agreementId]);

  if (!agreementId) return null;

  const labels: { key: keyof typeof ratings; label: string }[] = [
    { key: 'seriousness', label: 'Profesionalismo' },
    { key: 'compliance', label: 'Cumplimiento' },
    { key: 'communication', label: 'Comunicación' },
    { key: 'quality', label: 'Calidad de entregas' },
  ];

  const submit = () => {
    const res = store.createReview(actor, agreementId, { ratings, comment });
    if (!res.ok) {
      setError(res.error || 'No se pudo publicar la reseña.');
      return;
    }
    setDone(true);
    setError(null);
  };

  return (
    <Modal open={Boolean(agreementId)} onClose={onClose} title="Reseñar colaboración">
      <Notice error={error} success={done ? '¡Reseña publicada! Gracias por cuidar la comunidad.' : null} />
      {!done ? (
        <div className="space-y-3">
          {labels.map((item) => (
            <div key={item.key}>
              <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-content-secondary">
                <span>{item.label}</span>
                <span className="text-acid">{ratings[item.key]}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={ratings[item.key]}
                onChange={(e) => setRatings((prev) => ({ ...prev, [item.key]: Number(e.target.value) }))}
                className="w-full accent-acid"
              />
            </div>
          ))}
          <Field label="Tu experiencia" required>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600} />
          </Field>
          <p className="text-[10px] text-content-muted">
            Solo se puede reseñar una colaboración real completada. Cada parte deja una única reseña por acuerdo.
          </p>
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={onClose}>
              Cerrar
            </Btn>
            <Btn onClick={submit}>Publicar reseña</Btn>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Btn onClick={onClose}>Listo</Btn>
        </div>
      )}
    </Modal>
  );
}

// ============================================================================
// Panel de marca
// ============================================================================

type BrandTab = 'resumen' | 'postulaciones' | 'acuerdos' | 'publicaciones' | 'sorteos' | 'premios' | 'campanas' | 'reputacion';

const BRAND_TABS: readonly BrandTab[] = [
  'resumen',
  'postulaciones',
  'acuerdos',
  'publicaciones',
  'sorteos',
  'premios',
  'campanas',
  'reputacion',
];

export function BrandDashboard() {
  const { state, store, actor } = useSponsors();
  const [tab, setTab] = useInitialTab(BRAND_TABS, 'resumen');
  const [brandId, setBrandId] = useState('');
  const [opportunityOpen, setOpportunityOpen] = useState(false);
  const [offerFor, setOfferFor] = useState<string | null>(null);
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ error?: string; success?: string }>({});

  const myBrands = useMemo(
    () => (actor ? state.brands.filter((b) => b.owner_id === actor.id) : []),
    [state.brands, actor]
  );

  useEffect(() => {
    if (!brandId && myBrands.length) setBrandId(myBrands[0].id);
    if (brandId && !myBrands.some((b) => b.id === brandId) && myBrands.length) setBrandId(myBrands[0].id);
  }, [myBrands, brandId]);

  const brand = myBrands.find((b) => b.id === brandId);

  if (!actor || actor.is_guest) {
    return (
      <EmptyState
        icon={<Crown className="h-5 w-5" />}
        title="Ingresá para administrar tu marca"
        description="El panel de patrocinador usa tu cuenta LARVAZ. No hace falta crear otra cuenta."
        action={<BtnLink href="/login?redirect=/sponsors/panel">Iniciar sesión</BtnLink>}
      />
    );
  }

  if (!myBrands.length) {
    return (
      <EmptyState
        icon={<Crown className="h-5 w-5" />}
        title="Todavía no tenés una marca"
        description="Creá el perfil de tu marca para publicar propuestas, sorteos, desafíos y campañas."
        action={<BtnLink href="/sponsors/marca/nueva">Crear perfil de marca</BtnLink>}
      />
    );
  }

  if (!brand) {
    return <div className="text-xs text-content-secondary">Cargando panel…</div>;
  }

  const stats = store.brandStats(brand.id);
  const applications = state.applications.filter((a) => a.brand_id === brand.id);
  const agreements = state.agreements.filter((a) => a.brand_id === brand.id);
  const posts = state.posts.filter((p) => p.brand_id === brand.id);
  const sweepstakes = state.sweepstakes.filter((s) => s.brand_id === brand.id);
  const challenges = state.challenges.filter((c) => c.brand_id === brand.id);
  const prizes = state.prizes.filter((p) => p.brand_id === brand.id);
  const campaigns = state.campaigns.filter((c) => c.brand_id === brand.id);
  const reviews = store.getBrandReviews(brand.id);
  const pendingApplications = applications.filter((a) => a.status === 'pendiente').length;

  const setAppStatus = (applicationId: string, status: ApplicationStatus) => {
    const res = store.setApplicationStatus(actor, applicationId, status);
    setNotice(res.ok ? { success: `Postulación: ${status}` } : { error: res.error });
  };

  const updatePrize = (prizeId: string, status: PrizeDeliveryStatus, note: string) => {
    const res = store.updatePrizeStatus(actor, prizeId, status, note);
    setNotice(res.ok ? { success: 'Estado del premio actualizado.' } : { error: res.error });
  };

  const updateCounterpart = (
    agreementId: string,
    counterpartId: string,
    status: CounterpartStatus,
    evidence?: string
  ) => {
    const res = store.updateCounterpart(actor, agreementId, counterpartId, { status, evidence_url: evidence || undefined });
    setNotice(res.ok ? { success: 'Entregable actualizado.' } : { error: res.error });
  };

  const setAgreement = (agreementId: string, status: AgreementStatus) => {
    const res = store.setAgreementStatus(actor, agreementId, status);
    setNotice(res.ok ? { success: `Acuerdo: ${status}` } : { error: res.error });
  };

  return (
    <div className="pb-10">
      <SectionHeading
        title="PANEL DE PATROCINADOR"
        subtitle="Todo lo que pasa con tu marca en LARVAZ, en un solo lugar."
        icon={<BarChart3 className="h-6 w-6 text-acid" />}
        action={
          <BtnLink href="/sponsors/publicar" className="!px-3 !py-2">
            <Plus className="h-3.5 w-3.5" /> Publicar
          </BtnLink>
        }
      />

      <Notice error={notice.error} success={notice.success} />

      {myBrands.length > 1 ? (
        <div className="mb-3">
          <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            {myBrands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div className={`${sponsorCard} mb-3 flex flex-wrap items-center gap-2 p-3`}>
        <BrandAvatar brand={brand} size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate font-display text-lg font-black text-content-primary">
            {brand.name}
            {brand.verification === 'verificada' ? <BadgeCheck className="h-4 w-4 text-acid" /> : null}
          </p>
          <p className="text-[10px] text-content-muted">
            {brand.city}, {brand.country} · {brand.followers.length} seguidores ·{' '}
            {brand.verification === 'verificada' ? 'Verificada' : 'Verificación pendiente'}
          </p>
        </div>
        <BtnLink href={brandHref(brand)} variant="secondary" className="!px-3 !py-2">
          <ExternalLink className="h-3.5 w-3.5" /> Ver perfil
        </BtnLink>
      </div>

      <Tabs
        tabs={[
          { id: 'resumen', label: 'Resumen' },
          { id: 'postulaciones', label: 'Postulaciones', count: applications.length },
          { id: 'acuerdos', label: 'Acuerdos', count: agreements.length },
          { id: 'publicaciones', label: 'Muro', count: posts.length },
          { id: 'sorteos', label: 'Sorteos', count: sweepstakes.length + challenges.length },
          { id: 'premios', label: 'Premios', count: prizes.length },
          { id: 'campanas', label: 'Campañas', count: campaigns.length },
          { id: 'reputacion', label: 'Reputación', count: reviews.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'resumen' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Seguidores" value={stats.followers} />
            <StatTile label="Likes" value={stats.likes} tone="magenta" />
            <StatTile label="Comentarios" value={stats.comments} tone="cyan" />
            <StatTile label="Compartidos" value={stats.shares} tone="orange" />
            <StatTile label="Postulaciones" value={stats.applications} />
            <StatTile label="Acuerdos" value={stats.agreements} tone="magenta" />
            <StatTile label="Participantes" value={stats.participants} tone="cyan" />
            <StatTile label="Premios pendientes" value={stats.pendingPrizes} tone="orange" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className={`${sponsorCard} p-3`}>
              <p className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">
                <Megaphone className="h-3 w-3" /> Acciones rápidas
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Btn onClick={() => setOpportunityOpen(true)} className="!px-3 !py-2">
                  <Plus className="h-3.5 w-3.5" /> Nueva propuesta
                </Btn>
                <BtnLink href={`/sponsors/publicar?brand=${brand.id}&tab=sorteo`} variant="secondary" className="!px-3 !py-2">
                  <Trophy className="h-3.5 w-3.5" /> Sorteo
                </BtnLink>
                <BtnLink href={`/sponsors/publicar?brand=${brand.id}&tab=desafio`} variant="secondary" className="!px-3 !py-2">
                  <Zap className="h-3.5 w-3.5" /> Desafío
                </BtnLink>
                <BtnLink href={`/sponsors/publicar?brand=${brand.id}&tab=campana`} variant="secondary" className="!px-3 !py-2">
                  <Heart className="h-3.5 w-3.5" /> Campaña
                </BtnLink>
              </div>
            </div>

            <div className={`${sponsorCard} p-3`}>
              <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">Pendientes</p>
              <ul className="space-y-1 text-[11px] text-content-secondary">
                <li className="flex items-center justify-between">
                  <span>Postulaciones nuevas</span>
                  <Pill tone={pendingApplications ? 'magenta' : 'neutral'}>{pendingApplications}</Pill>
                </li>
                <li className="flex items-center justify-between">
                  <span>Premios sin entregar</span>
                  <Pill tone={stats.pendingPrizes ? 'orange' : 'neutral'}>{stats.pendingPrizes}</Pill>
                </li>
                <li className="flex items-center justify-between">
                  <span>Sorteos activos</span>
                  <Pill tone="acid">{stats.activeSweepstakes}</Pill>
                </li>
                <li className="flex items-center justify-between">
                  <span>Aportes por verificar</span>
                  <Pill tone="cyan">
                    {
                      state.contributions.filter(
                        (c) => campaigns.some((camp) => camp.id === c.campaign_id) && c.status === 'pendiente'
                      ).length
                    }
                  </Pill>
                </li>
              </ul>
            </div>
          </div>

          {applications.filter((a) => a.status === 'pendiente').slice(0, 2).map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              actions={
                <>
                  <Btn variant="secondary" onClick={() => setAppStatus(application.id, 'preseleccionada')} className="!px-2.5 !py-1.5 !text-[10px]">
                    Preseleccionar
                  </Btn>
                  <Btn onClick={() => setOfferFor(application.id)} className="!px-2.5 !py-1.5 !text-[10px]">
                    Enviar oferta
                  </Btn>
                </>
              }
            />
          ))}
        </div>
      ) : null}

      {tab === 'postulaciones' ? (
        applications.length ? (
          <div className="space-y-2">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                actions={
                  <>
                    <Btn variant="secondary" onClick={() => setAppStatus(application.id, 'preseleccionada')} className="!px-2.5 !py-1.5 !text-[10px]">
                      Preseleccionar
                    </Btn>
                    <Btn variant="secondary" onClick={() => setAppStatus(application.id, 'rechazada')} className="!px-2.5 !py-1.5 !text-[10px]">
                      <X className="h-3 w-3" /> Rechazar
                    </Btn>
                    <Btn onClick={() => setOfferFor(application.id)} className="!px-2.5 !py-1.5 !text-[10px]">
                      Enviar oferta
                    </Btn>
                    <Pill tone="neutral">{APPLICATION_STATUS_LABEL[application.status]}</Pill>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Sin postulaciones" description="Cuando publiques una propuesta, las postulaciones llegan acá." action={<Btn onClick={() => setOpportunityOpen(true)}>Crear propuesta</Btn>} />
        )
      ) : null}

      {tab === 'acuerdos' ? (
        agreements.length ? (
          <div className="space-y-3">
            {agreements.map((agreement) => (
              <div key={agreement.id}>
                <AgreementCard
                  agreement={agreement}
                  expanded
                  actions={
                    <>
                      <Btn variant="secondary" onClick={() => setAgreement(agreement.id, 'en_curso')} className="!px-2.5 !py-1.5 !text-[10px]">
                        En curso
                      </Btn>
                      <Btn variant="secondary" onClick={() => setAgreement(agreement.id, 'cumplimiento_parcial')} className="!px-2.5 !py-1.5 !text-[10px]">
                        Cumplimiento parcial
                      </Btn>
                      <Btn onClick={() => setAgreement(agreement.id, 'completado')} className="!px-2.5 !py-1.5 !text-[10px]">
                        <CheckCircle2 className="h-3 w-3" /> Completar
                      </Btn>
                      <Btn variant="danger" onClick={() => setAgreement(agreement.id, 'disputa')} className="!px-2.5 !py-1.5 !text-[10px]">
                        Disputa
                      </Btn>
                      {agreement.status === 'completado' ? (
                        <Btn variant="magenta" onClick={() => setReviewFor(agreement.id)} className="!px-2.5 !py-1.5 !text-[10px]">
                          <Star className="h-3 w-3" /> Reseñar artista
                        </Btn>
                      ) : null}
                    </>
                  }
                />
                <div className="mt-1.5 space-y-1.5 rounded-xl border border-surface-border bg-surface-elevated/40 p-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-content-muted">Aprobar entregables</p>
                  {agreement.counterparts.map((cp) => (
                    <div key={cp.id} className="flex flex-wrap items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-[10px] text-content-secondary">{cp.description}</span>
                      {cp.evidence_url ? (
                        <a href={cp.evidence_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-cyan">
                          Evidencia
                        </a>
                      ) : null}
                      <select
                        value={cp.status}
                        onChange={(e) => updateCounterpart(agreement.id, cp.id, e.target.value as CounterpartStatus)}
                        className="rounded-lg border border-surface-border bg-surface px-1.5 py-1 text-[10px] text-content-primary"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="entregado">Entregado</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-surface-border px-2 py-1 text-[10px] text-content-secondary">
                        <Upload className="h-3 w-3" /> Evidencia
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const { uploadMediaFile } = await import('@/lib/media-upload');
                              const uploaded = await uploadMediaFile(file, 'image');
                              updateCounterpart(agreement.id, cp.id, 'entregado', uploaded.url);
                            } catch {
                              setNotice({ error: 'No se pudo subir la evidencia.' });
                            }
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin acuerdos" description="Cuando aceptes una postulación y el artista acepte la oferta, el acuerdo aparece acá." />
        )
      ) : null}

      {tab === 'publicaciones' ? (
        <div>
          <div className="mb-2 flex justify-end">
            <BtnLink href={`/sponsors/publicar?brand=${brand.id}`} className="!px-3 !py-2">
              <Plus className="h-3.5 w-3.5" /> Nueva publicación
            </BtnLink>
          </div>
          {posts.length ? (
            posts.map((post) => (
              <div key={post.id} className="relative">
                <SponsorPostCard post={post} />
                <button
                  type="button"
                  onClick={() => {
                    const res = store.removeSponsorPost(actor, post.id, 'Eliminada por la marca');
                    setNotice(res.ok ? { success: 'Publicación eliminada.' } : { error: res.error });
                  }}
                  className="absolute right-2 top-10 rounded-lg bg-background/80 p-1 text-red-400"
                  aria-label="Eliminar publicación"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <EmptyState title="Muro vacío" description="Publicá novedades, lanzamientos, convocatorias o promociones." action={<BtnLink href={`/sponsors/publicar?brand=${brand.id}`}>Crear publicación</BtnLink>} />
          )}
        </div>
      ) : null}

      {tab === 'sorteos' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-end gap-2">
            <BtnLink href={`/sponsors/publicar?brand=${brand.id}&tab=sorteo`} className="!px-3 !py-2">
              <Trophy className="h-3.5 w-3.5" /> Nuevo sorteo
            </BtnLink>
            <BtnLink href={`/sponsors/publicar?brand=${brand.id}&tab=desafio`} variant="secondary" className="!px-3 !py-2">
              <Zap className="h-3.5 w-3.5" /> Nuevo desafío
            </BtnLink>
          </div>
          {sweepstakes.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {sweepstakes.map((sw) => (
                <div key={sw.id} className="space-y-1.5">
                  <SweepstakeCard sweepstake={sw} />
                  <div className="flex flex-wrap gap-1.5">
                    {sw.status !== 'sorteado' && sw.status !== 'cancelado' ? (
                      <Btn
                        onClick={() => {
                          const res = store.drawSweepstake(actor, sw.id);
                          setNotice(res.ok ? { success: 'Sorteo realizado con auditoría.' } : { error: res.error });
                        }}
                        className="!px-2.5 !py-1.5 !text-[10px]"
                      >
                        Sortear ahora
                      </Btn>
                    ) : null}
                    <BtnLink href={`/sponsors/sorteo/${sw.id}`} variant="secondary" className="!px-2.5 !py-1.5 !text-[10px]">
                      Ver detalle
                    </BtnLink>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin sorteos" description="Creá un sorteo con premios reales y reglas auditables." icon={<Trophy className="h-5 w-5" />} />
          )}

          {challenges.length ? (
            <div>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-content-secondary">Desafíos</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {challenges.map((ch) => (
                  <ChallengeCard key={ch.id} challenge={ch} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'premios' ? (
        prizes.length ? (
          <div className="space-y-2">
            {prizes.map((prize) => (
              <div key={prize.id}>
                <PrizeCard prize={prize} />
                <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-xl border border-surface-border bg-surface-elevated/40 p-2">
                  <SelectPrizeStatus
                    value={prize.status}
                    onChange={(status) => {
                      const note = window.prompt('Nota o comprobante de entrega (opcional)') || '';
                      updatePrize(prize.id, status, note);
                    }}
                  />
                  <span className="text-[10px] text-content-muted">
                    Última actualización: {prize.delivery.length ? formatDateTime(prize.delivery[prize.delivery.length - 1].at) : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin premios" description="Los premios se crean al sortear o al cerrar un desafío." />
        )
      ) : null}

      {tab === 'campanas' ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <BtnLink href={`/sponsors/publicar?brand=${brand.id}&tab=campana`} className="!px-3 !py-2">
              <Heart className="h-3.5 w-3.5" /> Nueva campaña
            </BtnLink>
          </div>
          {campaigns.length ? (
            campaigns.map((campaign) => {
              const contributions = state.contributions.filter((c) => c.campaign_id === campaign.id);
              return (
                <div key={campaign.id} className="space-y-2">
                  <CampaignCard campaign={campaign} />
                  <div className={`${sponsorCard} p-3`}>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">
                      Aportes ({contributions.length})
                    </p>
                    {contributions.length ? (
                      <div className="space-y-1.5">
                        {contributions.map((contribution) => (
                          <div key={contribution.id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-surface-border p-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-bold text-content-primary">
                                {contribution.donor_name} · {formatMoney(contribution.amount, contribution.currency)}
                              </p>
                              <p className="text-[10px] text-content-muted">
                                {contribution.method} {contribution.tx_ref ? `· ${contribution.tx_ref}` : ''} · {timeAgo(contribution.created_at)}
                              </p>
                              {contribution.message ? <p className="text-[10px] text-content-secondary">“{contribution.message}”</p> : null}
                            </div>
                            <Pill tone={contribution.status === 'verificado' ? 'success' : contribution.status === 'rechazado' ? 'danger' : 'orange'}>
                              {contribution.status}
                            </Pill>
                            {contribution.status === 'pendiente' ? (
                              <>
                                <Btn
                                  onClick={() => {
                                    const res = store.verifyContribution(actor, contribution.id, true);
                                    setNotice(res.ok ? { success: 'Aporte verificado y sumado a la recaudación.' } : { error: res.error });
                                  }}
                                  className="!px-2 !py-1 !text-[10px]"
                                >
                                  Verificar
                                </Btn>
                                <Btn
                                  variant="danger"
                                  onClick={() => {
                                    const res = store.verifyContribution(actor, contribution.id, false);
                                    setNotice(res.ok ? { success: 'Aporte rechazado.' } : { error: res.error });
                                  }}
                                  className="!px-2 !py-1 !text-[10px]"
                                >
                                  Rechazar
                                </Btn>
                              </>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-content-secondary">Sin aportes todavía. Los aportes no se suman hasta verificarlos.</p>
                    )}
                    <CampaignUpdateInput campaignId={campaign.id} />
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState title="Sin campañas" description="Creá una campaña para financiar un proyecto cultural." icon={<Heart className="h-5 w-5" />} />
          )}
        </div>
      ) : null}

      {tab === 'reputacion' ? (
        <div className="space-y-2">
          {reviews.length ? (
            reviews.map((review) => (
              <div key={review.id} className={`${sponsorCard} p-3`}>
                <div className="flex items-center justify-between">
                  <Pill tone="acid">
                    <Star className="h-3 w-3" /> {review.from_role === 'artista' ? 'Artista' : 'Marca'}
                  </Pill>
                  <span className="text-[10px] text-content-muted">{formatDate(review.created_at)}</span>
                </div>
                <p className="mt-1 text-[12px] text-content-secondary">{review.comment}</p>
                <p className="mt-1 text-[10px] text-content-muted">
                  Seriedad {review.ratings.seriousness} · Cumplimiento {review.ratings.compliance} · Comunicación{' '}
                  {review.ratings.communication} · Calidad {review.ratings.quality}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin reputación todavía"
              description="La reputación se construye con colaboraciones completadas. No se aceptan reseñas sin acuerdo verificado."
            />
          )}
          <div className={`${sponsorCard} p-3`}>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">Acuerdos completados para reseñar</p>
            {agreements.filter((a) => a.status === 'completado').length ? (
              <div className="space-y-1.5">
                {agreements
                  .filter((a) => a.status === 'completado')
                  .map((agreement) => (
                    <div key={agreement.id} className="flex items-center justify-between gap-2 rounded-lg border border-surface-border p-2">
                      <p className="min-w-0 flex-1 truncate text-[11px] text-content-primary">{agreement.title}</p>
                      <Btn onClick={() => setReviewFor(agreement.id)} className="!px-2 !py-1 !text-[10px]">
                        Reseñar
                      </Btn>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-[11px] text-content-secondary">Todavía no hay colaboraciones completadas.</p>
            )}
          </div>
        </div>
      ) : null}

      <Modal open={opportunityOpen} onClose={() => setOpportunityOpen(false)} title="Nueva propuesta de patrocinio">
        <OpportunityForm
          brandId={brand.id}
          onCancel={() => setOpportunityOpen(false)}
          onCreated={(id) => {
            setOpportunityOpen(false);
            window.location.href = `/sponsors/oportunidad/${id}`;
          }}
        />
      </Modal>

      <OfferModal open={offerFor} applicationId={offerFor} onClose={() => setOfferFor(null)} />
      <ReviewModal agreementId={reviewFor} onClose={() => setReviewFor(null)} />
    </div>
  );
}

function SelectPrizeStatus({
  value,
  onChange,
}: {
  value: PrizeDeliveryStatus;
  onChange: (value: PrizeDeliveryStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PrizeDeliveryStatus)}
      className="rounded-lg border border-surface-border bg-surface px-2 py-1 text-[10px] text-content-primary"
    >
      {(Object.keys(PRIZE_STATUS_LABEL) as PrizeDeliveryStatus[])
        .filter((status) => status !== 'confirmado')
        .map((status) => (
          <option key={status} value={status}>
            {PRIZE_STATUS_LABEL[status]}
          </option>
        ))}
    </select>
  );
}

function CampaignUpdateInput({ campaignId }: { campaignId: string }) {
  const { actor, store } = useSponsors();
  const [text, setText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Publicar una novedad de la campaña…" />
        <Btn
          onClick={() => {
            const res = store.addCampaignUpdate(actor, campaignId, text);
            if (!res.ok) setMessage(res.error || 'No se pudo publicar.');
            else {
              setText('');
              setMessage('Novedad publicada.');
            }
          }}
          className="!px-3 !py-2"
        >
          Publicar
        </Btn>
      </div>
      {message ? <p className="mt-1 text-[10px] text-content-muted">{message}</p> : null}
    </div>
  );
}

// ============================================================================
// Panel de artista
// ============================================================================

type ArtistTab = 'resumen' | 'postulaciones' | 'acuerdos' | 'sorteos' | 'premios' | 'campanas' | 'puntos' | 'reputacion';

const ARTIST_TABS: readonly ArtistTab[] = [
  'resumen',
  'postulaciones',
  'acuerdos',
  'sorteos',
  'premios',
  'campanas',
  'puntos',
  'reputacion',
];

export function ArtistDashboard() {
  const { state, store, actor } = useSponsors();
  const [tab, setTab] = useInitialTab(ARTIST_TABS, 'resumen');
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ error?: string; success?: string }>({});

  if (!actor || actor.is_guest) {
    return (
      <EmptyState
        icon={<Star className="h-5 w-5" />}
        title="Ingresá a tu panel de artista"
        description="Con tu cuenta LARVAZ podés postularte, recibir ofertas y gestionar acuerdos."
        action={<BtnLink href="/login?redirect=/sponsors/artista">Iniciar sesión</BtnLink>}
      />
    );
  }

  const applications = state.applications.filter((a) => a.artist_id === actor.id);
  const agreements = state.agreements.filter((a) => a.artist_id === actor.id);
  const participations = state.participations.filter((p) => p.user_id === actor.id && p.valid);
  const prizes = state.prizes.filter((p) => p.winner_user_id === actor.id);
  const campaigns = state.campaigns.filter((c) => c.owner_id === actor.id);
  const contributions = state.contributions.filter((c) => c.user_id === actor.id);
  const points = store.getPointsFor(actor.id);
  const history = store.getPointsHistory(actor.id);
  const reviews = state.reviews.filter((r) => r.from_id === actor.id);
  const pendingCommitments = agreements
    .flatMap((agreement) => agreement.counterparts.map((cp) => ({ agreement, cp })))
    .filter(({ cp }) => cp.status !== 'aprobado' && cp.status !== 'entregado');

  const respondOffer = (applicationId: string, accept: boolean) => {
    const res = store.respondToOffer(actor, applicationId, accept);
    setNotice(res.ok ? { success: accept ? 'Oferta aceptada. Acuerdo generado.' : 'Oferta rechazada.' } : { error: res.error });
  };

  const updateCounterpart = (agreementId: string, counterpartId: string, status: CounterpartStatus, evidence?: string) => {
    const res = store.updateCounterpart(actor, agreementId, counterpartId, { status, evidence_url: evidence || undefined });
    setNotice(res.ok ? { success: 'Entregable actualizado.' } : { error: res.error });
  };

  return (
    <div className="pb-10">
      <SectionHeading
        title="PANEL DE ARTISTA"
        subtitle="Patrocinadores, ofertas, acuerdos, premios y puntos."
        icon={<Star className="h-6 w-6 text-magenta" />}
        action={
          <BtnLink href="/sponsors/explorar" className="!px-3 !py-2">
            Explorar patrocinios
          </BtnLink>
        }
      />

      <Notice error={notice.error} success={notice.success} />

      <div className={`${sponsorCard} mb-3 flex flex-wrap items-center gap-2 p-3`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-magenta/15 text-magenta">
          <Star className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-black text-content-primary">{actor.full_name}</p>
          <p className="text-[10px] text-content-muted">
            @{actor.username} · {points} LARVAZ POINTS
          </p>
        </div>
        <BtnLink href={`/artista/${actor.username}`} variant="secondary" className="!px-3 !py-2">
          Ver mi perfil
        </BtnLink>
      </div>

      <Tabs
        tabs={[
          { id: 'resumen', label: 'Resumen' },
          { id: 'postulaciones', label: 'Postulaciones', count: applications.length },
          { id: 'acuerdos', label: 'Acuerdos', count: agreements.length },
          { id: 'sorteos', label: 'Sorteos', count: participations.length },
          { id: 'premios', label: 'Premios', count: prizes.length },
          { id: 'campanas', label: 'Proyectos', count: campaigns.length },
          { id: 'puntos', label: 'Puntos', count: history.length },
          { id: 'reputacion', label: 'Reputación', count: reviews.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'resumen' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Propuestas activas" value={applications.filter((a) => ['pendiente', 'preseleccionada', 'oferta'].includes(a.status)).length} />
            <StatTile label="Acuerdos" value={agreements.length} tone="magenta" />
            <StatTile label="Premios" value={prizes.length} tone="cyan" />
            <StatTile label="Puntos" value={points} tone="orange" />
          </div>

          {applications.filter((a) => a.status === 'oferta').slice(0, 2).map((application) => (
            <div key={application.id} className={`${sponsorCard} p-3`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-magenta">Oferta recibida</p>
              <p className="mt-1 text-sm font-bold text-content-primary">{application.offer?.note}</p>
              <div className="mt-2 flex gap-2">
                <Btn onClick={() => respondOffer(application.id, true)} className="!px-3 !py-2">
                  Aceptar
                </Btn>
                <Btn variant="danger" onClick={() => respondOffer(application.id, false)} className="!px-3 !py-2">
                  Rechazar
                </Btn>
              </div>
            </div>
          ))}

          <div className={`${sponsorCard} p-3`}>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">Compromisos pendientes</p>
            {pendingCommitments.length ? (
              <div className="space-y-1.5">
                {pendingCommitments.slice(0, 4).map(({ agreement, cp }) => (
                  <div key={cp.id} className="rounded-lg border border-surface-border p-2">
                    <p className="text-[11px] font-bold text-content-primary">{cp.description}</p>
                    <p className="text-[10px] text-content-muted">
                      {agreement.title} · vence {formatDate(cp.due_date)}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-surface-border px-2 py-1 text-[10px] text-content-secondary">
                        <Upload className="h-3 w-3" /> Subir evidencia
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const { uploadMediaFile } = await import('@/lib/media-upload');
                              const uploaded = await uploadMediaFile(file, 'image');
                              updateCounterpart(agreement.id, cp.id, 'entregado', uploaded.url);
                            } catch {
                              setNotice({ error: 'No se pudo subir la evidencia.' });
                            }
                          }}
                        />
                      </label>
                      <Btn variant="secondary" onClick={() => updateCounterpart(agreement.id, cp.id, 'entregado')} className="!px-2 !py-1 !text-[10px]">
                        Marcar entregado
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-content-secondary">No tenés entregables pendientes.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'postulaciones' ? (
        applications.length ? (
          <div className="space-y-2">
            {applications.map((application) => {
              const opp = store.getOpportunity(application.opportunity_id);
              const brand = store.getBrand(application.brand_id);
              return (
                <div key={application.id} className={`${sponsorCard} p-3`}>
                  <div className="flex items-start gap-2">
                    <BrandAvatar brand={brand} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-content-primary">{opp?.title || 'Propuesta'}</p>
                      <p className="text-[10px] text-content-muted">
                        {brand?.name} · {timeAgo(application.created_at)}
                      </p>
                    </div>
                    <Pill tone={application.status === 'aceptada' ? 'success' : application.status === 'oferta' ? 'acid' : 'neutral'}>
                      {APPLICATION_STATUS_LABEL[application.status]}
                    </Pill>
                  </div>
                  {application.status === 'oferta' ? (
                    <div className="mt-2 rounded-lg border border-acid/25 bg-acid/5 p-2">
                      <p className="text-[11px] text-content-primary">{application.offer?.note}</p>
                      <div className="mt-1.5 flex gap-1.5">
                        <Btn onClick={() => respondOffer(application.id, true)} className="!px-2.5 !py-1.5 !text-[10px]">
                          Aceptar oferta
                        </Btn>
                        <Btn variant="danger" onClick={() => respondOffer(application.id, false)} className="!px-2.5 !py-1.5 !text-[10px]">
                          Rechazar
                        </Btn>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-1.5 flex gap-2">
                    {opp ? (
                      <Link href={`/sponsors/oportunidad/${opp.id}`} className="text-[10px] font-bold text-cyan hover:underline">
                        Ver convocatoria
                      </Link>
                    ) : null}
                    {['pendiente', 'preseleccionada'].includes(application.status) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const res = store.withdrawApplication(actor, application.id);
                          setNotice(res.ok ? { success: 'Postulación retirada.' } : { error: res.error });
                        }}
                        className="text-[10px] font-bold text-red-400"
                      >
                        Retirar
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Sin postulaciones" description="Explorá el marketplace y postulate a las propuestas que encajen con tu arte." action={<BtnLink href="/sponsors/explorar">Explorar patrocinios</BtnLink>} />
        )
      ) : null}

      {tab === 'acuerdos' ? (
        agreements.length ? (
          <div className="space-y-3">
            {agreements.map((agreement) => (
              <div key={agreement.id}>
                <AgreementCard
                  agreement={agreement}
                  expanded
                  actions={
                    <>
                      {agreement.status === 'completado' ? (
                        <Btn variant="magenta" onClick={() => setReviewFor(agreement.id)} className="!px-2.5 !py-1.5 !text-[10px]">
                          <Star className="h-3 w-3" /> Reseñar marca
                        </Btn>
                      ) : null}
                      <BtnLink href={brandHref(store.getBrand(agreement.brand_id))} variant="ghost" className="!px-2.5 !py-1.5 !text-[10px]">
                        Ver marca
                      </BtnLink>
                    </>
                  }
                />
                <div className="mt-1.5 space-y-1.5 rounded-xl border border-surface-border bg-surface-elevated/40 p-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-content-muted">Mis entregables</p>
                  {agreement.counterparts.map((cp) => (
                    <div key={cp.id} className="flex flex-wrap items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-[10px] text-content-secondary">{cp.description}</span>
                      <Pill tone={cp.status === 'aprobado' ? 'success' : 'neutral'}>{cp.status}</Pill>
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-surface-border px-2 py-1 text-[10px] text-content-secondary">
                        <Upload className="h-3 w-3" /> Evidencia
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const { uploadMediaFile } = await import('@/lib/media-upload');
                              const uploaded = await uploadMediaFile(file, 'image');
                              updateCounterpart(agreement.id, cp.id, 'entregado', uploaded.url);
                            } catch {
                              setNotice({ error: 'No se pudo subir la evidencia.' });
                            }
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin acuerdos" description="Cuando aceptes una oferta de patrocinio, el acuerdo digital aparece acá." />
        )
      ) : null}

      {tab === 'sorteos' ? (
        <div className="space-y-2">
          {participations.length ? (
            participations.map((participation) => {
              const sw = store.getSweepstake(participation.sweepstake_id);
              if (!sw) return null;
              return (
                <div key={participation.id} className={`${sponsorCard} flex flex-wrap items-center gap-2 p-3`}>
                  <Trophy className="h-4 w-4 text-acid" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-content-primary">{sw.title}</p>
                    <p className="text-[10px] text-content-muted">
                      {participation.method} · {timeAgo(participation.created_at)}
                    </p>
                  </div>
                  <Pill tone={sw.status === 'sorteado' ? 'cyan' : 'acid'}>{sw.status}</Pill>
                  <BtnLink href={`/sponsors/sorteo/${sw.id}`} variant="secondary" className="!px-2 !py-1 !text-[10px]">
                    Ver
                  </BtnLink>
                </div>
              );
            })
          ) : (
            <EmptyState title="Sin participaciones" description="Participá en sorteos desde las publicaciones de las marcas." icon={<Trophy className="h-5 w-5" />} />
          )}
        </div>
      ) : null}

      {tab === 'premios' ? (
        prizes.length ? (
          <div className="space-y-2">
            {prizes.map((prize) => (
              <div key={prize.id}>
                <PrizeCard
                  prize={prize}
                  showWinner={false}
                  onConfirm={() => {
                    const res = store.confirmPrizeReceived(actor, prize.id);
                    setNotice(res.ok ? { success: 'Confirmaste la recepción del premio.' } : { error: res.error });
                  }}
                />
                <p className="mt-1 text-[10px] text-content-muted">
                  Si el premio no llegó o tiene un problema, la marca debe registrar una incidencia en el panel.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin premios" description="Cuando ganes un sorteo o desafío, el premio aparece acá para coordinar la entrega." />
        )
      ) : null}

      {tab === 'campanas' ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <BtnLink href="/sponsors/publicar?tab=campana" className="!px-3 !py-2">
              <Plus className="h-3.5 w-3.5" /> Crear proyecto
            </BtnLink>
          </div>
          {campaigns.length ? (
            campaigns.map((campaign) => (
              <div key={campaign.id}>
                <CampaignCard campaign={campaign} />
                <div className="mt-1 flex flex-wrap gap-2">
                  <BtnLink href={`/sponsors/campana/${campaign.id}`} variant="secondary" className="!px-2.5 !py-1.5 !text-[10px]">
                    Gestionar aportes
                  </BtnLink>
                  <Pill tone="cyan">{formatMoney(campaign.raised_amount, campaign.currency)} verificados</Pill>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="Sin proyectos propios" description="Creá una campaña para financiar tu videoclip, mural o gira." action={<BtnLink href="/sponsors/publicar?tab=campana">Crear campaña</BtnLink>} />
          )}

          {contributions.length ? (
            <div className={`${sponsorCard} p-3`}>
              <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">Mis aportes</p>
              {contributions.map((contribution) => (
                <div key={contribution.id} className="flex items-center gap-2 border-t border-surface-border/60 py-1.5 first:border-0">
                  <p className="min-w-0 flex-1 truncate text-[11px] text-content-primary">
                    {formatMoney(contribution.amount, contribution.currency)} · {contribution.method}
                  </p>
                  <Pill tone={contribution.status === 'verificado' ? 'success' : contribution.status === 'rechazado' ? 'danger' : 'orange'}>
                    {contribution.status}
                  </Pill>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'puntos' ? (
        <div className="space-y-3">
          <div className={`${sponsorCard} p-4`}>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-acid" />
              <p className="font-display text-2xl font-black text-content-primary">{points} pts</p>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-content-muted">
              LARVAZ POINTS es opcional. No es dinero ni tiene valor monetario transferible: sirve para beneficios de marcas.
              Los puntos tienen topes diarios y no se acreditan dos veces por la misma acción.
            </p>
          </div>
          <div className={`${sponsorCard} p-3`}>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-content-secondary">Historial</p>
            {history.length ? (
              <div className="space-y-1">
                {history.map((entry) => {
                  const rule = POINTS_RULES.find((r) => r.action === entry.action);
                  return (
                    <div key={entry.id} className="flex items-center gap-2 border-t border-surface-border/60 py-1.5 first:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] text-content-primary">{rule?.label || entry.action}</p>
                        <p className="text-[10px] text-content-muted">{timeAgo(entry.created_at)}</p>
                      </div>
                      <span className="text-[11px] font-bold text-acid">+{entry.points}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-content-secondary">Todavía no sumaste puntos. Participá en sorteos y desafíos.</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'reputacion' ? (
        <div className="space-y-2">
          {reviews.length ? (
            reviews.map((review) => (
              <div key={review.id} className={`${sponsorCard} p-3`}>
                <div className="flex items-center justify-between">
                  <Pill tone="magenta">Tu reseña</Pill>
                  <span className="text-[10px] text-content-muted">{formatDate(review.created_at)}</span>
                </div>
                <p className="mt-1 text-[12px] text-content-secondary">{review.comment}</p>
              </div>
            ))
          ) : (
            <EmptyState
              title="Sin reseñas propias"
              description="Después de completar un patrocinio podés valorar la seriedad, el cumplimiento y la comunicación de la marca."
            />
          )}
          <div className={`${sponsorCard} p-3`}>
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">Acuerdos completados</p>
            {agreements.filter((a) => a.status === 'completado').length ? (
              agreements
                .filter((a) => a.status === 'completado')
                .map((agreement) => (
                  <div key={agreement.id} className="flex items-center justify-between gap-2 border-t border-surface-border/60 py-1.5 first:border-0">
                    <p className="min-w-0 flex-1 truncate text-[11px] text-content-primary">{agreement.title}</p>
                    <Btn onClick={() => setReviewFor(agreement.id)} className="!px-2 !py-1 !text-[10px]">
                      Reseñar marca
                    </Btn>
                  </div>
                ))
            ) : (
              <p className="text-[11px] text-content-secondary">Todavía no completaste colaboraciones.</p>
            )}
          </div>
        </div>
      ) : null}

      <ReviewModal agreementId={reviewFor} onClose={() => setReviewFor(null)} />
    </div>
  );
}

// ============================================================================
// Administración global
// ============================================================================

export function AdminDashboard() {
  const { state, store, actor, isAdmin } = useSponsors();
  const [notice, setNotice] = useState<{ error?: string; success?: string }>({});
  const stats = store.globalStats();

  if (!isAdmin) {
    return (
      <EmptyState
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Acceso restringido"
        description="Este panel es solo para moderación y administración de LARVAZ."
        action={<BtnLink href="/sponsors">Volver a Sponsors</BtnLink>}
      />
    );
  }

  const pendingBrands = state.brands.filter((b) => b.verification === 'pendiente');
  const disputes = state.agreements.filter((a) => a.status === 'disputa');
  const pendingContributions = state.contributions.filter((c) => c.status === 'pendiente');

  return (
    <div className="pb-10">
      <SectionHeading
        title="ADMINISTRACIÓN SPONSORS"
        subtitle="Verificación de marcas, moderación, disputas, campañas y auditoría."
        icon={<ShieldCheck className="h-6 w-6 text-acid" />}
      />
      <Notice error={notice.error} success={notice.success} />

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Marcas" value={stats.brands} hint={`${stats.pendingBrands} pendientes`} />
        <StatTile label="Propuestas" value={stats.opportunities} tone="magenta" hint="abiertas" />
        <StatTile label="Sorteos" value={stats.sweepstakes} tone="cyan" hint={`${stats.activeSweepstakes} activos`} />
        <StatTile label="Disputas" value={stats.disputes} tone="orange" hint={`${stats.prizesPending} premios pendientes`} />
      </div>

      <div className={`${sponsorCard} mb-3 p-3`}>
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-content-secondary">Verificación de marcas</p>
        {pendingBrands.length ? (
          <div className="space-y-2">
            {pendingBrands.map((brand) => (
              <div key={brand.id} className="rounded-lg border border-surface-border p-2">
                <div className="flex items-center gap-2">
                  <BrandAvatar brand={brand} size={32} />
                  <div className="min-w-0 flex-1">
                    <Link href={brandHref(brand)} className="truncate text-[12px] font-bold text-content-primary hover:text-acid">
                      {brand.name}
                    </Link>
                    <p className="text-[10px] text-content-muted">{brand.city}, {brand.country} · {brand.contact_email || 'sin email'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Btn
                      onClick={() => {
                        const res = store.setBrandVerification(actor, brand.id, 'verificada', 'Documentación revisada por administración.');
                        setNotice(res.ok ? { success: `${brand.name} verificada.` } : { error: res.error });
                      }}
                      className="!px-2 !py-1 !text-[10px]"
                    >
                      Verificar
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => {
                        const reason = window.prompt('Motivo del rechazo') || 'Datos incompletos';
                        const res = store.setBrandVerification(actor, brand.id, 'rechazada', reason);
                        setNotice(res.ok ? { success: 'Marca rechazada.' } : { error: res.error });
                      }}
                      className="!px-2 !py-1 !text-[10px]"
                    >
                      Rechazar
                    </Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-content-secondary">No hay marcas pendientes de verificación.</p>
        )}
      </div>

      <div className={`${sponsorCard} mb-3 p-3`}>
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-content-secondary">Todas las marcas</p>
        <div className="space-y-1.5">
          {state.brands.map((brand) => (
            <div key={brand.id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-surface-border p-2">
              <BrandAvatar brand={brand} size={24} />
              <Link href={brandHref(brand)} className="min-w-0 flex-1 truncate text-[11px] font-bold text-content-primary hover:text-acid">
                {brand.name}
              </Link>
              <Pill tone={brand.verification === 'verificada' ? 'acid' : brand.verification === 'suspendida' ? 'danger' : 'neutral'}>
                {brand.verification}
              </Pill>
              <select
                value={brand.verification}
                onChange={(e) => {
                  const res = store.setBrandVerification(actor, brand.id, e.target.value as BrandVerificationStatus, 'Cambio administrativo');
                  setNotice(res.ok ? { success: 'Estado actualizado.' } : { error: res.error });
                }}
                className="rounded-lg border border-surface-border bg-surface px-1.5 py-1 text-[10px] text-content-primary"
              >
                <option value="pendiente">Pendiente</option>
                <option value="verificada">Verificada</option>
                <option value="rechazada">Rechazada</option>
                <option value="suspendida">Suspendida</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className={`${sponsorCard} mb-3 p-3`}>
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-content-secondary">Disputas de acuerdos</p>
        {disputes.length ? (
          <div className="space-y-2">
            {disputes.map((agreement) => (
              <div key={agreement.id} className="rounded-lg border border-red-500/30 bg-red-500/5 p-2">
                <p className="text-[12px] font-bold text-content-primary">{agreement.title}</p>
                <p className="text-[10px] text-content-muted">
                  {agreement.artist_name} · {formatDate(agreement.start_date)} → {formatDate(agreement.end_date)}
                </p>
                <Btn
                  variant="secondary"
                  onClick={() => {
                    const resolution = window.prompt('Resolución de la disputa') || '';
                    if (!resolution.trim()) return;
                    const res = store.resolveDispute(actor, agreement.id, resolution);
                    setNotice(res.ok ? { success: 'Disputa resuelta.' } : { error: res.error });
                  }}
                  className="mt-1 !px-2 !py-1 !text-[10px]"
                >
                  Resolver
                </Btn>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-content-secondary">No hay disputas abiertas.</p>
        )}
      </div>

      <div className={`${sponsorCard} mb-3 p-3`}>
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-content-secondary">
          Aportes pendientes de verificación ({pendingContributions.length})
        </p>
        {pendingContributions.length ? (
          <div className="space-y-1.5">
            {pendingContributions.map((contribution) => {
              const campaign = store.getCampaign(contribution.campaign_id);
              return (
                <div key={contribution.id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-surface-border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] text-content-primary">
                      {contribution.donor_name} · {formatMoney(contribution.amount, contribution.currency)}
                    </p>
                    <p className="text-[10px] text-content-muted">{campaign?.title}</p>
                  </div>
                  <Btn
                    onClick={() => {
                      const res = store.verifyContribution(actor, contribution.id, true);
                      setNotice(res.ok ? { success: 'Aporte verificado.' } : { error: res.error });
                    }}
                    className="!px-2 !py-1 !text-[10px]"
                  >
                    Verificar
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={() => {
                      const res = store.verifyContribution(actor, contribution.id, false);
                      setNotice(res.ok ? { success: 'Aporte rechazado.' } : { error: res.error });
                    }}
                    className="!px-2 !py-1 !text-[10px]"
                  >
                    Rechazar
                  </Btn>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-content-secondary">No hay aportes pendientes.</p>
        )}
      </div>

      <div className={`${sponsorCard} mb-3 p-3`}>
        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-content-secondary">Publicaciones de marcas</p>
        <div className="space-y-1.5">
          {state.posts.map((post) => {
            const brand = store.getBrand(post.brand_id);
            return (
              <div key={post.id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-surface-border p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-content-primary">{post.title}</p>
                  <p className="text-[10px] text-content-muted">
                    {brand?.name || 'Proyecto'} · {post.likes.length} likes · {post.comments.length} comentarios
                  </p>
                </div>
                <BtnLink href={`/sponsors/marca/${brand?.slug || ''}`} variant="secondary" className="!px-2 !py-1 !text-[10px]">
                  Ver
                </BtnLink>
                <Btn
                  variant="danger"
                  onClick={() => {
                    const res = store.removeSponsorPost(actor, post.id, 'Moderación administrativa');
                    setNotice(res.ok ? { success: 'Publicación moderada.' } : { error: res.error });
                  }}
                  className="!px-2 !py-1 !text-[10px]"
                >
                  <Trash2 className="h-3 w-3" />
                </Btn>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`${sponsorCard} p-3`}>
        <p className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">
          <FileText className="h-3 w-3" /> Auditoría reciente
        </p>
        {state.audit.length ? (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {state.audit.slice(0, 60).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-surface-border p-2">
                <p className="text-[11px] font-bold text-content-primary">{entry.action}</p>
                <p className="text-[10px] text-content-muted">
                  {entry.target_type} · {entry.target_id} · {formatDateTime(entry.at)}
                </p>
                {entry.detail ? <p className="text-[10px] text-content-secondary">{entry.detail}</p> : null}
                {entry.hash ? <p className="truncate font-mono text-[9px] text-content-muted">#{entry.hash.slice(0, 32)}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-content-secondary">Sin eventos de auditoría todavía.</p>
        )}
      </div>
    </div>
  );
}
