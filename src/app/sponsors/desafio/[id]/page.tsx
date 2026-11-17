'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ExternalLink,
  Flame,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Upload,
  Users,
  Vote,
  Zap,
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
  Modal,
  Notice,
  Pill,
  SectionHeading,
  Textarea,
  sponsorCard,
  SponsorBadge,
} from '@/components/sponsors/ui';
import { ImageInput } from '@/components/sponsors/forms';
import { artistCategoryLabel, formatDateTime, timeAgo } from '@/lib/sponsors/catalog';
import { UserAvatar } from '@/components/common/UserAvatar';

export default function ChallengeDetailPage() {
  const params = useParams();
  const id = String(params.id || '');
  const { state, store, actor, canManage } = useSponsors();
  const challenge = store.getChallenge(id);
  const brand = challenge ? store.getBrand(challenge.brand_id) : undefined;
  const owner = challenge ? canManage(challenge.brand_id) : false;

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [notice, setNotice] = useState<{ error?: string; success?: string }>({});

  if (!challenge) {
    return (
      <EmptyState
        icon={<Flame className="h-5 w-5" />}
        title="Desafío no encontrado"
        description="Este desafío no existe o fue retirado."
        action={<BtnLink href="/sponsors/desafios">Ver desafíos</BtnLink>}
      />
    );
  }

  const myEntry = actor ? challenge.entries.find((entry) => entry.user_id === actor.id) : undefined;
  const entries = [...challenge.entries].sort((a, b) => b.votes.length - a.votes.length);
  const openForEntries = challenge.status === 'abierto' && new Date(challenge.deadline).getTime() > Date.now();
  const winner = challenge.winner_entry_id ? challenge.entries.find((e) => e.id === challenge.winner_entry_id) : undefined;

  const submit = () => {
    const res = store.submitChallengeEntry(actor, challenge.id, { title, description, media_url: mediaUrl });
    if (!res.ok) {
      setNotice({ error: res.error || 'No se pudo presentar el trabajo.' });
      return;
    }
    setOpen(false);
    setTitle('');
    setDescription('');
    setMediaUrl(undefined);
    setNotice({ success: '¡Trabajo presentado! Ya está compitiendo.' });
  };

  const chooseWinner = (entryId: string) => {
    const justification = window.prompt('Justificación de la selección (obligatoria)') || '';
    if (!justification.trim()) return;
    const res = store.setChallengeWinner(actor, challenge.id, entryId, justification);
    setNotice(res.ok ? { success: 'Ganador definido y premio creado.' } : { error: res.error });
  };

  return (
    <div className="pb-10">
      <Link href="/sponsors/desafios" className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-content-secondary hover:text-content-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Todos los desafíos
      </Link>

      <Notice error={notice.error} success={notice.success} />

      <div className={`${sponsorCard} overflow-hidden`}>
        <div className="relative bg-gradient-to-br from-magenta/25 via-surface to-acid/10 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <SponsorBadge />
            <Pill tone="magenta">
              <Flame className="h-3 w-3" /> LARVAZ CHALLENGE
            </Pill>
            <Pill tone={challenge.status === 'abierto' ? 'acid' : 'neutral'}>{challenge.status}</Pill>
            <Pill tone="neutral">{artistCategoryLabel(challenge.discipline)}</Pill>
          </div>
          <h1 className="mt-2 font-display text-3xl font-black leading-tight text-content-primary">{challenge.title}</h1>
          <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-content-secondary">{challenge.description}</p>
          <Link href={brandHref(brand)} className="mt-2 inline-flex items-center gap-2">
            <BrandAvatar brand={brand} size={28} />
            <span className="flex items-center gap-1 text-xs font-bold text-content-primary">
              {brand?.name} {brand?.verification === 'verificada' ? <BadgeCheck className="h-3.5 w-3.5 text-acid" /> : null}
            </span>
          </Link>
        </div>

        <div className="grid gap-2 p-4 pt-0 sm:grid-cols-3">
          <div className={`${sponsorCard} p-2.5`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Cierre</p>
            <p className="text-xs font-bold text-content-primary">{formatDateTime(challenge.deadline)}</p>
            <Countdown dateIso={challenge.deadline} label="Cierra" />
          </div>
          <div className={`${sponsorCard} p-2.5`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Evaluación</p>
            <p className="text-xs font-bold text-content-primary">{challenge.judging_mode === 'jurado' ? 'Jurado' : 'Votación abierta'}</p>
            <p className="text-[10px] text-content-muted">{challenge.criteria.join(' · ')}</p>
          </div>
          <div className={`${sponsorCard} p-2.5`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Premio</p>
            <p className="text-[11px] text-content-primary">{challenge.prize_description}</p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <details className="rounded-lg border border-surface-border bg-surface-elevated/50 p-2">
            <summary className="cursor-pointer text-[11px] font-bold text-content-primary">Reglas del desafío</summary>
            <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-content-secondary">{challenge.rules}</p>
          </details>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Pill tone="neutral">
              <Users className="h-3 w-3" /> {challenge.entries.length} trabajos
            </Pill>
            <Pill tone="neutral">
              <Vote className="h-3 w-3" /> {challenge.entries.reduce((sum, e) => sum + e.votes.length, 0)} votos
            </Pill>
            {myEntry ? (
              <Pill tone="acid">
                <Check className="h-3 w-3" /> Ya presentaste tu trabajo
              </Pill>
            ) : openForEntries ? (
              <Btn onClick={() => setOpen(true)}>
                <Upload className="h-3.5 w-3.5" /> Presentar trabajo
              </Btn>
            ) : (
              <Pill tone="neutral">Convocatoria cerrada</Pill>
            )}
            {owner ? (
              <BtnLink href="/sponsors/panel?tab=sorteos" variant="secondary" className="!px-3 !py-2">
                <ShieldCheck className="h-3.5 w-3.5" /> Panel de la marca
              </BtnLink>
            ) : null}
          </div>
        </div>
      </div>

      {winner ? (
        <div className="mt-4 rounded-2xl border border-acid/30 bg-acid/10 p-3">
          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-acid">
            <Trophy className="h-3.5 w-3.5" /> Ganador del desafío
          </p>
          <p className="mt-1 font-display text-xl font-black text-content-primary">{winner.title}</p>
          <p className="text-xs text-content-secondary">
            @{winner.username} · {winner.votes.length} votos · premio: {challenge.prize_description}
          </p>
          {challenge.justification ? <p className="mt-1 text-[10px] text-content-muted">Justificación: {challenge.justification}</p> : null}
        </div>
      ) : null}

      <div className="mt-4">
        <SectionHeading title="TRABAJOS PRESENTADOS" subtitle="Ranking por votos de la comunidad." />
        {entries.length ? (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const voted = Boolean(actor && entry.votes.includes(actor.id));
              const canVote = challenge.judging_mode === 'votos' && challenge.status === 'abierto' && actor && !actor.is_guest && entry.user_id !== actor.id;
              return (
                <div key={entry.id} className={`${sponsorCard} p-3`}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated font-display text-sm font-black text-acid">
                      {index + 1}
                    </div>
                    <UserAvatar avatarUrl={entry.avatar_url} name={entry.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-content-primary">{entry.title}</p>
                      <p className="text-[10px] text-content-muted">
                        @{entry.username} · {timeAgo(entry.created_at)} · {entry.votes.length} votos
                      </p>
                      <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-content-secondary">{entry.description}</p>
                      {entry.media_url ? (
                        <a href={entry.media_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-cyan hover:underline">
                          <ExternalLink className="h-3 w-3" /> Ver trabajo
                        </a>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {canVote ? (
                        <Btn
                          variant={voted ? 'secondary' : 'primary'}
                          onClick={() => {
                            const res = store.voteChallengeEntry(actor, challenge.id, entry.id);
                            setNotice(res.ok ? { success: voted ? 'Voto retirado.' : 'Voto registrado.' } : { error: res.error });
                          }}
                          className="!px-2.5 !py-1.5 !text-[10px]"
                        >
                          <Star className={`h-3 w-3 ${voted ? 'fill-acid text-acid' : ''}`} /> {voted ? 'Votado' : 'Votar'}
                        </Btn>
                      ) : null}
                      {owner && challenge.status !== 'cerrado' ? (
                        <Btn variant="ghost" onClick={() => chooseWinner(entry.id)} className="!px-2 !py-1 !text-[10px]">
                          Elegir ganador
                        </Btn>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Sin trabajos todavía" description="Sé el primero en presentar tu arte." icon={<Zap className="h-5 w-5" />} />
        )}
      </div>

      <p className="mt-4 rounded-lg border border-surface-border bg-surface-elevated/50 p-2.5 text-[10px] leading-relaxed text-content-muted">
        <ShieldCheck className="mr-1 inline h-3 w-3 text-magenta" />
        Un trabajo por usuario. No se permiten votos duplicados ni votar el propio trabajo. El jurado deja justificación pública
        cuando elige al ganador.
      </p>

      <Modal open={open} onClose={() => setOpen(false)} title="Presentar mi trabajo">
        <Notice error={notice.error} />
        <div className="space-y-3">
          <Field label="Título" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Barras del sur" />
          </Field>
          <Field label="Descripción" required>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Enlace del trabajo" hint="Video, audio, foto o post público.">
            <Input value={mediaUrl || ''} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" />
          </Field>
          <ImageInput value={mediaUrl} onChange={setMediaUrl} label="O subí una imagen del trabajo" />
          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Btn>
            <Btn onClick={submit}>
              <Sparkles className="h-3.5 w-3.5" /> Presentar
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
