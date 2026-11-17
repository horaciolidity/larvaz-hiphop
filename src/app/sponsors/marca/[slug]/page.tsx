'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  BadgeCheck,
  CalendarDays,
  Crown,
  ExternalLink,
  Facebook,
  Globe2,
  Instagram,
  MapPin,
  MessageCircle,
  Pencil,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import {
  AgreementCard,
  BrandCard,
  CampaignCard,
  ChallengeCard,
  OpportunityCard,
  SponsorPostCard,
  SweepstakeCard,
} from '@/components/sponsors/cards';
import { BrandForm } from '@/components/sponsors/forms';
import {
  BrandAvatar,
  Btn,
  BtnLink,
  EmptyState,
  Modal,
  Pill,
  SectionHeading,
  StatTile,
  Tabs,
  sponsorCard,
} from '@/components/sponsors/ui';
import { BRAND_STATUS_LABEL, COMMERCIAL_CATEGORIES, artistCategoryLabel, formatDate } from '@/lib/sponsors/catalog';

type Tab = 'posts' | 'oportunidades' | 'sorteos' | 'campanas' | 'resenas' | 'info';

export default function BrandProfilePage() {
  const params = useParams();
  const slug = String(params.slug || '');
  const { state, store, actor, canManage } = useSponsors();
  const brand = store.getBrandBySlug(slug);
  const [tab, setTab] = useState<Tab>('posts');
  const [editOpen, setEditOpen] = useState(false);

  const posts = useMemo(() => state.posts.filter((p) => p.brand_id === brand?.id), [state.posts, brand?.id]);
  const opportunities = useMemo(
    () => state.opportunities.filter((o) => o.brand_id === brand?.id),
    [state.opportunities, brand?.id]
  );
  const sweepstakes = useMemo(
    () => state.sweepstakes.filter((s) => s.brand_id === brand?.id),
    [state.sweepstakes, brand?.id]
  );
  const challenges = useMemo(
    () => state.challenges.filter((c) => c.brand_id === brand?.id),
    [state.challenges, brand?.id]
  );
  const campaigns = useMemo(
    () => state.campaigns.filter((c) => c.brand_id === brand?.id),
    [state.campaigns, brand?.id]
  );
  const reviews = useMemo(() => (brand ? store.getBrandReviews(brand.id) : []), [brand, store]);
  const stats = useMemo(() => (brand ? store.brandStats(brand.id) : null), [brand, store]);
  const agreements = useMemo(
    () => state.agreements.filter((a) => a.brand_id === brand?.id && ['en_curso', 'completado', 'cumplimiento_parcial'].includes(a.status)),
    [state.agreements, brand?.id]
  );

  if (!brand) {
    return (
      <EmptyState
        icon={<Crown className="h-5 w-5" />}
        title="Marca no encontrada"
        description="El perfil que buscás no existe o cambió de dirección."
        action={<BtnLink href="/sponsors/marcas">Ver directorio de marcas</BtnLink>}
      />
    );
  }

  const isOwner = canManage(brand.id);
  const following = Boolean(actor && brand.followers.includes(actor.id));
  const categoryLabel = COMMERCIAL_CATEGORIES.find((c) => c.id === brand.category)?.label || brand.category;

  const similar = state.brands
    .filter((b) => b.id !== brand.id && b.verification === 'verificada' && b.category === brand.category)
    .slice(0, 2);

  return (
    <div className="pb-10">
      {/* Portada */}
      <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface">
        <div className="relative h-32 sm:h-40">
          {brand.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.cover_url} alt={brand.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-acid/25 via-surface to-magenta/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          {isOwner ? (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border border-surface-border bg-background/80 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-content-primary"
            >
              <Pencil className="h-3 w-3" /> Editar
            </button>
          ) : null}
        </div>

        <div className="relative px-3 pb-3">
          <div className="-mt-8 flex items-end gap-3">
            <div className="rounded-2xl border-4 border-surface bg-surface">
              <BrandAvatar brand={brand} size={64} />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="font-display text-2xl font-black leading-none text-content-primary">{brand.name}</h1>
                {brand.verification === 'verificada' ? <BadgeCheck className="h-5 w-5 text-acid" /> : null}
              </div>
              <p className="text-[11px] text-content-secondary">
                {categoryLabel} · {brand.city}, {brand.country}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Pill tone={brand.verification === 'verificada' ? 'acid' : 'neutral'}>{BRAND_STATUS_LABEL[brand.verification]}</Pill>
            <Pill tone="neutral">
              <Users className="h-3 w-3" /> {brand.followers.length} seguidores
            </Pill>
            {brand.reputation.reviews ? (
              <Pill tone="acid">
                <Star className="h-3 w-3" /> {brand.reputation.score.toFixed(1)} · {brand.reputation.reviews} reseñas
              </Pill>
            ) : (
              <Pill tone="neutral">Sin reseñas todavía</Pill>
            )}
            <Pill tone="neutral">
              <CalendarDays className="h-3 w-3" /> Desde {formatDate(brand.created_at)}
            </Pill>
          </div>

          <p className="mt-2 text-[12px] leading-relaxed text-content-secondary">{brand.description}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            {brand.website ? (
              <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan hover:underline">
                <Globe2 className="h-3 w-3" /> Sitio web
              </a>
            ) : null}
            {brand.instagram ? (
              <a
                href={`https://instagram.com/${brand.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan hover:underline"
              >
                <Instagram className="h-3 w-3" /> {brand.instagram}
              </a>
            ) : null}
            {brand.tiktok ? (
              <a
                href={`https://tiktok.com/@${brand.tiktok.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> {brand.tiktok}
              </a>
            ) : null}
            {brand.facebook ? (
              <a href={`https://facebook.com/${brand.facebook.replace('/', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan hover:underline">
                <Facebook className="h-3 w-3" /> Facebook
              </a>
            ) : null}
            <span className="inline-flex items-center gap-1 text-content-muted">
              <MapPin className="h-3 w-3" /> {brand.province ? `${brand.province}, ` : ''}
              {brand.city}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Btn
              variant={following ? 'secondary' : 'primary'}
              onClick={() => store.toggleFollowBrand(actor, brand.id)}
              className="!py-2"
            >
              {following ? 'Siguiendo' : 'Seguir marca'}
            </Btn>
            <BtnLink href={`/sponsors/explorar`} variant="secondary" className="!py-2">
              Ver oportunidades
            </BtnLink>
            {isOwner ? (
              <BtnLink href="/sponsors/panel" variant="ghost" className="!py-2">
                Ir al panel
              </BtnLink>
            ) : null}
            <a
              href={`/sponsors/panel?tab=postulaciones`}
              className="inline-flex items-center gap-1 rounded-xl border border-surface-border px-3 py-2 text-[11px] font-black uppercase tracking-wide text-content-secondary"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Contacto: {brand.contact_email || 'vía LARVAZ'}
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Publicaciones" value={stats.posts} />
          <StatTile label="Likes" value={stats.likes} tone="magenta" />
          <StatTile label="Propuestas" value={stats.opportunities} tone="cyan" />
          <StatTile label="Postulaciones" value={stats.applications} tone="orange" />
        </div>
      ) : null}

      {/* Tabs */}
      <div className="mt-4">
        <Tabs
          tabs={[
            { id: 'posts', label: 'Muro', count: posts.length },
            { id: 'oportunidades', label: 'Propuestas', count: opportunities.length },
            { id: 'sorteos', label: 'Sorteos', count: sweepstakes.length },
            { id: 'campanas', label: 'Proyectos', count: campaigns.length },
            { id: 'resenas', label: 'Reseñas', count: reviews.length },
            { id: 'info', label: 'Info' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'posts' ? (
          posts.length ? (
            <div>
              {posts.map((post) => (
                <SponsorPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState title="La marca todavía no publicó" description="Cuando publique, sus novedades aparecen acá y en el feed principal." />
          )
        ) : null}

        {tab === 'oportunidades' ? (
          opportunities.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin convocatorias abiertas" description="Esta marca todavía no publicó propuestas de patrocinio." />
          )
        ) : null}

        {tab === 'sorteos' ? (
          <div className="space-y-4">
            {sweepstakes.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {sweepstakes.map((sw) => (
                  <SweepstakeCard key={sw.id} sweepstake={sw} />
                ))}
              </div>
            ) : (
              <EmptyState title="Sin sorteos" description="No hay sorteos de esta marca por ahora." icon={<Trophy className="h-5 w-5" />} />
            )}
            {challenges.length ? (
              <>
                <SectionHeading title="Desafíos" />
                <div className="grid gap-3 sm:grid-cols-2">
                  {challenges.map((ch) => (
                    <ChallengeCard key={ch.id} challenge={ch} />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {tab === 'campanas' ? (
          campaigns.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin proyectos activos" description="Esta marca no tiene campañas de financiación." />
          )
        ) : null}

        {tab === 'resenas' ? (
          reviews.length ? (
            <div className="space-y-2">
              {reviews.map((review) => {
                const avg =
                  (review.ratings.seriousness + review.ratings.compliance + review.ratings.communication + review.ratings.quality) / 4;
                return (
                  <div key={review.id} className={`${sponsorCard} p-3`}>
                    <div className="flex items-center justify-between">
                      <Pill tone="acid">
                        <Star className="h-3 w-3" /> {avg.toFixed(1)} / 5
                      </Pill>
                      <span className="text-[10px] text-content-muted">
                        {review.from_role === 'artista' ? 'Artista verificado' : 'Marca'} · {formatDate(review.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-content-secondary">{review.comment}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-content-muted">
                      <span>Seriedad: {review.ratings.seriousness}/5</span>
                      <span>Cumplimiento: {review.ratings.compliance}/5</span>
                      <span>Comunicación: {review.ratings.communication}/5</span>
                      <span>Calidad: {review.ratings.quality}/5</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Todavía no hay reseñas"
              description="Solo se puede reseñar una colaboración real completada. Sin colaboración verificada no hay reseña."
            />
          )
        ) : null}

        {tab === 'info' ? (
          <div className={`${sponsorCard} space-y-3 p-3`}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Rubro</p>
              <p className="text-sm text-content-primary">{categoryLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Busca artistas</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {brand.seeking_categories.length ? (
                  brand.seeking_categories.map((c) => (
                    <Pill key={c} tone="magenta">
                      {artistCategoryLabel(c)}
                    </Pill>
                  ))
                ) : (
                  <span className="text-xs text-content-secondary">Sin preferencia definida</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Ubicaciones de interés</p>
              <p className="text-sm text-content-primary">{brand.interest_locations.join(', ') || 'Toda la comunidad'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Contacto</p>
              <p className="text-sm text-content-primary">
                {brand.contact_name || '—'} · {brand.contact_email || '—'} · {brand.contact_phone || '—'}
              </p>
            </div>
            {brand.verification_note ? (
              <p className="rounded-lg border border-surface-border bg-surface-elevated/60 p-2 text-[10px] text-content-secondary">
                Nota de verificación: {brand.verification_note}
              </p>
            ) : null}
            {agreements.length ? (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-content-muted">Colaboraciones</p>
                <div className="space-y-2">
                  {agreements.map((agreement) => (
                    <AgreementCard key={agreement.id} agreement={agreement} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {similar.length ? (
        <div className="mt-6">
          <SectionHeading title="Marcas del mismo rubro" />
          <div className="grid gap-3 sm:grid-cols-2">
            {similar.map((b) => (
              <BrandCard key={b.id} brand={b} />
            ))}
          </div>
        </div>
      ) : null}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar perfil de marca">
        <BrandForm
          brandId={brand.id}
          initial={{
            name: brand.name,
            description: brand.description,
            category: brand.category,
            country: brand.country,
            province: brand.province,
            city: brand.city,
            logo_url: brand.logo_url,
            cover_url: brand.cover_url,
            website: brand.website,
            instagram: brand.instagram,
            tiktok: brand.tiktok,
            facebook: brand.facebook,
            contact_name: brand.contact_name,
            contact_email: brand.contact_email,
            contact_phone: brand.contact_phone,
            seeking_categories: brand.seeking_categories,
            interest_locations: brand.interest_locations,
          }}
          onDone={() => setEditOpen(false)}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <p className="mt-6 text-center text-[10px] text-content-muted">
        ¿Buscás otra marca?{' '}
        <Link href="/sponsors/marcas" className="text-cyan hover:underline">
          Volver al directorio
        </Link>
      </p>
    </div>
  );
}
