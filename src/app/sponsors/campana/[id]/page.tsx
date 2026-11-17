'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  Coins,
  FileText,
  Heart,
  Info,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { brandHref } from '@/lib/sponsors/links';
import {
  BrandAvatar,
  Btn,
  BtnLink,
  Countdown,
  EmptyState,
  Field,
  Input,
  Notice,
  Pill,
  ProgressBar,
  SectionHeading,
  Select,
  Textarea,
  sponsorCard,
} from '@/components/sponsors/ui';
import { formatDateTime, formatMoney, isPast, timeAgo } from '@/lib/sponsors/catalog';
import type { CampaignContribution } from '@/types/sponsors';

const METHOD_LABEL: Record<CampaignContribution['method'], string> = {
  transferencia: 'Transferencia',
  cripto: 'Cripto',
  externo: 'Otro medio',
};

export default function CampaignDetailPage() {
  const params = useParams();
  const id = String(params.id || '');
  const { state, store, actor, isAdmin } = useSponsors();

  const campaign = store.getCampaign(id);
  const brand = campaign?.brand_id ? store.getBrand(campaign.brand_id) : undefined;
  const ownerId = campaign ? (campaign.brand_id ? store.getBrand(campaign.brand_id)?.owner_id : campaign.owner_id) : undefined;
  const isOwner = Boolean(actor && campaign && (actor.id === ownerId || actor.id === campaign.owner_id || isAdmin));

  const contributions = useMemo(
    () => (campaign ? state.contributions.filter((c) => c.campaign_id === campaign.id) : []),
    [state.contributions, campaign]
  );
  const verified = useMemo(() => contributions.filter((c) => c.status === 'verificado'), [contributions]);
  const pending = useMemo(() => contributions.filter((c) => c.status === 'pendiente'), [contributions]);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<CampaignContribution['method']>('transferencia');
  const [txRef, setTxRef] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [notice, setNotice] = useState<{ error?: string; success?: string }>({});
  const [updateText, setUpdateText] = useState('');

  if (!campaign) {
    return (
      <EmptyState
        icon={<Heart className="h-5 w-5" />}
        title="Proyecto no encontrado"
        description="Esta campaña no existe o fue retirada."
        action={<BtnLink href="/sponsors/campanas">Ver proyectos</BtnLink>}
      />
    );
  }

  const closed = campaign.status !== 'activa' || isPast(campaign.closes_at);

  const contribute = () => {
    const res = store.contributeToCampaign(actor, campaign.id, {
      amount: Number(amount),
      currency: campaign.currency,
      method,
      message: message || undefined,
      anonymous,
      tx_ref: txRef || undefined,
    });
    if (!res.ok) {
      setNotice({ error: res.error || 'No se pudo registrar el aporte.' });
      return;
    }
    setNotice({
      success:
        'Aporte registrado como PENDIENTE. Se suma a la recaudación cuando la organización verifique la transferencia.',
    });
    setAmount('');
    setTxRef('');
    setMessage('');
    setAnonymous(false);
    setOpen(false);
  };

  const verify = (contributionId: string, accept: boolean) => {
    const res = store.verifyContribution(actor, contributionId, accept);
    setNotice(res.ok ? { success: accept ? 'Aporte verificado.' : 'Aporte rechazado.' } : { error: res.error });
  };

  const publishUpdate = () => {
    const res = store.addCampaignUpdate(actor, campaign.id, updateText);
    if (!res.ok) {
      setNotice({ error: res.error || 'No se pudo publicar.' });
      return;
    }
    setUpdateText('');
    setNotice({ success: 'Novedad publicada.' });
  };

  return (
    <div className="pb-10">
      <Link
        href="/sponsors/campanas"
        className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-content-secondary hover:text-content-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Todos los proyectos
      </Link>

      <Notice error={notice.error} success={notice.success} />

      <div className={`${sponsorCard} overflow-hidden`}>
        {campaign.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={campaign.image_url} alt={campaign.title} className="h-44 w-full object-cover sm:h-56" />
        ) : null}

        <div className="p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="cyan">
              <Heart className="h-3 w-3" /> Apoyar este proyecto
            </Pill>
            <Pill tone={campaign.status === 'activa' ? 'acid' : 'neutral'}>{campaign.status}</Pill>
            {closed ? <Pill tone="danger">Cerrada</Pill> : null}
            <Pill tone="neutral">
              <Users className="h-3 w-3" /> {campaign.donors_count} aportes verificados
            </Pill>
          </div>

          <h1 className="mt-2 font-display text-3xl font-black leading-tight text-content-primary">{campaign.title}</h1>

          {brand ? (
            <Link href={brandHref(brand)} className="mt-2 inline-flex items-center gap-2">
              <BrandAvatar brand={brand} size={28} />
              <span className="flex items-center gap-1 text-xs font-bold text-content-primary">
                {brand.name} {brand.verification === 'verificada' ? <BadgeCheck className="h-3.5 w-3.5 text-acid" /> : null}
              </span>
            </Link>
          ) : (
            <p className="mt-2 text-[11px] text-content-muted">Proyecto de la comunidad · {campaign.beneficiary}</p>
          )}

          <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-content-secondary">{campaign.description}</p>

          <div className="mt-3 rounded-xl border border-cyan/25 bg-cyan/5 p-3">
            <ProgressBar value={campaign.raised_amount} goal={campaign.goal_amount} currency={campaign.currency} />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                <Pill tone="success">
                  <Coins className="h-3 w-3" /> {formatMoney(campaign.raised_amount, campaign.currency)} verificados
                </Pill>
                <Pill tone="orange">
                  <Clock className="h-3 w-3" /> {pending.length} pendientes de verificación
                </Pill>
                <Countdown dateIso={campaign.closes_at} label="Cierra" />
              </div>
              {closed ? (
                <span className="rounded-xl border border-surface-border px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-content-muted">
                  Campaña cerrada
                </span>
              ) : (
                <Btn onClick={() => setOpen((v) => !v)} className="!px-5 !py-2.5">
                  <Heart className="h-4 w-4" /> Quiero aportar
                </Btn>
              )}
            </div>

            <p className="mt-2 flex items-start gap-1 text-[10px] leading-relaxed text-cyan/90">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              LARVAZ no custodia fondos. El aporte queda <b>pendiente</b> hasta que la organización verifica la transferencia o el
              comprobante cripto. Recién ahí se suma a la recaudación.
            </p>
          </div>

          {open ? (
            <div className="mt-3 rounded-xl border border-surface-border bg-surface-elevated/50 p-3">
              <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-content-secondary">Registrar aporte</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Importe" required>
                  <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50" />
                </Field>
                <Field label="Moneda">
                  <Input value={campaign.currency} readOnly />
                </Field>
                <Field label="Método" required>
                  <Select value={method} onChange={(e) => setMethod(e.target.value as CampaignContribution['method'])}>
                    <option value="transferencia">Transferencia bancaria</option>
                    <option value="cripto">Criptomonedas</option>
                    <option value="externo">Otro medio</option>
                  </Select>
                </Field>
                <Field label="Referencia / TX" hint="Número de operación o hash de transacción.">
                  <Input value={txRef} onChange={(e) => setTxRef(e.target.value)} placeholder="0x… / op #123" />
                </Field>
              </div>
              <Field label="Mensaje (opcional)">
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} />
              </Field>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-content-secondary">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="h-4 w-4 accent-acid"
                />
                Aportar de forma anónima
              </label>
              <div className="mt-2 flex justify-end gap-2">
                <Btn variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Btn>
                <Btn onClick={contribute} disabled={!amount || Number(amount) <= 0}>
                  Registrar aporte
                </Btn>
              </div>
            </div>
          ) : null}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className={`${sponsorCard} p-3`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-content-secondary">Beneficiario</p>
              <p className="mt-1 text-sm font-semibold text-content-primary">{campaign.beneficiary}</p>
            </div>
            <div className={`${sponsorCard} p-3`}>
              <p className="text-[10px] font-black uppercase tracking-wider text-content-secondary">Destino de los fondos</p>
              <p className="mt-1 text-[11px] leading-relaxed text-content-secondary">{campaign.use_of_funds}</p>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-content-muted">
            <Clock className="mr-1 inline h-3 w-3" /> Cierra el {formatDateTime(campaign.closes_at)} · Creado{' '}
            {timeAgo(campaign.created_at)}
          </p>
        </div>
      </div>

      {/* Aportes */}
      <div className="mt-5">
        <SectionHeading
          title="APORTES"
          subtitle="Los aportes pendientes no se suman a la recaudación hasta ser verificados."
          icon={<Coins className="h-5 w-5 text-cyan" />}
        />
        {contributions.length ? (
          <div className="space-y-1.5">
            {contributions.map((contribution) => (
              <div key={contribution.id} className={`${sponsorCard} flex flex-wrap items-center gap-2 p-3`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-content-primary">
                    {contribution.donor_name} · {formatMoney(contribution.amount, contribution.currency)}
                  </p>
                  <p className="text-[10px] text-content-muted">
                    {METHOD_LABEL[contribution.method]}
                    {contribution.tx_ref ? ` · ${contribution.tx_ref}` : ''} · {timeAgo(contribution.created_at)}
                  </p>
                  {contribution.message ? (
                    <p className="text-[10px] italic text-content-secondary">“{contribution.message}”</p>
                  ) : null}
                </div>
                <Pill
                  tone={
                    contribution.status === 'verificado' ? 'success' : contribution.status === 'rechazado' ? 'danger' : 'orange'
                  }
                >
                  {contribution.status}
                </Pill>
                {isOwner && contribution.status === 'pendiente' ? (
                  <div className="flex gap-1">
                    <Btn onClick={() => verify(contribution.id, true)} className="!px-2 !py-1 !text-[10px]">
                      <Check className="h-3 w-3" /> Verificar
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => verify(contribution.id, false)}
                      className="!px-2 !py-1 !text-[10px]"
                    >
                      <X className="h-3 w-3" /> Rechazar
                    </Btn>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin aportes todavía"
            description="Sé la primera persona en apoyar este proyecto. El aporte se registra y la organización lo verifica."
          />
        )}
      </div>

      {/* Novedades */}
      <div className="mt-5">
        <SectionHeading title="NOVEDADES" subtitle="La organización rinde cuentas del proyecto." icon={<FileText className="h-5 w-5 text-acid" />} />
        {campaign.updates.length ? (
          <div className="space-y-1.5">
            {campaign.updates.map((update, index) => (
              <div key={`${update.at}-${index}`} className={`${sponsorCard} p-3`}>
                <p className="text-[10px] text-content-muted">{formatDateTime(update.at)}</p>
                <p className="mt-0.5 whitespace-pre-line text-[12px] leading-relaxed text-content-secondary">{update.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-content-secondary">Todavía no hay novedades publicadas.</p>
        )}

        {isOwner ? (
          <div className={`${sponsorCard} mt-2 space-y-2 p-3`}>
            <p className="text-[10px] font-black uppercase tracking-wider text-content-secondary">Publicar novedad</p>
            <Textarea value={updateText} onChange={(e) => setUpdateText(e.target.value)} placeholder="Ej: compramos los materiales y ya empezamos el mural." />
            <div className="flex justify-end">
              <Btn onClick={publishUpdate} disabled={!updateText.trim()}>
                Publicar novedad
              </Btn>
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-4 rounded-lg border border-surface-border bg-surface-elevated/50 p-2.5 text-[10px] leading-relaxed text-content-muted">
        <ShieldCheck className="mr-1 inline h-3 w-3 text-cyan" />
        LARVAZ no recibe, retiene ni transfiere el dinero de las campañas. Cada aporte se coordina con la organización
        responsable y se registra con estado, referencia y verificación. Los aportes rechazados no impactan la recaudación.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <BtnLink href="/sponsors/campanas" variant="secondary">
          Más proyectos
        </BtnLink>
        {brand ? (
          <BtnLink href={brandHref(brand)} variant="ghost">
            Ver marca
          </BtnLink>
        ) : null}
      </div>
    </div>
  );
}
