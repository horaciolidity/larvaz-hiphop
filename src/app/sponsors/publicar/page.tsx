'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Crown, Heart, Megaphone, Trophy, Zap } from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { BrandAvatar, Btn, BtnLink, EmptyState, Field, Input, Notice, Pill, SectionHeading, Select, Tabs, Textarea, sponsorCard } from '@/components/sponsors/ui';
import { ImageInput } from '@/components/sponsors/forms';
import { SweepstakeForm, ChallengeForm, CampaignForm } from '@/components/sponsors/forms';
import { POST_KINDS } from '@/lib/sponsors/catalog';
import { brandHref } from '@/lib/sponsors/links';
import type { SponsorPostKind } from '@/types/sponsors';

type ComposerTab = 'publicacion' | 'sorteo' | 'desafio' | 'campana';

export default function PublicarSponsorPage() {
  const { state, store, actor } = useSponsors();
  const [tab, setTab] = useState<ComposerTab>('publicacion');
  const [brandId, setBrandId] = useState('');

  const myBrands = useMemo(
    () => (actor ? state.brands.filter((b) => b.owner_id === actor.id) : []),
    [state.brands, actor]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get('tab');
    if (requestedTab && ['publicacion', 'sorteo', 'desafio', 'campana'].includes(requestedTab)) {
      setTab(requestedTab as ComposerTab);
    }
    const requestedBrand = params.get('brand');
    if (requestedBrand) setBrandId(requestedBrand);
  }, []);

  useEffect(() => {
    if (!brandId && myBrands.length) setBrandId(myBrands[0].id);
  }, [brandId, myBrands]);

  const [kind, setKind] = useState<SponsorPostKind>('normal');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [linkUrl, setLinkUrl] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!actor || actor.is_guest) {
    return (
      <div>
        <SponsorNav />
        <EmptyState
          icon={<Crown className="h-5 w-5" />}
          title="Ingresá para publicar"
          description="Las publicaciones de patrocinadores se crean desde la cuenta de la marca."
          action={<BtnLink href="/login?redirect=/sponsors/publicar">Iniciar sesión</BtnLink>}
        />
      </div>
    );
  }

  const brand = myBrands.find((b) => b.id === brandId);

  const publishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand) {
      setError('Elegí una marca para publicar.');
      return;
    }
    const res = store.createSponsorPost(actor, {
      brand_id: brand.id,
      kind,
      title,
      body,
      image_url: imageUrl,
      link_url: linkUrl || undefined,
      tags: tags
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean),
    });
    if (!res.ok) {
      setError(res.error || 'No se pudo publicar.');
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess('Publicación creada. Ya aparece en el muro de la marca y en el feed.');
    setTitle('');
    setBody('');
    setImageUrl(undefined);
    setLinkUrl('');
    setTags('');
  };

  return (
    <div className="pb-10">
      <SponsorNav />
      <SectionHeading
        title="PUBLICAR EN LARVAZ SPONSORS"
        subtitle="Elegí el tipo de publicación. Sorteos, desafíos y campañas se configuran con reglas y validaciones."
        icon={<Megaphone className="h-6 w-6 text-acid" />}
      />

      {!myBrands.length && tab !== 'campana' ? (
        <EmptyState
          icon={<Crown className="h-5 w-5" />}
          title="Primero creá tu marca"
          description="Las publicaciones, sorteos y desafíos se publican desde el perfil de una marca."
          action={<BtnLink href="/sponsors/marca/nueva">Crear perfil de marca</BtnLink>}
        />
      ) : (
        <>
          <div className={`${sponsorCard} mb-3 p-3`}>
            {myBrands.length ? (
              <div className="flex flex-wrap items-center gap-2">
                <BrandAvatar brand={brand} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-content-muted">Publicás como</p>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated px-2 py-1 text-sm font-bold text-content-primary"
                  >
                    {myBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Pill tone={brand?.verification === 'verificada' ? 'acid' : 'neutral'}>
                  {brand?.verification === 'verificada' ? 'Verificada' : 'Verificación pendiente'}
                </Pill>
                {brand ? (
                  <BtnLink href={brandHref(brand)} variant="secondary" className="!px-3 !py-2">
                    Ver perfil
                  </BtnLink>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-content-secondary">Estás publicando un proyecto personal (sin marca asociada).</p>
                <BtnLink href="/sponsors/marca/nueva" variant="secondary" className="!px-3 !py-2">
                  Crear marca
                </BtnLink>
              </div>
            )}
          </div>

          <Tabs
            tabs={[
              { id: 'publicacion', label: 'Publicación' },
              { id: 'sorteo', label: 'Sorteo' },
              { id: 'desafio', label: 'Desafío' },
              { id: 'campana', label: 'Donación' },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'publicacion' ? (
            <form onSubmit={publishPost} className={`${sponsorCard} space-y-3 p-4`}>
              <Notice error={error} success={success} />
              <Field label="Tipo de publicación" required>
                <Select value={kind} onChange={(e) => setKind(e.target.value as SponsorPostKind)}>
                  {POST_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.emoji} {k.label} — {k.hint}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Título" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nuevo drop: serie Persiana" maxLength={100} />
              </Field>
              <Field label="Contenido" required>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1500} />
              </Field>
              <ImageInput value={imageUrl} onChange={setImageUrl} label="Imagen principal" />
              <Field label="Enlace">
                <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" />
              </Field>
              <Field label="Etiquetas" hint="Separadas por coma. Sin #.">
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="drop, indumentaria, larvaz" />
              </Field>
              <div className="rounded-lg border border-surface-border bg-surface-elevated/50 p-2 text-[10px] text-content-muted">
                Las publicaciones de marcas se identifican con la etiqueta <span className="font-bold text-acid">SPONSOR</span> y se
                integran al feed principal con likes, comentarios y compartidos.
              </div>
              <div className="flex justify-end">
                <Btn type="submit">Publicar</Btn>
              </div>
            </form>
          ) : null}

          {tab === 'sorteo' ? (
            brand ? (
              <div className={`${sponsorCard} p-4`}>
                <div className="mb-3 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-acid" />
                  <p className="font-display text-lg font-black text-content-primary">Configurar sorteo</p>
                </div>
                <SweepstakeForm
                  brandId={brand.id}
                  onCreated={(id) => {
                    window.location.href = `/sponsors/sorteo/${id}`;
                  }}
                />
              </div>
            ) : (
              <EmptyState title="Elegí una marca" description="Los sorteos se crean desde una marca." />
            )
          ) : null}

          {tab === 'desafio' ? (
            brand ? (
              <div className={`${sponsorCard} p-4`}>
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-magenta" />
                  <p className="font-display text-lg font-black text-content-primary">LARVAZ CHALLENGE</p>
                </div>
                <ChallengeForm
                  brandId={brand.id}
                  onCreated={(id) => {
                    window.location.href = `/sponsors/desafio/${id}`;
                  }}
                />
              </div>
            ) : (
              <EmptyState title="Elegí una marca" description="Los desafíos se crean desde una marca." />
            )
          ) : null}

          {tab === 'campana' ? (
            <div className={`${sponsorCard} p-4`}>
              <div className="mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-cyan" />
                <p className="font-display text-lg font-black text-content-primary">APOYAR ESTE PROYECTO</p>
              </div>
              <CampaignForm
                brandId={brand?.id}
                onCreated={(id) => {
                  window.location.href = `/sponsors/campana/${id}`;
                }}
              />
            </div>
          ) : null}

          <p className="mt-4 text-center text-[10px] text-content-muted">
            ¿Buscás publicar una convocatoria de patrocinio?{' '}
            <Link href="/sponsors/panel" className="text-cyan hover:underline">
              Crear propuesta desde el panel de marca
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
