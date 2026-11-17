'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Coins,
  FileText,
  Globe2,
  MapPin,
  Package,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import {
  ApplicationCard,
  AgreementCard,
} from '@/components/sponsors/cards';
import { ChipToggle } from '@/components/sponsors/forms';
import { brandHref } from '@/lib/sponsors/links';
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
  Textarea,
  sponsorCard,
  SponsorBadge,
  VerifiedBadge,
} from '@/components/sponsors/ui';
import {
  ARTIST_CATEGORIES,
  COUNTERPART_KINDS,
  SPONSORSHIP_TYPES,
  formatDate,
  formatDateTime,
  formatMoney,
  isPast,
  labelOf,
} from '@/lib/sponsors/catalog';
import type { ApplicationStatus } from '@/types/sponsors';

export default function OpportunityDetailPage() {
  const params = useParams();
  const id = String(params.id || '');
  const { state, store, actor, canManage } = useSponsors();
  const opportunity = store.getOpportunity(id);
  const brand = opportunity ? store.getBrand(opportunity.brand_id) : undefined;
  const owner = opportunity ? canManage(opportunity.brand_id) : false;

  const [applyOpen, setApplyOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState<{ applicationId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    message: '',
    portfolio_url: '',
    experience: '',
    proposal: '',
    socials: '',
    media: '',
  });
  const [offerForm, setOfferForm] = useState({ note: '', amount: '', currency: 'USD' });

  const applications = useMemo(
    () => (opportunity ? state.applications.filter((a) => a.opportunity_id === opportunity.id) : []),
    [state.applications, opportunity]
  );
  const myApplication = useMemo(
    () => (opportunity && actor ? applications.find((a) => a.artist_id === actor.id && a.status !== 'retirada') : undefined),
    [applications, actor, opportunity]
  );
  const agreement = useMemo(
    () => (myApplication ? state.agreements.find((a) => a.application_id === myApplication.id) : undefined),
    [state.agreements, myApplication]
  );

  if (!opportunity) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" />}
        title="Propuesta no encontrada"
        description="Esta convocatoria ya no está disponible."
        action={<BtnLink href="/sponsors/explorar">Volver al marketplace</BtnLink>}
      />
    );
  }

  const closed = opportunity.status !== 'abierta' || isPast(opportunity.deadline);
  const offerType = SPONSORSHIP_TYPES.find((t) => t.id === opportunity.offer.type);

  const submitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const socialLines = form.socials
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, ...rest] = line.split('|');
        return rest.length ? { label: label.trim(), url: rest.join('|').trim() } : { label: 'Red', url: line };
      });
    const mediaLines = form.media
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url, index) => ({ label: `Media ${index + 1}`, url }));

    const res = store.applyToOpportunity(actor, opportunity.id, {
      message: form.message,
      portfolio_url: form.portfolio_url,
      social_links: [...socialLines, ...mediaLines],
      experience: form.experience,
      proposal: form.proposal,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error || 'No se pudo enviar la postulación.');
      return;
    }
    setError(null);
    setSuccess('¡Postulación enviada! La marca ya puede verla en su panel.');
    setApplyOpen(false);
  };

  const sendOffer = () => {
    if (!offerOpen) return;
    const res = store.sendOffer(actor, offerOpen.applicationId, {
      note: offerForm.note,
      amount: offerForm.amount ? Number(offerForm.amount) : undefined,
      currency: offerForm.currency,
    });
    if (!res.ok) {
      setError(res.error || 'No se pudo enviar la oferta.');
      return;
    }
    setOfferOpen(null);
    setOfferForm({ note: '', amount: '', currency: 'USD' });
    setSuccess('Oferta enviada al artista.');
  };

  const setStatus = (applicationId: string, status: ApplicationStatus) => {
    const res = store.setApplicationStatus(actor, applicationId, status);
    if (!res.ok) setError(res.error || 'No se pudo actualizar.');
    else setSuccess(`Postulación marcada como ${status}.`);
  };

  return (
    <div className="pb-10">
      <Link href="/sponsors/explorar" className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-content-secondary hover:text-content-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Explorar patrocinios
      </Link>

      <Notice error={error} success={success} />

      <div className={`${sponsorCard} overflow-hidden`}>
        {opportunity.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={opportunity.image_url} alt={opportunity.title} className="h-44 w-full object-cover sm:h-56" />
        ) : null}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <SponsorBadge />
            {offerType ? <Pill tone="acid">{offerType.emoji} {offerType.label}</Pill> : null}
            <Pill tone="neutral">{labelOf(opportunity.status, [
              { id: 'borrador', label: 'Borrador' },
              { id: 'abierta', label: 'Abierta' },
              { id: 'pausada', label: 'Pausada' },
              { id: 'cerrada', label: 'Cerrada' },
            ])}</Pill>
            {closed ? <Pill tone="danger">Cerrada</Pill> : null}
          </div>

          <h1 className="mt-2 font-display text-3xl font-black leading-tight text-content-primary">{opportunity.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link href={brandHref(brand)} className="flex items-center gap-2">
              <BrandAvatar brand={brand} size={34} />
              <div>
                <p className="flex items-center gap-1 text-xs font-black text-content-primary">
                  {brand?.name || 'Marca'} {brand?.verification === 'verificada' ? <BadgeCheck className="h-3.5 w-3.5 text-acid" /> : null}
                </p>
                <p className="text-[10px] text-content-muted">{brand?.city}, {brand?.country}</p>
              </div>
            </Link>
            <VerifiedBadge brand={brand} />
          </div>

          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-content-secondary">{opportunity.description}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-acid/25 bg-acid/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-acid">Beneficio ofrecido</p>
              <p className="mt-1 text-sm font-semibold text-content-primary">{opportunity.offer.summary}</p>
              {opportunity.offer.amount ? (
                <p className="mt-1 text-[11px] text-content-secondary">
                  Monto: {formatMoney(opportunity.offer.amount, opportunity.offer.currency)} ·{' '}
                  {opportunity.offer.payment_modality || 'único'}
                </p>
              ) : null}
              {opportunity.offer.products?.length ? (
                <p className="mt-1 flex items-start gap-1 text-[11px] text-content-secondary">
                  <Package className="mt-0.5 h-3 w-3 shrink-0" /> {opportunity.offer.products.join(' · ')}
                </p>
              ) : null}
              {opportunity.offer.logistics?.length ? (
                <p className="mt-1 flex items-start gap-1 text-[11px] text-content-secondary">
                  <Truck className="mt-0.5 h-3 w-3 shrink-0" /> {opportunity.offer.logistics.join(' · ')}
                </p>
              ) : null}
              {opportunity.offer.crypto ? (
                <div className="mt-2 rounded-lg border border-cyan/25 bg-cyan/5 p-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cyan">Pago cripto</p>
                  <p className="text-[11px] text-content-secondary">
                    {opportunity.offer.crypto.amount} {opportunity.offer.crypto.asset} · {opportunity.offer.crypto.blockchain} /{' '}
                    {opportunity.offer.crypto.network}
                  </p>
                  <p className="text-[10px] text-content-muted">
                    Estado: {opportunity.offer.crypto.status}. LARVAZ no custodia fondos ni simula confirmaciones.
                  </p>
                </div>
              ) : null}
            </div>

            <div className={`${sponsorCard} p-3`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-content-secondary">Datos de la convocatoria</p>
              <div className="mt-1 space-y-1 text-[11px] text-content-secondary">
                <p className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {opportunity.city}, {opportunity.country}
                  {opportunity.is_remote ? ' · Remoto' : ''}
                </p>
                <p className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Duración: {opportunity.duration_days} días
                </p>
                <p className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Límite: {formatDateTime(opportunity.deadline)}
                </p>
                <p className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {opportunity.applications_count} postulaciones · {opportunity.slots} cupos
                </p>
                <p className="flex items-center gap-1">
                  <Coins className="h-3 w-3" /> Publicada el {formatDate(opportunity.created_at)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {opportunity.artist_categories.map((cat) => (
                  <Pill key={cat} tone="magenta">
                    {ARTIST_CATEGORIES.find((c) => c.id === cat)?.label || cat}
                  </Pill>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-content-secondary">
              Contraprestaciones solicitadas
            </p>
            <div className="space-y-1.5">
              {opportunity.counterparts.map((cp) => (
                <div key={cp.id} className="flex items-start justify-between gap-2 rounded-lg border border-surface-border bg-surface-elevated/60 p-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-content-primary">{cp.description}</p>
                    <p className="text-[10px] text-content-muted">
                      {COUNTERPART_KINDS.find((k) => k.id === cp.kind)?.label || cp.kind} · x{cp.quantity}
                      {cp.platform ? ` · ${cp.platform}` : ''}
                      {cp.due_date ? ` · vence ${formatDate(cp.due_date)}` : ''}
                      {cp.evidence_required ? ` · evidencia: ${cp.evidence_required}` : ''}
                    </p>
                  </div>
                  <Pill tone="neutral">{cp.status}</Pill>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {owner ? (
              <>
                <Pill tone="cyan">
                  <ShieldCheck className="h-3 w-3" /> Sos la marca
                </Pill>
                <BtnLink href="/sponsors/panel?tab=postulaciones" variant="secondary" className="!py-2">
                  Gestionar postulaciones ({applications.length})
                </BtnLink>
                <BtnLink href="/sponsors/publicar" variant="ghost" className="!py-2">
                  Crear otra publicación
                </BtnLink>
              </>
            ) : myApplication ? (
              <div className="w-full rounded-xl border border-acid/25 bg-acid/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Check className="h-4 w-4 text-acid" />
                  <p className="text-xs font-bold text-content-primary">Tu postulación está {myApplication.status}</p>
                  <Pill tone="acid">{myApplication.status}</Pill>
                </div>
                {myApplication.offer ? (
                  <p className="mt-1 text-[11px] text-content-secondary">
                    Oferta recibida: {myApplication.offer.note}
                    {myApplication.offer.amount ? ` · ${formatMoney(myApplication.offer.amount, myApplication.offer.currency)}` : ''}
                  </p>
                ) : null}
                {myApplication.status === 'oferta' ? (
                  <div className="mt-2 flex gap-2">
                    <Btn
                      onClick={() => {
                        const res = store.respondToOffer(actor, myApplication.id, true);
                        if (!res.ok) setError(res.error || 'No se pudo aceptar.');
                        else setSuccess('Aceptaste la oferta. Se generó el acuerdo digital.');
                      }}
                      className="!py-2"
                    >
                      Aceptar oferta
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => {
                        const res = store.respondToOffer(actor, myApplication.id, false);
                        if (!res.ok) setError(res.error || 'No se pudo rechazar.');
                        else setSuccess('Rechazaste la oferta.');
                      }}
                      className="!py-2"
                    >
                      Rechazar
                    </Btn>
                  </div>
                ) : null}
                {agreement ? (
                  <div className="mt-2">
                    <AgreementCard agreement={agreement} actions={<Pill tone="success">Acuerdo digital generado</Pill>} />
                  </div>
                ) : null}
              </div>
            ) : closed ? (
              <div className="rounded-xl border border-surface-border px-4 py-3 text-xs font-bold uppercase tracking-wide text-content-muted">
                La convocatoria está cerrada
              </div>
            ) : (
              <Btn onClick={() => setApplyOpen(true)} className="!px-6 !py-3">
                <Sparkles className="h-4 w-4" /> Postularme
              </Btn>
            )}
          </div>

          {opportunity.offer.crypto ? (
            <p className="mt-3 rounded-lg border border-surface-border bg-surface-elevated/50 p-2 text-[10px] leading-relaxed text-content-muted">
              <ShieldCheck className="mr-1 inline h-3 w-3 text-cyan" />
              Los pagos cripto se acuerdan con el artista antes de transferir y se confirman con comprobante e identificador
              de transacción. LARVAZ no custodia fondos ni marca pagos como confirmados sin verificación.
            </p>
          ) : null}
        </div>
      </div>

      {owner && applications.length ? (
        <div className="mt-5">
          <SectionHeading title="POSTULACIONES RECIBIDAS" subtitle="Compará, preseleccioná, enviá ofertas y conversá." />
          <div className="space-y-2">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                actions={
                  <>
                    <Btn variant="secondary" onClick={() => setStatus(application.id, 'preseleccionada')} className="!px-2.5 !py-1.5 !text-[10px]">
                      Preseleccionar
                    </Btn>
                    <Btn variant="secondary" onClick={() => setStatus(application.id, 'rechazada')} className="!px-2.5 !py-1.5 !text-[10px]">
                      <X className="h-3 w-3" /> Rechazar
                    </Btn>
                    <Btn
                      onClick={() => {
                        setOfferOpen({ applicationId: application.id });
                        setOfferForm({
                          note: application.offer?.note || '',
                          amount: application.offer?.amount ? String(application.offer.amount) : '',
                          currency: application.offer?.currency || 'USD',
                        });
                      }}
                      className="!px-2.5 !py-1.5 !text-[10px]"
                    >
                      <Send className="h-3 w-3" /> Enviar oferta
                    </Btn>
                    <BtnLink href="/sponsors/panel?tab=acuerdos" variant="ghost" className="!px-2.5 !py-1.5 !text-[10px]">
                      Ver acuerdos
                    </BtnLink>
                  </>
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      {brand ? (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-surface-border bg-surface p-3">
          <div className="flex items-center gap-2">
            <BrandAvatar brand={brand} size={32} />
            <div>
              <p className="text-xs font-black text-content-primary">{brand.name}</p>
              <p className="text-[10px] text-content-muted">Conocé todas sus propuestas y su muro</p>
            </div>
          </div>
          <Link href={brandHref(brand)} className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-acid hover:underline">
            Ver marca <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}

      {/* Modal postulación */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title="Postularme a esta propuesta">
        <Notice error={error} />
        <form onSubmit={submitApplication} className="space-y-3">
          <Field label="Mensaje de presentación" required hint="Mínimo 20 caracteres. Contá por qué encajás.">
            <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={900} />
          </Field>
          <Field label="Portfolio">
            <Input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://…" />
          </Field>
          <Field label="Experiencia">
            <Textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
          </Field>
          <Field label="Propuesta de colaboración">
            <Textarea value={form.proposal} onChange={(e) => setForm({ ...form, proposal: e.target.value })} />
          </Field>
          <Field label="Redes sociales" hint="Una por línea con formato: Instagram | https://instagram.com/tuuser">
            <Textarea value={form.socials} onChange={(e) => setForm({ ...form, socials: e.target.value })} />
          </Field>
          <Field label="Fotos y videos" hint="Un enlace por línea.">
            <Textarea value={form.media} onChange={(e) => setForm({ ...form, media: e.target.value })} />
          </Field>
          <p className="text-[10px] text-content-muted">
            Tu perfil LARVAZ se adjunta automáticamente. Solo se permite una postulación activa por propuesta.
          </p>
          <div className="flex justify-end gap-2">
            <Btn type="button" variant="secondary" onClick={() => setApplyOpen(false)}>
              Cancelar
            </Btn>
            <Btn type="submit" loading={saving}>
              Enviar postulación
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Modal oferta */}
      <Modal open={Boolean(offerOpen)} onClose={() => setOfferOpen(null)} title="Enviar oferta al artista">
        <Notice error={error} />
        <div className="space-y-3">
          <Field label="Detalle de la oferta" required>
            <Textarea value={offerForm.note} onChange={(e) => setOfferForm({ ...offerForm, note: e.target.value })} placeholder="Cubrimos hospedaje y transporte para 5 personas…" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Monto">
              <Input type="number" min={0} value={offerForm.amount} onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })} />
            </Field>
            <Field label="Moneda">
              <select
                value={offerForm.currency}
                onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value })}
                className="w-full rounded-xl border border-surface-border bg-surface-elevated px-3 py-2.5 text-sm text-content-primary"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="CLP">CLP</option>
                <option value="COP">COP</option>
                <option value="MXN">MXN</option>
              </select>
            </Field>
          </div>
          <p className="text-[10px] text-muted text-content-muted">
            Cuando el artista acepte, se genera automáticamente el acuerdo digital con las contraprestaciones de la propuesta.
          </p>
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setOfferOpen(null)}>
              Cancelar
            </Btn>
            <Btn onClick={sendOffer}>Enviar oferta</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
