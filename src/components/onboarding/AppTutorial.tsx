'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  Calendar,
  Check,
  Compass,
  Home,
  MessageCircle,
  Plus,
  Radio,
  Sliders,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';

export const START_TUTORIAL_EVENT = 'larvaz:start-tutorial';

export function startAppTutorial() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(START_TUTORIAL_EVENT));
  }
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  tip?: string;
  target?: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'bienvenida',
    title: 'Bienvenido a Larvaz Hip-Hop',
    description:
      'Te hago un recorrido corto por la plataforma para que sepas dónde publicar, escuchar y conectar con la comunidad.',
    tip: 'Podés saltearlo cuando quieras y repetirlo desde el menú “Tutorial”.',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: 'inicio',
    title: 'El Muro',
    description:
      'Acá ves todo lo que publica la comunidad: temas, videos, fotos, beats y textos. Dale props a lo que te guste y comentá.',
    target: 'inicio',
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: 'publicar',
    title: 'Publicá tu material',
    description:
      'Desde “Publicar en el Muro” subís un link, un texto, fotos o audios. Podés elegir plantilla visual para tus temas.',
    target: 'publicar',
    icon: <Plus className="w-5 h-5" />,
  },
  {
    id: 'explorar',
    title: 'Explorá por elemento',
    description:
      'Filtrá por MC, DJ, Breaking, Graffiti o Beatmaking, o buscá artistas y publicaciones puntuales.',
    target: 'explorar',
    icon: <Compass className="w-5 h-5" />,
  },
  {
    id: 'radio',
    title: 'Radio 24/7',
    description:
      'Sintonizá la radio comunitaria mientras navegás. Suena en segundo plano y podés pausarla cuando quieras.',
    target: 'radio',
    icon: <Radio className="w-5 h-5" />,
  },
  {
    id: 'estudio',
    title: 'Estudio de mastering',
    description:
      'Mejorá el sonido de tus audios antes de subirlos al muro o mandarlos a la radio, directo desde el navegador.',
    target: 'estudio',
    icon: <Sliders className="w-5 h-5" />,
  },
  {
    id: 'eventos',
    title: 'Agenda de eventos',
    description:
      'Cyphers, jams, batallas y conciertos. Cuando se acerca un evento te avisamos con una notificación y un aviso breve.',
    target: 'eventos',
    tip: 'El aviso de evento es efímero: aparece unos segundos y te lleva al detalle si hacés clic.',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    id: 'mensajes',
    title: 'Hablá con la comunidad',
    description:
      'Escribile a otros artistas por mensaje privado para colaborar, coordinar fechas o compartir material.',
    target: 'mensajes',
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    id: 'guardados',
    title: 'Guardá lo que te gusta',
    description:
      'Marcá publicaciones como guardadas para volver a ellas cuando quieras, sin perderlas en el feed.',
    target: 'guardados',
    icon: <Bookmark className="w-5 h-5" />,
  },
  {
    id: 'notificaciones',
    title: 'Avisos y novedades',
    description:
      'Acá llegan los props, comentarios, seguidores y avisos de eventos. La campanita parpadea cuando hay algo nuevo.',
    target: 'notificaciones',
    icon: <Bell className="w-5 h-5" />,
  },
  {
    id: 'panel',
    title: 'Tu panel y tu billetera',
    description:
      'Editá tu perfil, revisá tus Props, tu billetera y tus referidos. Desde acá también gestionás tu cuenta.',
    target: 'panel',
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    id: 'cierre',
    title: 'Ya estás listo',
    description:
      'Eso es todo lo básico. Explorá, publicá y sumate a la movida. Si querés repasar, abrí “Tutorial” en el menú o en Configuración.',
    tip: 'La cultura se comparte: invitá a otros artistas con tu link de referido y ganá Props.',
    icon: <Check className="w-5 h-5" />,
  },
];

function tutorialStorageKey(userId?: string) {
  return `larvaz_tutorial_v1_${userId || 'guest'}`;
}

export const AppTutorial: React.FC = () => {
  const { currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const attemptRef = useRef(false);

  const step = TOUR_STEPS[stepIndex];

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(
    (remember = true) => {
      setOpen(false);
      setTargetRect(null);
      if (remember && typeof window !== 'undefined') {
        try {
          localStorage.setItem(tutorialStorageKey(currentUser.id), 'done');
        } catch {
          // almacenamiento no disponible
        }
      }
    },
    [currentUser.id]
  );

  // Apertura automática la primera vez que la persona usa la app.
  useEffect(() => {
    if (!mounted || attemptRef.current) return;
    if (currentUser.is_guest) return;

    let seen = false;
    try {
      seen = localStorage.getItem(tutorialStorageKey(currentUser.id)) === 'done';
    } catch {
      seen = false;
    }
    if (seen) return;

    attemptRef.current = true;
    const timer = setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, [mounted, currentUser.id, currentUser.is_guest]);

  // Apertura manual desde el menú, la cabecera o Configuración.
  useEffect(() => {
    const handler = () => {
      setStepIndex(0);
      setOpen(true);
    };
    window.addEventListener(START_TUTORIAL_EVENT, handler);
    return () => window.removeEventListener(START_TUTORIAL_EVENT, handler);
  }, []);

  // Busca la primera copia visible del objetivo: en escritorio vive en el menú
  // lateral y en móvil en la barra inferior, así que puede haber duplicados.
  const resolveTarget = useCallback((key?: string) => {
    if (!key) return null;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`)
    );
    for (const element of elements) {
      const rect = element.getBoundingClientRect();
      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth;
      if (visible) return element;
    }
    return null;
  }, []);

  // Resaltado del elemento correspondiente al paso.
  const updateTargetRect = useCallback(() => {
    const element = resolveTarget(step?.target);
    setTargetRect(element ? element.getBoundingClientRect() : null);
  }, [resolveTarget, step?.target]);

  useLayoutEffect(() => {
    if (!open) return;

    const element = resolveTarget(step?.target);
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });

    updateTargetRect();
    const timer = setTimeout(updateTargetRect, 300);

    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [open, step?.target, updateTargetRect]);

  // Guarda y restaura el scroll al abrir/cerrar, para no dejar el menú corrido.
  useEffect(() => {
    if (!open) return;
    const aside = document.querySelector('aside');
    const previousAside = aside ? aside.scrollTop : 0;
    const previousWindow = window.scrollY;

    return () => {
      if (aside) aside.scrollTop = previousAside;
      window.scrollTo({ top: previousWindow, behavior: 'auto' });
    };
  }, [open]);

  // Bloqueo de scroll y atajos de teclado mientras el tutorial está abierto.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') {
        setStepIndex((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
      }
      if (event.key === 'ArrowLeft') {
        setStepIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const isLast = stepIndex === TOUR_STEPS.length - 1;

  const goNext = () => {
    if (isLast) {
      close();
      return;
    }
    setStepIndex((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
  };

  if (!open) return null;

  const highlight = targetRect
    ? {
        left: targetRect.left - 6,
        top: targetRect.top - 6,
        width: targetRect.width + 12,
        height: targetRect.height + 12,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Tutorial de uso">
      {/* Capa que bloquea la interacción con el fondo */}
      <div className={`fixed inset-0 z-[80] ${highlight ? 'bg-transparent' : 'bg-black/80'}`} />

      {/* Foco sobre el elemento del paso */}
      {highlight && (
        <div
          className="fixed z-[81] rounded-xl border-2 border-acid pointer-events-none transition-all duration-300"
          style={{ ...highlight, boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)' }}
        />
      )}

      {/*
        Tarjeta del tutorial.
        Se centra con flex (no con -translate-x-1/2) porque la animación de
        entrada también usa transform y pisaba el centrado: en móvil la tarjeta
        quedaba corrida a la derecha y los botones fuera de pantalla.
      */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] z-[82] flex justify-center px-3 md:bottom-5 md:px-0">
        <div className="pointer-events-auto w-full max-w-[430px] animate-fade-in">
          <div className="flex max-h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-2xl bg-surface border border-acid/40 shadow-2xl md:max-h-[calc(100dvh-2.5rem)]">
            <div className="h-1 w-full flex-shrink-0 bg-surface-elevated">
              <div
                className="h-full bg-acid transition-all duration-300"
                style={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
              />
            </div>

            <div className="flex flex-shrink-0 items-start justify-between gap-3 px-4 pt-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-acid/15 border border-acid/40 text-acid flex items-center justify-center flex-shrink-0">
                  {step.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-content-muted">
                    Paso {stepIndex + 1} de {TOUR_STEPS.length}
                  </p>
                  <h2 className="font-display font-black text-base text-content-primary leading-tight">
                    {step.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => close()}
                className="-m-1 flex-shrink-0 p-2.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-surface-elevated active:bg-surface-elevated transition-colors"
                aria-label="Cerrar tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2 pt-2 space-y-3">
              <p className="text-xs text-content-secondary leading-relaxed">{step.description}</p>

              {step.tip && (
                <div className="p-2.5 rounded-xl bg-acid/10 border border-acid/25 text-[11px] text-acid leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{step.tip}</span>
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-surface-border/60 px-4 py-2.5">
              <button
                type="button"
                onClick={() => close()}
                className="px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-content-muted hover:text-content-primary transition-colors"
              >
                Saltar
              </button>

              <div className="flex min-w-0 items-center gap-2">
                <div className="hidden items-center gap-1 sm:flex">
                  {TOUR_STEPS.map((tourStep, index) => (
                    <button
                      key={tourStep.id}
                      type="button"
                      onClick={() => setStepIndex(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === stepIndex
                          ? 'w-5 bg-acid'
                          : index < stepIndex
                            ? 'w-1.5 bg-acid/50'
                            : 'w-1.5 bg-surface-border'
                      }`}
                      aria-label={`Ir al paso ${index + 1}`}
                    />
                  ))}
                </div>

                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-[11px] font-bold text-content-secondary hover:text-content-primary transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Anterior
                  </button>
                )}

                <button
                  type="button"
                  onClick={goNext}
                  className="flex flex-shrink-0 items-center gap-1.5 px-3.5 py-2 rounded-xl bg-acid text-background text-[11px] font-display font-black uppercase tracking-wider shadow-acid-glow hover:bg-acid-hover transition-colors"
                >
                  {isLast ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Listo
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="hidden flex-shrink-0 px-4 pb-2 text-right text-[9px] text-content-muted md:block">
              Usá las flechas del teclado · Esc para salir
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
