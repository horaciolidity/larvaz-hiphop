'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Compass, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { OpportunityCard } from '@/components/sponsors/cards';
import { Btn, EmptyState, Field, Input, Pill, SectionHeading, Select, Check } from '@/components/sponsors/ui';
import { ARTIST_CATEGORIES, COUNTRIES, SPONSORSHIP_TYPES } from '@/lib/sponsors/catalog';
import type { SponsorArtistCategory, SponsorshipType } from '@/types/sponsors';

const PAGE = 8;

export default function ExplorarPatrociniosPage() {
  const { state, store } = useSponsors();
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<SponsorArtistCategory | ''>('');
  const [type, setType] = useState<SponsorshipType | ''>('');
  const [benefit, setBenefit] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const countries = useMemo(() => {
    const set = new Set<string>();
    state.opportunities.forEach((o) => set.add(o.country));
    return Array.from(set).sort();
  }, [state.opportunities]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    state.opportunities.filter((o) => !country || o.country === country).forEach((o) => set.add(o.city));
    return Array.from(set).sort();
  }, [state.opportunities, country]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.opportunities
      .filter((o) => o.status === 'abierta' && new Date(o.deadline).getTime() > Date.now())
      .filter((o) => {
        const brand = store.getBrand(o.brand_id);
        if (verifiedOnly && brand?.verification !== 'verificada') return false;
        if (country && o.country !== country) return false;
        if (city && o.city !== city) return false;
        if (category && !o.artist_categories.includes(category)) return false;
        if (type && o.offer.type !== type) return false;
        if (benefit.trim()) {
          const b = benefit.trim().toLowerCase();
          const haystack = `${o.offer.summary} ${(o.offer.products || []).join(' ')} ${(o.offer.logistics || []).join(' ')}`.toLowerCase();
          if (!haystack.includes(b)) return false;
        }
        if (term) {
          const haystack = `${o.title} ${o.description} ${o.city} ${o.country} ${brand?.name || ''} ${o.offer.summary}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [state.opportunities, q, country, city, category, type, benefit, verifiedOnly, store]);

  const activeFilters = [country, city, category, type, benefit, verifiedOnly ? 'verified' : ''].filter(Boolean).length;

  const clear = () => {
    setQ('');
    setCountry('');
    setCity('');
    setCategory('');
    setType('');
    setBenefit('');
    setVerifiedOnly(false);
    setVisible(PAGE);
  };

  return (
    <div className="pb-10">
      <SponsorNav />

      <SectionHeading
        title="EXPLORAR PATROCINIOS"
        subtitle="Filtrá por país, ciudad, categoría artística, tipo de patrocinio y beneficios."
        icon={<Compass className="h-6 w-6 text-acid" />}
        action={
          <Btn variant="secondary" onClick={() => setOpenFilters((v) => !v)} className="!px-3 !py-2">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
            {activeFilters ? <span className="rounded-full bg-acid px-1.5 text-[9px] text-background">{activeFilters}</span> : null}
          </Btn>
        }
      />

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setVisible(PAGE);
          }}
          placeholder="Buscar por marca, título, ciudad o beneficio…"
          className="!pl-9"
        />
      </div>

      {openFilters ? (
        <div className="mb-4 rounded-2xl border border-surface-border bg-surface p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="País">
              <Select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setCity('');
                  setVisible(PAGE);
                }}
              >
                <option value="">Todos los países</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ciudad">
              <Select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setVisible(PAGE);
                }}
              >
                <option value="">Todas las ciudades</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoría artística">
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as SponsorArtistCategory | '');
                  setVisible(PAGE);
                }}
              >
                <option value="">Todas las categorías</option>
                {ARTIST_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo de patrocinio">
              <Select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as SponsorshipType | '');
                  setVisible(PAGE);
                }}
              >
                <option value="">Todos los tipos</option>
                {SPONSORSHIP_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Beneficio buscado" hint="Ej: zapatillas, hospedaje, masterización.">
              <Input
                value={benefit}
                onChange={(e) => {
                  setBenefit(e.target.value);
                  setVisible(PAGE);
                }}
                placeholder="zapatillas"
              />
            </Field>
            <div className="flex items-end">
              <Check
                checked={verifiedOnly}
                onChange={(value) => {
                  setVerifiedOnly(value);
                  setVisible(PAGE);
                }}
                label="Solo marcas verificadas"
              />
            </div>
          </div>
          {activeFilters ? (
            <button type="button" onClick={clear} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-magenta">
              <X className="h-3 w-3" /> Limpiar filtros
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-content-secondary">
        <Pill tone="acid">
          <Filter className="h-3 w-3" /> {filtered.length} propuestas
        </Pill>
        {category ? <Pill tone="magenta">{ARTIST_CATEGORIES.find((c) => c.id === category)?.label}</Pill> : null}
        {type ? <Pill tone="cyan">{SPONSORSHIP_TYPES.find((t) => t.id === type)?.label}</Pill> : null}
      </div>

      {filtered.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.slice(0, visible).map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
          {visible < filtered.length ? (
            <div className="mt-4 flex justify-center">
              <Btn variant="secondary" onClick={() => setVisible((v) => v + PAGE)}>
                Ver más propuestas
              </Btn>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={<Compass className="h-5 w-5" />}
          title="No hay propuestas con esos filtros"
          description="Probá con otro país, categoría o beneficio. Si sos marca, podés publicar la primera convocatoria."
          action={
            <Link href="/sponsors/publicar" className="rounded-xl bg-acid px-4 py-2 text-xs font-black uppercase tracking-wide text-background">
              Publicar propuesta
            </Link>
          }
        />
      )}

      <div className="mt-6 rounded-2xl border border-magenta/25 bg-magenta/5 p-4">
        <p className="font-display text-lg font-black text-content-primary">¿Sos artista y no encontrás tu lugar?</p>
        <p className="mt-1 text-[11px] leading-relaxed text-content-secondary">
          Completá tu perfil artístico, sumá portfolio y redes. Las marcas pueden invitarte directamente desde tu perfil y
          recibir tu propuesta en el panel de artista.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/sponsors/artista" className="rounded-xl bg-magenta px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white">
            Ir a mi panel de artista
          </Link>
          <Link href="/panel" className="rounded-xl border border-surface-border px-4 py-2 text-[11px] font-black uppercase tracking-wide text-content-primary">
            Editar mi perfil LARVAZ
          </Link>
        </div>
      </div>
    </div>
  );
}
