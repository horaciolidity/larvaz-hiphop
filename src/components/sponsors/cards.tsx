'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Coins,
  Flame,
  Globe2,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Zap,
  GraduationCap,
  Package,
} from 'lucide-react';
import type {
  SponsorApplication,
  SponsorBrand,
  SponsorCampaign,
  SponsorChallenge,
  SponsorPost,
  SponsorPrize,
  SponsorSweepstake,
  SponsorshipAgreement,
  SponsorshipOpportunity,
} from '@/types/sponsors';
import {
  AGREEMENT_STATUS_LABEL,
  APPLICATION_STATUS_LABEL,
  POST_KINDS,
  PRIZE_STATUS_LABEL,
  SWEEPSTAKE_STATUS_LABEL,
  artistCategoryLabel,
  emojiOf,
  formatDate,
  formatMoney,
  labelOf,
  timeAgo,
} from '@/lib/sponsors/catalog';
import { useSponsors } from '@/context/SponsorsContext';
import { brandHref } from '@/lib/sponsors/links';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  BrandAvatar,
  Btn,
  Countdown,
  Pill,
  ProgressBar,
  SponsorBadge,
  VerifiedBadge,
  prizeEmoji,
  sponsorCard,
} from './ui';

// ============================================================================
// Tarjetas del marketplace y del feed
// ============================================================================

export function BrandCard({ brand, compact }: { brand: SponsorBrand; compact?: boolean }) {
  const { actor, store } = useSponsors();
  const following = Boolean(actor && brand.followers.includes(actor.id));

  return (
    <div className={`${sponsorCard} p-3`}>
      <div className="flex items-start gap-3">
        <Link href={brandHref(brand)} className="shrink-0">
          <BrandAvatar brand={brand} size={compact ? 42 : 54} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={brandHref(brand)} className="truncate font-display text-lg font-black text-content-primary hover:text-acid">
              {brand.name}
            </Link>
            {brand.verification === 'verificada' ? <BadgeCheck className="h-4 w-4 text-acid" /> : null}
          </div>
          <p className="text-[11px] text-content-secondary">
            {labelOf(brand.category, [
              { id: 'indumentaria', label: 'Indumentaria urbana' },
              { id: 'calzado', label: 'Calzado' },
              { id: 'accesorios', label: 'Accesorios' },
              { id: 'tecnologia', label: 'Tecnología' },
              { id: 'musica', label: 'Música' },
              { id: 'audiovisual', label: 'Producción audiovisual' },
              { id: 'arte', label: 'Pinturas y materiales artísticos' },
              { id: 'deportes', label: 'Deportes y skate' },
              { id: 'bebidas', label: 'Bebidas y alimentación' },
              { id: 'eventos', label: 'Eventos' },
              { id: 'servicios', label: 'Servicios' },
              { id: 'otros', label: 'Otros' },
            ] as any)}{' '}
            · {brand.city}, {brand.country}
          </p>
          {!compact ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-content-secondary">{brand.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Pill tone="neutral">
              <Users className="h-3 w-3" /> {brand.followers.length}
            </Pill>
            {brand.reputation.reviews > 0 ? (
              <Pill tone="acid">★ {brand.reputation.score.toFixed(1)} ({brand.reputation.reviews})</Pill>
            ) : (
              <Pill tone="neutral">Sin reseñas</Pill>
            )}
            {brand.seeking_categories.slice(0, 2).map((cat) => (
              <Pill key={cat} tone="cyan">
                {artistCategoryLabel(cat)}
              </Pill>
            ))}
          </div>
        </div>
      </div>
      {!compact ? (
        <div className="mt-3 flex gap-2">
          <Link
            href={`${brandHref(brand)}?tab=oportunidades`}
            className="flex-1 rounded-lg bg-acid px-3 py-2 text-center text-[11px] font-black uppercase tracking-wide text-background hover:bg-acid-hover"
          >
            Ver propuestas
          </Link>
          <button
            type="button"
            onClick={() => store.toggleFollowBrand(actor, brand.id)}
            className={`rounded-lg border px-3 py-2 text-[11px] font-black uppercase tracking-wide transition ${
              following ? 'border-acid/40 text-acid' : 'border-surface-border text-content-secondary hover:text-content-primary'
            }`}
          >
            {following ? 'Siguiendo' : 'Seguir'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function OpportunityCard({ opportunity }: { opportunity: SponsorshipOpportunity }) {
  const { store } = useSponsors();
  const brand = store.getBrand(opportunity.brand_id);
  const closed = opportunity.status !== 'abierta' || new Date(opportunity.deadline).getTime() <= Date.now();

  return (
    <article className={`${sponsorCard} flex flex-col`}>
      {opportunity.image_url ? (
        <Link href={`/sponsors/oportunidad/${opportunity.id}`} className="relative block h-36 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={opportunity.image_url} alt={opportunity.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            <SponsorBadge />
            <Pill tone="neutral">{labelOf(opportunity.offer.type, [
              { id: 'economico', label: 'Económico' },
              { id: 'productos', label: 'Productos' },
              { id: 'logistico', label: 'Logístico' },
              { id: 'mixto', label: 'Mixto' },
              { id: 'cripto', label: 'Cripto' },
            ] as any)}</Pill>
          </div>
        </Link>
      ) : null}

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center gap-2">
          <Link href={brandHref(brand)}>
            <BrandAvatar brand={brand} size={28} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={brandHref(brand)} className="block truncate text-[11px] font-bold text-content-primary hover:text-acid">
              {brand?.name || 'Marca'}
            </Link>
            <p className="text-[10px] text-content-muted">
              {opportunity.city}, {opportunity.country}
              {opportunity.is_remote ? ' · Remoto' : ''}
            </p>
          </div>
          <VerifiedBadge brand={brand} />
        </div>

        <Link href={`/sponsors/oportunidad/${opportunity.id}`} className="mt-2 block">
          <h3 className="line-clamp-2 font-display text-lg font-black leading-tight text-content-primary hover:text-acid">
            {opportunity.title}
          </h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-content-secondary">{opportunity.description}</p>

        <div className="mt-2 rounded-lg border border-acid/20 bg-acid/5 p-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-acid">Beneficio</p>
          <p className="line-clamp-2 text-[11px] text-content-primary">{opportunity.offer.summary}</p>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {opportunity.artist_categories.map((cat) => (
            <Pill key={cat} tone="magenta">
              {emojiOf(cat, [
                { id: 'mc', label: 'MC', emoji: '🎤' },
                { id: 'bboy', label: 'B-Boy', emoji: '🤸' },
                { id: 'dj', label: 'DJ', emoji: '🎚️' },
                { id: 'graffiti', label: 'Grafiti', emoji: '🎨' },
                { id: 'bailarin', label: 'Baile', emoji: '💃' },
                { id: 'productor', label: 'Prod.', emoji: '🎛️' },
                { id: 'fotografo', label: 'Foto', emoji: '📸' },
                { id: 'crew', label: 'Crew', emoji: '👥' },
                { id: 'skate', label: 'Skate', emoji: '🛹' },
                { id: 'otros', label: 'Otros', emoji: '⭐' },
              ] as any)}{' '}
              {artistCategoryLabel(cat)}
            </Pill>
          ))}
        </div>

        <div className="mt-auto pt-2">
          <div className="mb-2 flex items-center justify-between text-[10px] text-content-secondary">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {formatDate(opportunity.deadline)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> {opportunity.applications_count}/{opportunity.slots}
            </span>
          </div>
          {closed ? (
            <div className="rounded-lg border border-surface-border px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-content-muted">
              Convocatoria cerrada
            </div>
          ) : (
            <Link
              href={`/sponsors/oportunidad/${opportunity.id}`}
              className="flex items-center justify-center gap-1 rounded-lg bg-magenta px-3 py-2 text-[11px] font-black uppercase tracking-wide text-white hover:bg-magenta-hover"
            >
              Postularme <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function SponsorPostCard({ post }: { post: SponsorPost }) {
  const { actor, store } = useSponsors();
  const brand = store.getBrand(post.brand_id);
  const sweepstake = store.getSweepstake(post.sweepstake_id);
  const challenge = store.getChallenge(post.challenge_id);
  const campaign = store.getCampaign(post.campaign_id);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const liked = Boolean(actor && post.likes.includes(actor.id));

  const kind = POST_KINDS.find((k) => k.id === post.kind);

  const handleLike = () => {
    const res = store.toggleSponsorPostLike(post.id, actor);
    if (!res.ok) setError(res.error || 'No se pudo reaccionar.');
    else setError(null);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    const res = store.addSponsorComment(post.id, actor, comment);
    if (!res.ok) {
      setError(res.error || 'No se pudo comentar.');
      return;
    }
    setComment('');
    setError(null);
  };

  const handleShare = async () => {
    store.shareSponsorPost(post.id);
    try {
      const url = `${window.location.origin}/sponsors/marca/${brand?.slug || ''}`;
      if (navigator.share) await navigator.share({ title: post.title, text: post.body.slice(0, 90), url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* el usuario canceló */
    }
  };

  return (
    <article className={`${sponsorCard} mb-3 border-acid/20`}>
      <div className="flex items-start gap-2.5 p-3">
        <Link href={brandHref(brand)} className="shrink-0">
          <BrandAvatar brand={brand} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={brandHref(brand)} className="truncate text-sm font-black text-content-primary hover:text-acid">
              {brand?.name || 'Marca LARVAZ'}
            </Link>
            {brand?.verification === 'verificada' ? <BadgeCheck className="h-3.5 w-3.5 text-acid" /> : null}
            <SponsorBadge />
          </div>
          <p className="text-[10px] text-content-muted">
            {kind?.label || 'Publicación'} · {timeAgo(post.created_at)}
          </p>
        </div>
      </div>

      <div className="px-3 pb-2">
        <h3 className="font-display text-lg font-black leading-tight text-content-primary">{post.title}</h3>
        <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-content-secondary">{post.body}</p>
        {post.tags.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.tags.map((tag) => (
              <span key={tag} className="text-[11px] font-bold text-acid">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {post.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image_url} alt={post.title} className="max-h-[420px] w-full object-cover" />
      ) : null}

      {post.gallery.length ? (
        <div className="grid grid-cols-2 gap-0.5">
          {post.gallery.slice(0, 4).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={post.title} className="h-32 w-full object-cover" />
          ))}
        </div>
      ) : null}

      {sweepstake ? (
        <Link
          href={`/sponsors/sorteo/${sweepstake.id}`}
          className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-acid/30 bg-acid/10 p-2.5 transition hover:bg-acid/15"
        >
          <Trophy className="h-5 w-5 shrink-0 text-acid" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-acid">Sorteo activo</p>
            <p className="truncate text-xs font-bold text-content-primary">{sweepstake.title}</p>
          </div>
          <Countdown dateIso={sweepstake.ends_at} label="Cierra" />
          <ArrowRight className="h-4 w-4 text-acid" />
        </Link>
      ) : null}

      {challenge ? (
        <Link
          href={`/sponsors/desafio/${challenge.id}`}
          className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-magenta/30 bg-magenta/10 p-2.5 transition hover:bg-magenta/15"
        >
          <Flame className="h-5 w-5 shrink-0 text-magenta" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-magenta">LARVAZ CHALLENGE</p>
            <p className="truncate text-xs font-bold text-content-primary">{challenge.title}</p>
          </div>
          <Pill tone="magenta">{challenge.entries.length} trabajos</Pill>
        </Link>
      ) : null}

      {campaign ? (
        <Link
          href={`/sponsors/campana/${campaign.id}`}
          className="mx-3 mt-3 block rounded-xl border border-cyan/30 bg-cyan/10 p-2.5 transition hover:bg-cyan/15"
        >
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-cyan" />
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan">Apoyar este proyecto</p>
          </div>
          <p className="mt-1 truncate text-xs font-bold text-content-primary">{campaign.title}</p>
          <div className="mt-2">
            <ProgressBar value={campaign.raised_amount} goal={campaign.goal_amount} currency={campaign.currency} />
          </div>
        </Link>
      ) : null}

      {post.link_url ? (
        <a
          href={post.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-xs text-cyan hover:underline"
        >
          <Globe2 className="h-3.5 w-3.5" /> {post.link_url}
        </a>
      ) : null}

      <div className="flex items-center gap-1 border-t border-surface-border/70 px-2 py-1.5">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
            liked ? 'text-magenta' : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-magenta' : ''}`} /> {post.likes.length}
        </button>
        <span className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-content-secondary">
          <MessageCircle className="h-4 w-4" /> {post.comments.length}
        </span>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-content-secondary transition hover:text-content-primary"
        >
          <Share2 className="h-4 w-4" /> {post.shares}
          {copied ? <span className="text-[9px] text-acid">¡Copiado!</span> : null}
        </button>
        <span className="ml-auto pr-1 text-[10px] font-bold uppercase tracking-wider text-acid/70">LARVAZ SPONSORS</span>
      </div>

      {error ? <p className="border-t border-surface-border/70 px-3 py-2 text-[11px] text-red-400">{error}</p> : null}

      {post.comments.length ? (
        <div className="space-y-2 border-t border-surface-border/70 px-3 py-2">
          {post.comments.slice(-3).map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <UserAvatar avatarUrl={c.avatar_url} name={c.full_name} size="xs" />
              <div className="min-w-0 flex-1 rounded-lg bg-surface-elevated/70 px-2.5 py-1.5">
                <p className="text-[11px] font-bold text-content-primary">{c.full_name}</p>
                <p className="text-[11px] leading-snug text-content-secondary">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <form onSubmit={handleComment} className="flex items-center gap-2 border-t border-surface-border/70 px-3 py-2">
        <UserAvatar avatarUrl={actor?.avatar_url} name={actor?.full_name || 'Vos'} size="xs" />
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comentá la publicación de la marca…"
          maxLength={600}
          className="min-w-0 flex-1 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-[11px] text-content-primary outline-none placeholder:text-content-muted focus:border-acid/50"
        />
        <button
          type="submit"
          disabled={!comment.trim()}
          className="rounded-lg bg-acid p-1.5 text-background disabled:opacity-40"
          aria-label="Comentar"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </article>
  );
}

export function SweepstakeCard({ sweepstake }: { sweepstake: SponsorSweepstake }) {
  const { store } = useSponsors();
  const brand = store.getBrand(sweepstake.brand_id);
  const participants = store.getParticipations(sweepstake.id).filter((p) => p.valid).length;
  const active = sweepstake.status === 'activo';

  return (
    <article className={`${sponsorCard} p-3`}>
      <div className="flex items-center gap-2">
        <BrandAvatar brand={brand} size={26} />
        <Link href={brandHref(brand)} className="min-w-0 flex-1 truncate text-[11px] font-bold text-content-primary hover:text-acid">
          {brand?.name || 'Marca'}
        </Link>
        <Pill tone={active ? 'acid' : sweepstake.status === 'sorteado' ? 'cyan' : 'neutral'}>
          {SWEEPSTAKE_STATUS_LABEL[sweepstake.status]}
        </Pill>
      </div>
      <Link href={`/sponsors/sorteo/${sweepstake.id}`} className="mt-2 block">
        {sweepstake.prize_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sweepstake.prize_image_url} alt={sweepstake.title} className="mb-2 h-32 w-full rounded-lg object-cover" />
        ) : null}
        <h3 className="line-clamp-2 font-display text-base font-black leading-tight text-content-primary hover:text-acid">
          {sweepstake.title}
        </h3>
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Pill tone="cyan">
          <Trophy className="h-3 w-3" /> {formatMoney(sweepstake.prize_value, sweepstake.currency)}
        </Pill>
        <Pill tone="neutral">
          <Users className="h-3 w-3" /> {participants}
        </Pill>
        <Pill tone="neutral">{sweepstake.winners_count} ganador(es)</Pill>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Countdown dateIso={sweepstake.ends_at} label="Cierra" />
        <Link href={`/sponsors/sorteo/${sweepstake.id}`} className="text-[11px] font-black uppercase tracking-wide text-acid hover:underline">
          Participar →
        </Link>
      </div>
    </article>
  );
}

export function ChallengeCard({ challenge }: { challenge: SponsorChallenge }) {
  const { store } = useSponsors();
  const brand = store.getBrand(challenge.brand_id);
  const entries = [...challenge.entries].sort((a, b) => b.votes.length - a.votes.length);
  return (
    <article className={`${sponsorCard} p-3`}>
      <div className="flex items-center gap-2">
        <BrandAvatar brand={brand} size={26} />
        <Link href={brandHref(brand)} className="min-w-0 flex-1 truncate text-[11px] font-bold text-content-primary hover:text-acid">
          {brand?.name || 'Marca'}
        </Link>
        <Pill tone="magenta">
          <Flame className="h-3 w-3" /> Challenge
        </Pill>
      </div>
      <Link href={`/sponsors/desafio/${challenge.id}`} className="mt-2 block">
        <h3 className="line-clamp-2 font-display text-base font-black leading-tight text-content-primary hover:text-acid">
          {challenge.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] text-content-secondary">{challenge.description}</p>
      </Link>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Pill tone="neutral">
          <Zap className="h-3 w-3" /> {artistCategoryLabel(challenge.discipline)}
        </Pill>
        <Pill tone="neutral">
          <Users className="h-3 w-3" /> {challenge.entries.length} trabajos
        </Pill>
        {challenge.judging_mode === 'jurado' ? <Pill tone="cyan">Jurado</Pill> : <Pill tone="cyan">Votación abierta</Pill>}
      </div>
      {entries.length ? (
        <div className="mt-2 rounded-lg border border-surface-border bg-surface-elevated/60 p-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Ranking</p>
          {entries.slice(0, 3).map((entry, index) => (
            <p key={entry.id} className="mt-0.5 truncate text-[11px] text-content-primary">
              {index + 1}. {entry.title} · {entry.votes.length} votos
            </p>
          ))}
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between">
        <Countdown dateIso={challenge.deadline} label="Cierra" />
        <Link href={`/sponsors/desafio/${challenge.id}`} className="text-[11px] font-black uppercase tracking-wide text-magenta hover:underline">
          Ver desafío →
        </Link>
      </div>
    </article>
  );
}

export function CampaignCard({ campaign }: { campaign: SponsorCampaign }) {
  const { store } = useSponsors();
  const brand = campaign.brand_id ? store.getBrand(campaign.brand_id) : undefined;
  return (
    <article className={`${sponsorCard} p-3`}>
      <div className="flex items-center gap-2">
        {brand ? <BrandAvatar brand={brand} size={26} /> : <Pill tone="cyan">Proyecto</Pill>}
        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-content-primary">{brand?.name || campaign.beneficiary}</span>
        <Pill tone={campaign.status === 'activa' ? 'acid' : 'neutral'}>{campaign.status}</Pill>
      </div>
      <Link href={`/sponsors/campana/${campaign.id}`} className="mt-2 block">
        {campaign.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={campaign.image_url} alt={campaign.title} className="mb-2 h-32 w-full rounded-lg object-cover" />
        ) : null}
        <h3 className="line-clamp-2 font-display text-base font-black leading-tight text-content-primary hover:text-acid">
          {campaign.title}
        </h3>
      </Link>
      <div className="mt-2">
        <ProgressBar value={campaign.raised_amount} goal={campaign.goal_amount} currency={campaign.currency} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-content-secondary">
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3 w-3 text-cyan" /> {campaign.donors_count} donantes
        </span>
        <Countdown dateIso={campaign.closes_at} label="Cierra" />
      </div>
    </article>
  );
}

export function PrizeCard({
  prize,
  onConfirm,
  showWinner = true,
}: {
  prize: SponsorPrize;
  onConfirm?: () => void;
  showWinner?: boolean;
}) {
  const { store } = useSponsors();
  const brand = store.getBrand(prize.brand_id);
  const confirmed = prize.status === 'confirmado';
  return (
    <div className={`${sponsorCard} p-3`}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-acid/10 text-lg">
          {prizeEmoji(prize.kind)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
            Puesto {prize.position} · {brand?.name || 'LARVAZ'}
          </p>
          <p className="truncate font-display text-base font-black text-content-primary">{prize.title}</p>
          {showWinner && prize.winner_username ? (
            <p className="text-[11px] text-content-secondary">Ganador: {prize.winner_username}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Pill tone={confirmed ? 'success' : prize.status === 'incidencia' ? 'danger' : 'neutral'}>
              {PRIZE_STATUS_LABEL[prize.status]}
            </Pill>
            {prize.estimated_value ? (
              <Pill tone="cyan">
                <Coins className="h-3 w-3" /> {formatMoney(prize.estimated_value, prize.currency)}
              </Pill>
            ) : null}
          </div>
        </div>
        {onConfirm && !confirmed ? (
          <Btn variant="secondary" onClick={onConfirm} className="!px-2.5 !py-1.5 !text-[10px]">
            Confirmar recepción
          </Btn>
        ) : null}
      </div>
      {prize.delivery.length ? (
        <div className="mt-2 space-y-1 border-t border-surface-border/70 pt-2">
          {prize.delivery.slice(-3).map((event, index) => (
            <p key={`${event.at}-${index}`} className="text-[10px] text-content-muted">
              <span className="font-bold text-content-secondary">{PRIZE_STATUS_LABEL[event.status]}</span> · {formatDate(event.at)}
              {event.note ? ` — ${event.note}` : ''}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ApplicationCard({
  application,
  actions,
}: {
  application: SponsorApplication;
  actions?: React.ReactNode;
}) {
  return (
    <div className={`${sponsorCard} p-3`}>
      <div className="flex items-start gap-2.5">
        <UserAvatar avatarUrl={application.artist_avatar} name={application.artist_name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/artista/${application.artist_username}`} className="truncate text-sm font-black text-content-primary hover:text-acid">
              {application.artist_name}
            </Link>
            <Pill tone={application.status === 'aceptada' ? 'success' : application.status === 'oferta' ? 'acid' : 'neutral'}>
              {APPLICATION_STATUS_LABEL[application.status]}
            </Pill>
          </div>
          <p className="text-[10px] text-content-muted">
            @{application.artist_username} · {timeAgo(application.created_at)}
          </p>
          <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-content-secondary">{application.message}</p>
          {application.experience ? (
            <p className="mt-1 text-[10px] text-content-muted">
              <span className="font-bold text-content-secondary">Experiencia:</span> {application.experience}
            </p>
          ) : null}
          {application.offer ? (
            <p className="mt-1 rounded-lg border border-acid/20 bg-acid/5 px-2 py-1 text-[11px] text-acid">
              Oferta: {application.offer.note}
              {application.offer.amount ? ` · ${formatMoney(application.offer.amount, application.offer.currency)}` : ''}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {application.portfolio_url ? (
              <a href={application.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-cyan hover:underline">
                Portfolio
              </a>
            ) : null}
            {application.social_links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-cyan hover:underline">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      {actions ? <div className="mt-3 flex flex-wrap gap-1.5 border-t border-surface-border/70 pt-2">{actions}</div> : null}
    </div>
  );
}

export function AgreementCard({
  agreement,
  actions,
  expanded = false,
}: {
  agreement: SponsorshipAgreement;
  actions?: React.ReactNode;
  expanded?: boolean;
}) {
  const [open, setOpen] = React.useState(expanded);
  const approved = agreement.counterparts.filter((c) => c.status === 'aprobado' || c.status === 'entregado').length;
  const pct = agreement.counterparts.length ? Math.round((approved / agreement.counterparts.length) * 100) : 0;
  return (
    <div className={`${sponsorCard} p-3`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="min-w-0 flex-1 truncate font-display text-base font-black text-content-primary">{agreement.title}</p>
        <Pill tone={agreement.status === 'completado' ? 'success' : agreement.status === 'disputa' ? 'danger' : 'acid'}>
          {AGREEMENT_STATUS_LABEL[agreement.status]}
        </Pill>
      </div>
      <p className="mt-0.5 text-[10px] text-content-muted">
        {formatDate(agreement.start_date)} → {formatDate(agreement.end_date)} · {agreement.artist_name}
      </p>
      <p className="mt-1 text-[11px] text-content-secondary">{agreement.benefits}</p>
      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[10px] text-content-muted">
          <span>Entregables aprobados</span>
          <span>
            {approved}/{agreement.counterparts.length} ({pct}%)
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
          <div className="h-full rounded-full bg-acid" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 text-[10px] font-bold uppercase tracking-wider text-acid">
        {open ? 'Ocultar entregables' : 'Ver entregables'}
      </button>
      {open ? (
        <div className="mt-2 space-y-1.5">
          {agreement.counterparts.map((cp) => (
            <div key={cp.id} className="rounded-lg border border-surface-border bg-surface-elevated/60 p-2">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-[11px] font-semibold text-content-primary">{cp.description}</p>
                <Pill tone={cp.status === 'aprobado' ? 'success' : cp.status === 'rechazado' ? 'danger' : 'neutral'}>{cp.status}</Pill>
              </div>
              <p className="text-[10px] text-content-muted">
                Cantidad {cp.quantity}
                {cp.platform ? ` · ${cp.platform}` : ''}
                {cp.due_date ? ` · vence ${formatDate(cp.due_date)}` : ''}
                {cp.evidence_required ? ` · evidencia: ${cp.evidence_required}` : ''}
              </p>
              {cp.evidence_url ? (
                <a href={cp.evidence_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-cyan hover:underline">
                  Ver evidencia
                </a>
              ) : null}
            </div>
          ))}
          {agreement.terms ? <p className="text-[10px] leading-relaxed text-content-muted">Condiciones: {agreement.terms}</p> : null}
        </div>
      ) : null}
      {actions ? <div className="mt-2 flex flex-wrap gap-1.5 border-t border-surface-border/70 pt-2">{actions}</div> : null}
    </div>
  );
}

export function PrizeGallery({ prizes }: { prizes: SponsorPrize[] }) {
  if (!prizes.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {prizes.map((prize) => (
        <PrizeCard key={prize.id} prize={prize} />
      ))}
    </div>
  );
}

export function MinorBadges() {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Pill tone="acid">
        <Sparkles className="h-3 w-3" /> Oportunidades reales
      </Pill>
      <Pill tone="cyan">
        <GraduationCap className="h-3 w-3" /> Becas y formación
      </Pill>
      <Pill tone="magenta">
        <Package className="h-3 w-3" /> Premios verificados
      </Pill>
    </div>
  );
}
