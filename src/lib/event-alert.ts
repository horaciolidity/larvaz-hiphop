import type { HipHopEvent } from '@/types';

/** Evento de ventana que dispara el aviso efímero de un próximo evento. */
export const EVENT_ALERT_EVENT = 'larvaz:event-alert';

/** Cuánto dura el aviso en pantalla y el parpadeo de la campanita. */
export const EVENT_ALERT_DURATION_MS = 12000;

export function announceEventAlert(event: HipHopEvent) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_ALERT_EVENT, { detail: event }));
}

function alertStorageKey(eventId: string) {
  return `larvaz_event_alert_${eventId}`;
}

/** Evita repetir el mismo aviso en la misma sesión del navegador. */
export function hasAnnouncedEventAlert(eventId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return sessionStorage.getItem(alertStorageKey(eventId)) === '1';
  } catch {
    return false;
  }
}

export function markEventAlertAnnounced(eventId: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(alertStorageKey(eventId), '1');
  } catch {
    // almacenamiento no disponible
  }
}

/** Próximo evento relevante: el más cercano dentro de los próximos 45 días. */
export function pickNextEventForAlert(
  events: HipHopEvent[],
  now = Date.now(),
  maxDays = 45
): HipHopEvent | null {
  const limit = now + maxDays * 24 * 60 * 60 * 1000;
  const upcoming = events
    .filter((event) => {
      const time = new Date(event.start_date).getTime();
      return Number.isFinite(time) && time > now && time <= limit;
    })
    .sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

  return upcoming[0] || null;
}
