'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { dataStore } from '@/lib/data-store';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  User,
  Share2,
  Tag,
} from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { currentUser } = useApp();

  const event = dataStore.getEventBySlug(slug);

  if (!event) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="font-display font-black text-2xl text-content-primary">
          EVENTO NO ENCONTRADO
        </h2>
        <p className="text-xs text-content-secondary">
          No se encontró el evento solicitado en la agenda cultural.
        </p>
        <Link
          href="/eventos"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-acid text-background font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Agenda</span>
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.start_date);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-content-secondary hover:text-acid transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Eventos</span>
      </button>

      {/* Flyer */}
      {event.flyer_url && (
        <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-surface-elevated border border-surface-border relative shadow-lg">
          <img
            src={event.flyer_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-xs font-bold text-acid flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {startDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}

      {/* Title & Organizer */}
      <div className="space-y-2 border-b border-surface-border pb-4">
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] font-bold text-acid uppercase tracking-wider px-2 py-0.5 rounded bg-acid/10 border border-acid/20"
            >
              #{t}
            </span>
          ))}
        </div>

        <h1 className="font-display font-black text-2xl md:text-3xl text-content-primary tracking-wide">
          {event.title}
        </h1>

        <p className="text-xs text-content-secondary flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-cyan" />
          <span>Organizado por: <strong className="text-content-primary">{event.organizer_name}</strong></span>
        </p>
      </div>

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-surface border border-surface-border text-xs">
        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan" />
            <span>Horario & Zona</span>
          </span>
          <p className="text-content-primary font-medium">
            {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs
          </p>
          <p className="text-[10px] text-content-muted">
            Zona horaria: {event.timezone}
          </p>
        </div>

        <div className="space-y-1">
          <span className="font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-orange" />
            <span>Ubicación</span>
          </span>
          <p className="text-content-primary font-medium">
            {event.location}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary">
          Sobre este encuentro cultural
        </h2>
        <p className="text-sm text-content-primary/90 leading-relaxed whitespace-pre-line">
          {event.description}
        </p>
      </div>

      {/* Ticket / External Action */}
      {event.ticket_url && (
        <div className="p-4 rounded-2xl bg-surface border border-surface-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-content-primary">
              Información de acceso y entradas
            </p>
            <p className="text-[11px] text-content-secondary">
              Redirección al proveedor o red oficial del organizador
            </p>
          </div>
          <a
            href={event.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-acid text-background font-bold text-xs shadow-acid-sm hover:bg-acid-hover transition-colors"
          >
            <Ticket className="w-4 h-4" />
            <span>Ver Entradas / Info</span>
          </a>
        </div>
      )}
    </div>
  );
}
