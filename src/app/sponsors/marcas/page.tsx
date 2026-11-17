'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Store } from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { BrandCard } from '@/components/sponsors/cards';
import { BtnLink, EmptyState, Input, Pill, SectionHeading, Select } from '@/components/sponsors/ui';
import { COMMERCIAL_CATEGORIES } from '@/lib/sponsors/catalog';
import type { SponsorCommercialCategory } from '@/types/sponsors';

export default function MarcasPage() {
  const { state } = useSponsors();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<SponsorCommercialCategory | ''>('');
  const [onlyVerified, setOnlyVerified] = useState(true);

  const brands = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.brands
      .filter((b) => b.verification !== 'suspendida' && b.verification !== 'rechazada')
      .filter((b) => (onlyVerified ? b.verification === 'verificada' : true))
      .filter((b) => (category ? b.category === category : true))
      .filter((b) =>
        term
          ? `${b.name} ${b.description} ${b.city} ${b.country}`.toLowerCase().includes(term)
          : true
      )
      .sort((a, b) => b.followers.length - a.followers.length);
  }, [state.brands, q, category, onlyVerified]);

  return (
    <div className="pb-10">
      <SponsorNav />
      <SectionHeading
        title="MARCAS LARVAZ"
        subtitle="Directorio de marcas, tiendas y emprendimientos que patrocinan cultura urbana."
        icon={<Store className="h-6 w-6 text-acid" />}
        action={
          <BtnLink href="/sponsors/marca/nueva" className="!px-3 !py-2">
            <Plus className="h-3.5 w-3.5" /> Sumar marca
          </BtnLink>
        }
      />

      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar marca, ciudad o rubro…" className="!pl-9" />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value as SponsorCommercialCategory | '')}>
          <option value="">Todos los rubros</option>
          {COMMERCIAL_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill tone="acid">{brands.length} marcas</Pill>
        <button
          type="button"
          onClick={() => setOnlyVerified((v) => !v)}
          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            onlyVerified ? 'border-acid/40 bg-acid/10 text-acid' : 'border-surface-border text-content-secondary'
          }`}
        >
          {onlyVerified ? 'Solo verificadas' : 'Todas las marcas'}
        </button>
      </div>

      {brands.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Store className="h-5 w-5" />}
          title="No encontramos marcas"
          description="Probá con otro rubro o buscá por ciudad. Si representás una marca, creá su perfil y empezá a publicar propuestas."
          action={<BtnLink href="/sponsors/marca/nueva">Crear perfil de marca</BtnLink>}
        />
      )}

      <p className="mt-6 text-center text-[10px] text-content-muted">
        Las marcas con sello <span className="font-bold text-acid">VERIFICADA</span> pasaron por revisión administrativa de
        LARVAZ.{' '}
        <Link href="/sponsors/admin" className="text-cyan hover:underline">
          Panel de administración
        </Link>
      </p>
    </div>
  );
}
