'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';
import {
  announceEventAlert,
  EVENT_ALERT_DURATION_MS,
  hasAnnouncedEventAlert,
  markEventAlertAnnounced,
  pickNextEventForAlert,
} from '@/lib/event-alert';
import { useEventAlertFlash } from './useEventAlertFlash';
import type { HipHopEvent } from '@/types';

function formatEventDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function eventHref(event: HipHopEvent) {
  return `/eventos/${event.slug || event.id}`;
}

/**
 * Aviso efímero de próximo evento (abajo a la izquierda).
 * Aparece una vez por sesión, se va solo y al hacer clic lleva al evento.
 */
export const EventSpotlight: React.FC = () => {
  const { events } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [event, setEvent] = useState<HipHopEvent | null>(null);
  const startedRef = useRef(false);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextEventId = useMemo(() => pickNextEventForAlert(events)?.id || '', [events]);

  useEffect(() => {
    if (!mounted || startedRef.current || !nextEventId) return;

    const next = eventsRef.current.find((item) => item.id === nextEventId);
    if (!next) return;
    if (hasAnnouncedEventAlert(next.id)) return;

    const href = eventHref(next);
    if (pathname === href || pathname.startsWith(`${href}/`)) return;

    const timer = setTimeout(() => {
      startedRef.current = true;
      markEventAlertAnnounced(next.id);
      setEvent(next);
      announceEventAlert(next);
    }, 4000);

    return () => clearTimeout(timer);
  }, [mounted, nextEventId, pathname]);

  useEffect(() => {
    if (!event) return;
    const timer = setTimeout(() => setEvent(null), EVENT_ALERT_DURATION_MS + 500);
    return () => clearTimeout(timer);
  }, [event]);

  if (!event) return null;

  const openEvent = () => {
    const href = eventHref(event);
    setEvent(null);
    router.push(href);
  };

  return (
    <div className="fixed z-[70] left-3 bottom-24 md:bottom-5 md:left-5 w-[min(92vw,360px)] animate-toast-in">
      <div className="rounded-2xl bg-surface-elevated border border-acid/40 shadow-2xl overflow-hidden">
        <div
          role="link"
          tabIndex={0}
          onClick={openEvent}
          onKeyDown={(keyboardEvent) => {
            if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
              keyboardEvent.preventDefault();
              openEvent();
            }
          }}
          className="p-3 flex items-start gap-3 cursor-pointer group"
        >
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-acid/10 border border-acid/30 flex-shrink-0">
            {event.flyer_url ? (
              <img
                src={event.flyer_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-acid">
                <Calendar className="w-6 h-6" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-acid">
              <Sparkles className="w-3 h-3" />
              Próximo evento
            </div>
            <p className="text-xs font-bold text-content-primary leading-snug line-clamp-2 group-hover:text-acid transition-colors">
              {event.title}
            </p>
            <p className="text-[10px] text-content-secondary flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-orange flex-shrink-0" />
              <span>{formatEventDate(event.start_date)}</span>
              {event.location && (
                <>
                  <span className="text-content-muted">·</span>
                  <MapPin className="w-3 h-3 text-orange flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </>
              )}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-acid">
              Ver evento
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>

          <button
            type="button"
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              setEvent(null);
            }}
            className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface transition-colors flex-shrink-0"
            aria-label="Cerrar aviso de evento"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-0.5 bg-surface">
          <div className="h-full bg-acid animate-event-progress" />
        </div>
      </div>
    </div>
  );
};

/**
 * Franja breve en la cabecera. Se va sola a los pocos segundos.
 */
export const EventHeaderFlash: React.FC = () => {
  const alertEvent = useEventAlertFlash();
  const [dismissedId, setDismissedId] = useState('');

  if (!alertEvent || dismissedId === alertEvent.id) return null;

  return (
    <div className="mx-3 mt-2 rounded-xl border border-orange/40 bg-orange/10 px-3 py-2 text-orange animate-event-flash">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 flex-shrink-0" />
        <Link
          href={eventHref(alertEvent)}
          className="flex-1 min-w-0 text-[11px] leading-snug hover:underline"
        >
          <span className="font-black uppercase tracking-wider">Se acerca:</span>{' '}
          <span className="font-bold">{alertEvent.title}</span>{' '}
          <span className="text-orange/80">
            · {formatEventDate(alertEvent.start_date)}
          </span>
        </Link>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold">
          Ver
          <ArrowRight className="w-3 h-3" />
        </span>
        <button
          type="button"
          onClick={() => setDismissedId(alertEvent.id)}
          className="p-0.5 rounded hover:bg-orange/20 transition-colors"
          aria-label="Cerrar aviso de evento"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="mt-1.5 h-0.5 bg-orange/20 rounded-full overflow-hidden">
        <div className="h-full bg-orange animate-event-progress" />
      </div>
    </div>
  );
};
