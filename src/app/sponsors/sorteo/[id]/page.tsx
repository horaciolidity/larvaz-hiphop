'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  Coins,
  Gift,
  Heart,
  Info,
  ShieldCheck,
  Sparkles,
  Trophy,
  Truck,
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
  SectionHeading,
  Textarea,
  sponsorCard,
  SponsorBadge,
} from '@/components/sponsors/ui';
import {
  SWEEPSTAKE_METHODS,
  SWEEPSTAKE_STATUS_LABEL,
  artistCategoryLabel,
  formatDateTime,
  formatMoney,
  timeAgo,
} from '@/lib/sponsors/catalog';

export default function SweepstakeDetailPage() {
  const params = useParams();
  const id = String(params.id || '');
  const { state, store, actor, canManage } = useSponsors();
  const sweepstake = store.getSweepstake(id);
  const brand = sweepstake ? store.getBrand(sweepstake.brand_id) : undefined;
  const owner = sweepstake ? canManage(sweepstake.brand_id) : false;

  const [comment, setComment] = useState('');
  const [guess, setGuess] = useState('');
  const [notice, setNotice] = useState<{ error?: string; success?: string }>({});
  const [busy, setBusy] = useState(false);

  const post = sweepstake ? store.getPost(sweepstake.post_id) : undefined;
  const myParticipation = sweepstake && actor ? state.participations.find((p) => p.sweepstake_id === sweepstake.id && p.user_id === actor.id) : undefined;
  const validParticipations = useMemo(
    () => (sweepstake ? state.participations.filter((p) => p.sweepstake_id === sweepstake.id && p.valid) : []),
    [state.participations, sweepstake]
  );
  const prizes = useMemo(
    () => (sweepstake ? state.prizes.filter((p) => p.sweepstake_id === sweepstake.id) : []),
    [state.prizes, sweepstake]
  );
  const liked = Boolean(actor && post?.likes.includes(actor.id));

  if (!sweepstake) {
    return (
      <EmptyState
        icon={<Trophy className="h-5 w-5" />}
        title="Sorteo no encontrado"
        description="El sorteo que buscás no existe o fue retirado."
        action={<BtnLink href="/sponsors/sorteos">Ver sorteos</BtnLink>}
      />
    );
  }

  const method = SWEEPSTAKE_METHODS.find((m) => m.id === sweepstake.method);
  const needsLike = sweepstake.method === 'likes' || sweepstake.likes_required;
  const active = sweepstake.status === 'activo';

  const participate = async () => {
    setBusy(true);
    setNotice({});
    try {
      if (needsLike && !liked) {
        setNotice({ error: 'Primero tenés que darle like a la publicación del sorteo.' });
        return;
      }
      const res = store.participateSweepstake(actor, sweepstake.id, {
        comment_text: comment,
        guess,
      });
      if (!res.ok) {
        setNotice({ error: res.error || 'No se pudo registrar la participación.' });
        return;
      }
      setNotice({ success: '¡Participación registrada! Mucha suerte.' });
      setComment('');
      setGuess('');
    } finally {
      setBusy(false);
    }
  };

  const like = () => {
    const res = store.toggleSponsorPostLike(sweepstake.post_id, actor);
    if (!res.ok) setNotice({ error: res.error || 'No se pudo dar like.' });
    else setNotice({ success: res.data?.liked ? 'Like registrado. Ya podés participar.' : 'Like retirado.' });
  };

  const draw = () => {
    const res = store.drawSweepstake(actor, sweepstake.id);
    setNotice(res.ok ? { success: 'Sorteo realizado y auditado. Los ganadores ya fueron notificados.' } : { error: res.error });
  };

  const pickWinner = (participationId: string) => {
    const justification = window.prompt('Justificación de la selección (obligatoria)') || '';
    if (!justification.trim()) return;
    const res = store.pickBestComment(actor, sweepstake.id, participationId, justification);
    setNotice(res.ok ? { success: 'Ganador registrado con justificación.' } : { error: res.error });
  };

  const commentRule = sweepstake.comment_rule;
  const isCommentMethod = sweepstake.method === 'comentarios' || sweepstake.method === 'mejor_comentario';

  return (
    <div className="pb-10">
      <Link href="/sponsors/sorteos" className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-content-secondary hover:text-content-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Todos los sorteos
      </Link>

      <Notice error={notice.error} success={notice.success} />

      <div className={`${sponsorCard} overflow-hidden`}>
        {sweepstake.prize_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sweepstake.prize_image_url} alt={sweepstake.title} className="h-44 w-full object-cover sm:h-60" />
        ) : null}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <SponsorBadge />
            <Pill tone={active ? 'acid' : sweepstake.status === 'sorteado' ? 'cyan' : 'neutral'}>
              {SWEEPSTAKE_STATUS_LABEL[sweepstake.status]}
            </Pill>
            <Pill tone="neutral">
              <Trophy className="h-3 w-3" /> {formatMoney(sweepstake.prize_value, sweepstake.currency)}
            </Pill>
            <Pill tone="neutral">
              <Users className="h-3 w-3" /> {validParticipations.length} participaciones
            </Pill>
            <Pill tone="neutral">{sweepstake.winners_count} ganador(es)</Pill>
          </div>

          <h1 className="mt-2 font-display text-3xl font-black leading-tight text-content-primary">{sweepstake.title}</h1>
          <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-content-secondary">{sweepstake.description}</p>

          <Link href={brandHref(brand)} className="mt-3 inline-flex items-center gap-2">
            <BrandAvatar brand={brand} size={30} />
            <span className="flex items-center gap-1 text-xs font-bold text-content-primary">
              {brand?.name} {brand?.verification === 'verificada' ? <BadgeCheck className="h-3.5 w-3.5 text-acid" /> : null}
            </span>
          </Link>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className={`${sponsorCard} p-2.5`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Cierre</p>
              <p className="text-xs font-bold text-content-primary">{formatDateTime(sweepstake.ends_at)}</p>
              <Countdown dateIso={sweepstake.ends_at} label="Cierra" />
            </div>
            <div className={`${sponsorCard} p-2.5`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Selección</p>
              <p className="text-xs font-bold text-content-primary">{formatDateTime(sweepstake.draw_at)}</p>
              <p className="text-[10px] text-content-muted">{method?.label}</p>
            </div>
            <div className={`${sponsorCard} p-2.5`}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">Entrega</p>
              <p className="text-[11px] text-content-primary">{sweepstake.delivery_method}</p>
            </div>
          </div>

          {sweepstake.countries.length ? (
            <p className="mt-2 text-[10px] text-content-muted">
              <Info className="mr-1 inline h-3 w-3" /> Habilitado para: {sweepstake.countries.join(', ')}
            </p>
          ) : null}

          {/* Participación */}
          <div className="mt-4 rounded-xl border border-acid/25 bg-acid/5 p-3">
            {myParticipation ? (
              <div className="flex flex-wrap items-center gap-2">
                <Check className="h-5 w-5 text-acid" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-content-primary">Ya estás participando</p>
                  <p className="text-[11px] text-content-secondary">
                    Registrado {timeAgo(myParticipation.created_at)} · {myParticipation.valid ? 'Participación válida' : 'Intento no válido'}
                  </p>
                </div>
                <Pill tone="acid">Confirmado</Pill>
              </div>
            ) : !active ? (
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-content-muted" />
                <div>
                  <p className="text-sm font-black text-content-primary">Participaciones cerradas</p>
                  <p className="text-[11px] text-content-secondary">
                    {sweepstake.status === 'sorteado'
                      ? 'El sorteo ya se realizó. Mirá los ganadores abajo.'
                      : 'Este sorteo no está recibiendo participaciones.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-black text-content-primary">
                    <Sparkles className="h-4 w-4 text-acid" /> {method?.label}
                  </p>
                  {needsLike ? (
                    <button
                      type="button"
                      onClick={like}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${
                        liked ? 'border-magenta/40 bg-magenta/10 text-magenta' : 'border-surface-border text-content-secondary'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-magenta' : ''}`} /> {liked ? 'Like dado' : 'Dar like (obligatorio)'}
                    </button>
                  ) : null}
                </div>

                {isCommentMethod ? (
                  <div className="space-y-2">
                    <Field
                      label={
                        sweepstake.method === 'mejor_comentario'
                          ? 'Tu comentario creativo'
                          : commentRule?.mode === 'palabra'
                            ? `Comentario con la palabra "${commentRule.required_word}"`
                            : commentRule?.mode === 'pregunta' || commentRule?.mode === 'adivinanza'
                              ? commentRule.question || 'Respondé la consigna'
                              : 'Tu comentario'
                      }
                    >
                      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={600} />
                    </Field>
                    <Btn onClick={participate} loading={busy}>
                      Publicar comentario y participar
                    </Btn>
                  </div>
                ) : sweepstake.method === 'numeros' ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-content-secondary">
                      Elegí un número entre {sweepstake.number_rule?.min} y {sweepstake.number_rule?.max}. El número secreto se
                      revela al finalizar.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        min={sweepstake.number_rule?.min}
                        max={sweepstake.number_rule?.max}
                        className="max-w-[160px]"
                      />
                      <Btn onClick={participate} loading={busy}>
                        Enviar número
                      </Btn>
                    </div>
                  </div>
                ) : sweepstake.method === 'palabras' ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-content-secondary">Adiviná la palabra o frase secreta.</p>
                    {sweepstake.word_rule?.hints?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {sweepstake.word_rule.hints.map((hint) => (
                          <Pill key={hint} tone="cyan">
                            {hint}
                          </Pill>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Input value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Tu respuesta" />
                      <Btn onClick={participate} loading={busy}>
                        Enviar respuesta
                      </Btn>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-[11px] text-content-secondary">
                      {sweepstake.method === 'likes'
                        ? 'El like es tu participación. Si ya diste like, tocá PARTICIPAR para registrar tu lugar.'
                        : 'Un clic, un registro. Sin duplicados por usuario.'}
                    </p>
                    <Btn onClick={participate} loading={busy} className="!px-6 !py-3">
                      <Trophy className="h-4 w-4" /> PARTICIPAR AHORA
                    </Btn>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Requisitos */}
          {sweepstake.requirements.length ? (
            <div className="mt-3">
              <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">Requisitos</p>
              <ul className="space-y-0.5">
                {sweepstake.requirements.map((req) => (
                  <li key={req} className="flex items-start gap-1 text-[11px] text-content-secondary">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-acid" /> {req}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <details className="mt-3 rounded-lg border border-surface-border bg-surface-elevated/50 p-2">
            <summary className="cursor-pointer text-[11px] font-bold text-content-primary">Bases y condiciones</summary>
            <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-content-secondary">{sweepstake.rules}</p>
            <p className="mt-1 text-[10px] text-content-muted">
              Las reglas quedan bloqueadas al iniciar el sorteo. La selección usa una semilla criptográfica pública y un hash de
              auditoría verificable.
            </p>
          </details>

          {/* Premios */}
          {prizes.length ? (
            <div className="mt-3">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-content-secondary">
                <Gift className="h-3 w-3" /> Premios
              </p>
              <div className="space-y-1">
                {prizes.map((prize) => (
                  <div key={prize.id} className="flex items-center gap-2 rounded-lg border border-surface-border p-2">
                    <Pill tone="acid">#{prize.position}</Pill>
                    <p className="min-w-0 flex-1 truncate text-[11px] text-content-primary">{prize.title}</p>
                    <Pill tone="neutral">{prize.status}</Pill>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Owner */}
          {owner ? (
            <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-cyan/25 bg-cyan/5 p-3">
              <div className="flex w-full items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan" />
                <p className="text-[11px] font-black uppercase tracking-wider text-cyan">Controles de la marca</p>
              </div>
              {sweepstake.status !== 'sorteado' && sweepstake.status !== 'cancelado' ? (
                <Btn onClick={draw} className="!px-3 !py-2">
                  Sortear ahora
                </Btn>
              ) : null}
              {sweepstake.status === 'activo' ? (
                <Btn
                  variant="secondary"
                  onClick={() => {
                    const res = store.closeSweepstake(actor, sweepstake.id);
                    setNotice(res.ok ? { success: 'Participaciones cerradas.' } : { error: res.error });
                  }}
                  className="!px-3 !py-2"
                >
                  Cerrar participaciones
                </Btn>
              ) : null}
              <Btn
                variant="danger"
                onClick={() => {
                  const reason = window.prompt('Motivo de cancelación') || '';
                  if (!reason.trim()) return;
                  const res = store.cancelSweepstake(actor, sweepstake.id, reason);
                  setNotice(res.ok ? { success: 'Sorteo cancelado.' } : { error: res.error });
                }}
                className="!px-3 !py-2"
              >
                Cancelar sorteo
              </Btn>

              {sweepstake.method === 'mejor_comentario' && sweepstake.status !== 'sorteado' ? (
                <div className="mt-2 w-full">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                    Elegir mejor comentario ({sweepstake.judging?.criteria})
                  </p>
                  <div className="space-y-1.5">
                    {validParticipations.map((participation) => (
                      <div key={participation.id} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-surface-border bg-surface p-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-content-primary">{participation.full_name}</p>
                          <p className="text-[11px] text-content-secondary">{participation.comment_text}</p>
                        </div>
                        {sweepstake.judging?.winner_participation_id === participation.id ? (
                          <Pill tone="success">Elegido</Pill>
                        ) : (
                          <Btn onClick={() => pickWinner(participation.id)} className="!px-2 !py-1 !text-[10px]">
                            Elegir
                          </Btn>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Ganadores */}
      {sweepstake.status === 'sorteado' ? (
        <div className="mt-4">
          <SectionHeading title="GANADORES" icon={<Trophy className="h-5 w-5 text-acid" />} />
          {sweepstake.winners.length ? (
            <div className="space-y-2">
              {sweepstake.winners.map((winner) => (
                <div key={winner.participation_id} className={`${sponsorCard} flex items-center gap-2 p-3`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-acid text-background font-display font-black">
                    {winner.position}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-content-primary">@{winner.username}</p>
                    <p className="text-[10px] text-content-muted">Ganador del puesto {winner.position}</p>
                  </div>
                  {winner.prize_id ? (
                    <BtnLink href="/sponsors/artista?tab=premios" variant="ghost" className="!px-2 !py-1 !text-[10px]">
                      Gestionar premio
                    </BtnLink>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-content-secondary">Sin ganadores registrados.</p>
          )}
        </div>
      ) : null}

      {/* Auditoría */}
      {sweepstake.audit.length ? (
        <div className="mt-4">
          <SectionHeading title="AUDITORÍA DEL SORTEO" subtitle="Semilla, participantes y hash verificable." />
          <div className="space-y-1.5">
            {sweepstake.seed ? (
              <p className="break-all rounded-lg border border-surface-border bg-surface-elevated/60 p-2 font-mono text-[10px] text-content-secondary">
                Semilla: {sweepstake.seed}
              </p>
            ) : null}
            {sweepstake.audit.map((entry) => (
              <div key={entry.id} className={`${sponsorCard} p-2.5`}>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="text-[11px] font-bold text-content-primary">{entry.action}</p>
                  <span className="text-[10px] text-content-muted">{formatDateTime(entry.at)}</span>
                </div>
                {entry.detail ? <p className="text-[10px] text-content-secondary">{entry.detail}</p> : null}
                {entry.hash ? <p className="break-all font-mono text-[9px] text-content-muted">#{entry.hash}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <BtnLink href="/sponsors/sorteos" variant="secondary">
          Más sorteos
        </BtnLink>
        {brand ? (
          <BtnLink href={brandHref(brand)} variant="ghost">
            Ver marca
          </BtnLink>
        ) : null}
      </div>

      <p className="mt-4 rounded-lg border border-surface-border bg-surface-elevated/50 p-2.5 text-[10px] leading-relaxed text-content-muted">
        <ShieldCheck className="mr-1 inline h-3 w-3 text-acid" />
        No se permite modificar reglas, premios ni fechas una vez iniciado el sorteo. La entrega del premio se coordina y queda
        registrada con estados y confirmación del ganador.
      </p>
    </div>
  );
}
