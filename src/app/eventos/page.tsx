'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Plus,
  X,
  ExternalLink,
  Tag,
} from 'lucide-react';

export default function EventosPage() {
  const { events, createEvent, currentUser } = useApp();

  const [filter, setFilter] = useState<'proximos' | 'pasados'>('proximos');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [flyerUrl, setFlyerUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [organizerName, setOrganizerName] = useState(currentUser.full_name);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['cultura', 'encuentro']);

  const now = new Date().getTime();
  const filteredEvents = events.filter((e) => {
    const time = new Date(e.start_date).getTime();
    return filter === 'proximos' ? time >= now - 1000 * 60 * 60 * 12 : time < now - 1000 * 60 * 60 * 12;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !location || !description) return;

    createEvent({
      title,
      description,
      flyerUrl: flyerUrl || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&h=1000&fit=crop',
      startDate: new Date(startDate).toISOString(),
      location,
      organizerName,
      ticketUrl,
      tags,
    });

    setShowCreateModal(false);
    // Reset
    setTitle('');
    setDescription('');
    setFlyerUrl('');
    setStartDate('');
    setLocation('');
    setTicketUrl('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-content-primary tracking-wide">
            AGENDA DE EVENTOS & CONVOCATORIAS
          </h1>
          <p className="text-xs text-content-secondary mt-1">
            Jams, cyphers de breaking, batallas, clínicas de DJing, exhibiciones de graffiti y conciertos autogestionados.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-acid text-background font-bold text-xs shadow-acid-glow hover:bg-acid-hover transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Evento</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2 text-xs font-bold">
        <button
          onClick={() => setFilter('proximos')}
          className={`py-1.5 px-4 rounded-lg transition-colors ${
            filter === 'proximos'
              ? 'bg-surface-elevated text-acid border border-surface-border'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          Próximos Encuentros
        </button>
        <button
          onClick={() => setFilter('pasados')}
          className={`py-1.5 px-4 rounded-lg transition-colors ${
            filter === 'pasados'
              ? 'bg-surface-elevated text-acid border border-surface-border'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          Eventos Anteriores
        </button>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-content-secondary">
            No hay eventos registrados en esta sección. ¡Anímate a publicar el próximo cypher o festival!
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="rounded-2xl bg-surface border border-surface-border hover:border-surface-hover overflow-hidden flex flex-col justify-between group transition-all"
            >
              {/* Flyer */}
              {ev.flyer_url && (
                <div className="h-44 w-full bg-surface-elevated relative overflow-hidden">
                  <img
                    src={ev.flyer_url}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-sm border border-white/10 text-xs font-bold text-acid">
                    {new Date(ev.start_date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1">
                    {ev.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-semibold text-acid uppercase tracking-wider"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <Link href={`/eventos/${ev.slug}`}>
                    <h2 className="font-bold text-base text-content-primary group-hover:text-acid transition-colors line-clamp-2">
                      {ev.title}
                    </h2>
                  </Link>

                  <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed">
                    {ev.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-surface-border text-xs text-content-secondary">
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-orange flex-shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan flex-shrink-0" />
                    <span>
                      {new Date(ev.start_date).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      ({ev.timezone.split('/')[1] || ev.timezone})
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href={`/eventos/${ev.slug}`}
                    className="text-xs font-bold text-acid hover:underline"
                  >
                    Detalle del evento →
                  </Link>

                  {ev.ticket_url && (
                    <a
                      href={ev.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-xs font-bold text-content-primary border border-surface-border"
                    >
                      <Ticket className="w-3.5 h-3.5 text-magenta" />
                      <span>Entradas / Info</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-surface-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 text-content-secondary hover:text-content-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-orange" />
              <h2 className="font-display font-black text-xl text-content-primary tracking-wide">
                PUBLICAR NUEVO EVENTO
              </h2>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-content-secondary uppercase tracking-wider mb-1">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Cypher Callejero 1vs1 Hip Hop"
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-content-primary focus:border-acid focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-content-secondary uppercase tracking-wider mb-1">
                  Descripción & Convocatoria *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre micrófono abierto, premios, line-up de DJs o cómo participar..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-content-primary focus:border-acid focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary uppercase tracking-wider mb-1">
                    Fecha y Hora de Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-content-primary focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-content-secondary uppercase tracking-wider mb-1">
                    Ubicación / Ciudad *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej: Plaza Central, Buenos Aires"
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-content-primary focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-content-secondary uppercase tracking-wider mb-1">
                    Organizador / Colectivo
                  </label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-content-primary focus:border-acid focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-content-secondary uppercase tracking-wider mb-1">
                    Enlace de Entradas / Redes (Opcional)
                  </label>
                  <input
                    type="url"
                    value={ticketUrl}
                    onChange={(e) => setTicketUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-content-primary focus:border-acid focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-content-secondary uppercase tracking-wider mb-1">
                  URL del Flyer o Imagen (Opcional)
                </label>
                <input
                  type="url"
                  value={flyerUrl}
                  onChange={(e) => setFlyerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-content-primary focus:border-acid focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-content-secondary hover:text-content-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-acid text-background font-bold shadow-acid-glow hover:bg-acid-hover"
                >
                  Publicar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
