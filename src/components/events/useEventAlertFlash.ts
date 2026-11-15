'use client';

import { useEffect, useState } from 'react';
import type { HipHopEvent } from '@/types';
import { EVENT_ALERT_DURATION_MS, EVENT_ALERT_EVENT } from '@/lib/event-alert';

/**
 * Devuelve el evento que está sonando en el aviso efímero y lo limpia
 * automáticamente después de unos segundos (la campanita deja de parpadear).
 */
export function useEventAlertFlash(duration = EVENT_ALERT_DURATION_MS): HipHopEvent | null {
  const [event, setEvent] = useState<HipHopEvent | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handler = (rawEvent: Event) => {
      const detail = (rawEvent as CustomEvent<HipHopEvent>).detail;
      if (!detail) return;
      setEvent(detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setEvent(null), duration);
    };

    window.addEventListener(EVENT_ALERT_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(EVENT_ALERT_EVENT, handler as EventListener);
      if (timer) clearTimeout(timer);
    };
  }, [duration]);

  return event;
}
