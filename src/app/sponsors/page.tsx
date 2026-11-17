'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Crown,
  Flame,
  HandCoins,
  Heart,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import {
  CampaignCard,
  ChallengeCard,
  OpportunityCard,
  SweepstakeCard,
} from '@/components/sponsors/cards';
import { BtnLink, Pill, SectionHeading, StatTile, sponsorCard, SponsorBadge } from '@/components/sponsors/ui';

const steps = [
  {
    icon: Briefcase,
    title: 'Creá tu perfil',
    text: 'Marca o artista, con los datos reales de tu proyecto. Una misma cuenta puede tener los dos roles.',
  },
  {
    icon: Megaphone,
    title: 'Publicá o postulate',
    text: 'La marca lanza convocatorias y el artista se postula con portfolio, propuesta y redes.',
  },
  {
    icon: HandCoins,
    title: 'Acordá el patrocinio',
    text: 'Oferta, aceptación y acuerdo digital con beneficios, entregables y fechas.',
  },
  {
    icon: ShieldCheck,
    title: 'Cumplí y verificá',
    text: 'Cada compromiso tiene evidencia y estado. Todo queda auditado dentro de LARVAZ.',
  },
];

export default function SponsorsLandingPage() {
  const { state, store, actor } = useSponsors();
  const stats = store.globalStats();

  const opportunities = state.opportunities
    .filter((o) => o.status === 'abierta')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);
  const sweepstakes = state.sweepstakes.filter((s) => s.status === 'activo').slice(0, 3);
  const challenges = state.challenges.filter((c) => c.status === 'abierto').slice(0, 3);
  const campaigns = state.campaigns.filter((c) => c.status === 'activa').slice(0, 3);
  const brands = state.brands.filter((b) => b.verification === 'verificada').slice(0, 4);
  const featuredPosts = state.posts.slice(0, 2);

  return (
    <div className="pb-10">
      <SponsorNav />

      {/* HERO */}
      <section className="relative mb-5 overflow-hidden rounded-2xl border border-acid/25 bg-gradient-to-br from-surface via-surface to-background p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-acid/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-magenta/10 blur-2xl" />
        <div className="relative">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <SponsorBadge />
            <Pill tone="cyan">
              <Sparkles className="h-3 w-3" /> Nuevo segmento
            </Pill>
          </div>
          <h1 className="font-display text-4xl font-black leading-none tracking-wide text-content-primary sm:text-5xl">
            LARVAZ <span className="text-acid">SPONSORS</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-content-secondary">
            Las marcas impulsan el talento y el talento impulsa la cultura. Patrocinios, sorteos, premios, desafíos,
            donaciones y oportunidades reales para la comunidad urbana.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link
              href="/sponsors/marca/nueva"
              className="group flex items-center gap-3 rounded-xl border border-acid/30 bg-acid/10 p-3 transition hover:bg-acid/15"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-acid text-background">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-black text-content-primary">Soy una marca</p>
                <p className="text-[11px] text-content-secondary">Quiero patrocinar talento</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-acid transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/sponsors/artista"
              className="group flex items-center gap-3 rounded-xl border border-magenta/30 bg-magenta/10 p-3 transition hover:bg-magenta/15"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-magenta text-white">
                <Star className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-base font-black text-content-primary">Soy artista</p>
                <p className="text-[11px] text-content-secondary">Quiero conseguir patrocinadores</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-magenta transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <BtnLink href="/sponsors/explorar" variant="secondary" className="!py-2">
              Explorar patrocinios
            </BtnLink>
            <BtnLink href="/sponsors/panel" variant="ghost" className="!py-2">
              Mi panel de marca
            </BtnLink>
            <BtnLink href="/sponsors/artista" variant="ghost" className="!py-2">
              Mi panel de artista
            </BtnLink>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Marcas" value={stats.brands} hint={`${stats.verifiedBrands} verificadas`} />
        <StatTile label="Propuestas" value={stats.opportunities} hint="abiertas ahora" tone="magenta" />
        <StatTile label="Participaciones" value={stats.participants} hint="en sorteos y desafíos" tone="cyan" />
        <StatTile
          label="Recaudado"
          value={`${stats.raised.toLocaleString('es-AR')}`}
          hint="aportes verificados"
          tone="orange"
        />
      </section>

      {/* OPORTUNIDADES */}
      <section className="mb-5">
        <SectionHeading
          title="EXPLORAR PATROCINIOS"
          subtitle="Convocatorias activas de marcas verificadas."
          action={
            <Link href="/sponsors/explorar" className="text-[11px] font-black uppercase tracking-wide text-acid hover:underline">
              Ver todas
            </Link>
          }
        />
        {opportunities.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-surface-border p-4 text-xs text-content-secondary">
            Todavía no hay convocatorias abiertas.
          </div>
        )}
      </section>

      {/* SORTEOS */}
      <section className="mb-5">
        <SectionHeading
          title="SORTEOS ACTIVOS"
          subtitle="Participá con un clic, un comentario o una respuesta."
          action={
            <Link href="/sponsors/sorteos" className="text-[11px] font-black uppercase tracking-wide text-acid hover:underline">
              Ver todos
            </Link>
          }
        />
        {sweepstakes.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {sweepstakes.map((sw) => (
              <SweepstakeCard key={sw.id} sweepstake={sw} />
            ))}
            <div className={`${sponsorCard} flex flex-col justify-center p-4`}>
              <Trophy className="h-6 w-6 text-acid" />
              <p className="mt-2 font-display text-lg font-black text-content-primary">¿Tenés una marca?</p>
              <p className="text-[11px] text-content-secondary">
                Regalá un premio y generá comunidad real con un sorteo auditable.
              </p>
              <Link href="/sponsors/publicar" className="mt-2 text-[11px] font-black uppercase tracking-wide text-acid hover:underline">
                Crear un sorteo →
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-surface-border p-4 text-xs text-content-secondary">
            Sin sorteos activos en este momento.
          </div>
        )}
      </section>

      {/* DESAFÍOS + CAMPAÑAS */}
      <section className="mb-5 grid gap-4 sm:grid-cols-2">
        <div>
          <SectionHeading title="LARVAZ CHALLENGES" icon={<Flame className="h-5 w-5 text-magenta" />} />
          <div className="space-y-3">
            {challenges.length ? (
              challenges.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)
            ) : (
              <p className="text-xs text-content-secondary">El próximo desafío lo puede lanzar tu marca.</p>
            )}
          </div>
        </div>
        <div>
          <SectionHeading title="APOYAR PROYECTOS" icon={<Heart className="h-5 w-5 text-cyan" />} />
          <div className="space-y-3">
            {campaigns.length ? (
              campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
            ) : (
              <p className="text-xs text-content-secondary">Todavía no hay campañas activas.</p>
            )}
          </div>
        </div>
      </section>

      {/* MARCAS */}
      <section className="mb-5">
        <SectionHeading
          title="MARCAS QUE BANCAN LA CULTURA"
          subtitle="Perfiles verificados por el equipo LARVAZ."
          action={
            <Link href="/sponsors/marcas" className="text-[11px] font-black uppercase tracking-wide text-acid hover:underline">
              Directorio
            </Link>
          }
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/sponsors/marca/${brand.slug}`}
              className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface p-3 hover:border-acid/30"
            >
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo_url} alt={brand.name} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-acid/15 text-acid">
                  <Crown className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-content-primary">{brand.name}</p>
                <p className="text-[10px] text-content-muted">
                  {brand.city}, {brand.country} · {brand.followers.length} seguidores
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-content-muted" />
            </Link>
          ))}
        </div>
      </section>

      {/* FEED DESTACADO */}
      {featuredPosts.length ? (
        <section className="mb-5">
          <SectionHeading title="DEL MURO SPONSOR" subtitle="Publicaciones de marcas integradas al feed principal." />
          <div className="space-y-2">
            {featuredPosts.map((post) => {
              const brand = store.getBrand(post.brand_id);
              return (
                <Link
                  key={post.id}
                  href={`/sponsors/marca/${brand?.slug || ''}`}
                  className="block rounded-xl border border-surface-border bg-surface p-3 hover:border-acid/30"
                >
                  <div className="flex items-center gap-1.5">
                    <SponsorBadge />
                    <span className="text-[10px] font-bold text-content-secondary">{brand?.name}</span>
                  </div>
                  <p className="mt-1 truncate font-display text-base font-black text-content-primary">{post.title}</p>
                  <p className="line-clamp-2 text-[11px] text-content-secondary">{post.body}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* CÓMO FUNCIONA */}
      <section className="mb-5">
        <SectionHeading title="CÓMO FUNCIONA" subtitle="Un circuito real, con reglas y trazabilidad." />
        <div className="grid gap-2 sm:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className={`${sponsorCard} flex items-start gap-2.5 p-3`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-acid/10 text-[11px] font-black text-acid">
                  {index + 1}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-black text-content-primary">
                    <Icon className="h-3.5 w-3.5 text-acid" /> {step.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-content-secondary">{step.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PUNTOS + CTA */}
      <section className={`${sponsorCard} p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <Zap className="h-5 w-5 text-acid" />
          <p className="font-display text-lg font-black text-content-primary">LARVAZ POINTS</p>
          <Pill tone="acid">Opcional</Pill>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-content-secondary">
          Sumá puntos por participar, completar desafíos, colaborar y apoyar proyectos. Los puntos no son dinero ni tienen
          valor monetario transferible: sirven para acceder a beneficios definidos por las marcas.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <BtnLink href="/sponsors/notificaciones" variant="secondary" className="!py-2">
            <Users className="h-3.5 w-3.5" /> Mis notificaciones
          </BtnLink>
          {actor && !actor.is_guest ? (
            <Pill tone="cyan">
              <Zap className="h-3 w-3" /> {store.getPointsFor(actor.id)} puntos
            </Pill>
          ) : null}
          <Link href="/sponsors/artista" className="text-[11px] font-black uppercase tracking-wide text-acid hover:underline">
            Historial de puntos →
          </Link>
        </div>
      </section>
    </div>
  );
}
