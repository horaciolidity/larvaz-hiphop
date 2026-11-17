'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Inbox, LogIn } from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { Btn, BtnLink, EmptyState, Pill, SectionHeading, Tabs, sponsorCard } from '@/components/sponsors/ui';
import { timeAgo } from '@/lib/sponsors/catalog';
import type { SponsorNotification } from '@/types/sponsors';

type Tab = 'todas' | 'sin_leer';

const TYPE_LABEL: Record<SponsorNotification['type'], string> = {
  nueva_postulacion: 'Postulación',
  nueva_oportunidad: 'Propuesta',
  oferta: 'Oferta',
  acuerdo: 'Acuerdo',
  sorteo: 'Sorteo',
  participacion: 'Participación',
  ganador: 'Ganador',
  premio: 'Premio',
  donacion: 'Donación',
  campana: 'Campaña',
  compromiso: 'Compromiso',
  verificacion: 'Verificación',
  review: 'Reseña',
};

export default function SponsorNotificationsPage() {
  const { state, store, actor } = useSponsors();
  const [tab, setTab] = useState<Tab>('todas');

  if (!actor || actor.is_guest) {
    return (
      <div>
        <SponsorNav />
        <EmptyState
          icon={<LogIn className="h-5 w-5" />}
          title="Ingresá para ver tus notificaciones"
          description="Las notificaciones de patrocinios, sorteos, premios y campañas se asocian a tu cuenta LARVAZ."
          action={<BtnLink href="/login?redirect=/sponsors/notificaciones">Iniciar sesión</BtnLink>}
        />
      </div>
    );
  }

  const all = state.notifications
    .filter((n) => n.user_id === actor.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const unread = all.filter((n) => !n.read);
  const list = tab === 'sin_leer' ? unread : all;

  return (
    <div className="pb-10">
      <SponsorNav />
      <SectionHeading
        title="NOTIFICACIONES"
        subtitle="Ofertas, acuerdos, sorteos, premios, aportes y verificaciones."
        icon={<Bell className="h-6 w-6 text-acid" />}
        action={
          unread.length ? (
            <Btn variant="secondary" onClick={() => store.markAllNotificationsRead(actor.id)} className="!px-3 !py-2">
              <CheckCheck className="h-3.5 w-3.5" /> Marcar leídas
            </Btn>
          ) : null
        }
      />

      <Tabs
        tabs={[
          { id: 'todas', label: 'Todas', count: all.length },
          { id: 'sin_leer', label: 'Sin leer', count: unread.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {list.length ? (
        <div className="space-y-1.5">
          {list.map((notification) => (
            <div
              key={notification.id}
              className={`${sponsorCard} flex items-start gap-2.5 p-3 ${notification.read ? 'opacity-70' : 'border-acid/25'}`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  notification.read ? 'bg-surface-elevated text-content-muted' : 'bg-acid/15 text-acid'
                }`}
              >
                <Bell className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-[12px] font-bold text-content-primary">{notification.title}</p>
                  <Pill tone={notification.read ? 'neutral' : 'acid'}>{TYPE_LABEL[notification.type]}</Pill>
                  {!notification.read ? <span className="h-1.5 w-1.5 rounded-full bg-magenta" /> : null}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-content-secondary">{notification.body}</p>
                <p className="mt-0.5 text-[10px] text-content-muted">{timeAgo(notification.created_at)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {notification.href ? (
                  <Link
                    href={notification.href}
                    onClick={() => store.markNotificationRead(notification.id)}
                    className="text-[10px] font-black uppercase tracking-wide text-acid hover:underline"
                  >
                    Ver
                  </Link>
                ) : null}
                {!notification.read ? (
                  <button
                    type="button"
                    onClick={() => store.markNotificationRead(notification.id)}
                    className="text-[10px] font-bold text-content-muted hover:text-content-primary"
                  >
                    Marcar leída
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Inbox className="h-5 w-5" />}
          title={tab === 'sin_leer' ? 'No tenés notificaciones sin leer' : 'Todavía no hay notificaciones'}
          description="Cuando recibas una oferta, se verifique tu marca o ganes un premio, aparecerá acá."
          action={<BtnLink href="/sponsors/explorar">Explorar patrocinios</BtnLink>}
        />
      )}
    </div>
  );
}
