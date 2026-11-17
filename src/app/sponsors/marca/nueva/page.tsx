'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, Crown, LogIn, ShieldCheck } from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { BrandForm } from '@/components/sponsors/forms';
import { BrandAvatar, EmptyState, Pill, SectionHeading, sponsorCard } from '@/components/sponsors/ui';
import { brandHref } from '@/lib/sponsors/links';

export default function NuevaMarcaPage() {
  const { actor, store } = useSponsors();
  const myBrands = actor ? store.getBrandsByOwner(actor.id) : [];

  return (
    <div className="pb-10">
      <SponsorNav />
      <SectionHeading
        title="CREAR PERFIL DE MARCA"
        subtitle="Tu marca dentro de LARVAZ: publicaciones, convocatorias, sorteos, desafíos y campañas."
        icon={<Briefcase className="h-6 w-6 text-acid" />}
      />

      {!actor || actor.is_guest ? (
        <EmptyState
          icon={<LogIn className="h-5 w-5" />}
          title="Necesitás iniciar sesión"
          description="Usá tu cuenta LARVAZ existente. No se crean cuentas separadas: una misma cuenta puede tener perfil artístico y administrar una o varias marcas."
          action={
            <Link href="/login?redirect=/sponsors/marca/nueva" className="rounded-xl bg-acid px-4 py-2 text-xs font-black uppercase tracking-wide text-background">
              Iniciar sesión
            </Link>
          }
        />
      ) : (
        <>
          <div className={`${sponsorCard} mb-4 p-3`}>
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
              <div className="text-[11px] leading-relaxed text-content-secondary">
                <p className="font-bold text-content-primary">Verificación de marcas</p>
                <p>
                  Toda marca nueva queda en revisión administrativa. La verificación habilita el sello
                  <span className="mx-1 font-bold text-acid">VERIFICADA</span>y prioridad en el marketplace. Las cuentas
                  administrativas se verifican al crear la marca para poder probar el flujo completo.
                </p>
              </div>
            </div>
          </div>

          {myBrands.length ? (
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-content-secondary">Tus marcas</p>
              <div className="space-y-2">
                {myBrands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={brandHref(brand)}
                    className="flex items-center gap-2.5 rounded-xl border border-surface-border bg-surface p-2.5 hover:border-acid/30"
                  >
                    <BrandAvatar brand={brand} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-content-primary">{brand.name}</p>
                      <p className="text-[10px] text-content-muted">{brand.city}, {brand.country}</p>
                    </div>
                    <Pill tone={brand.verification === 'verificada' ? 'acid' : 'neutral'}>{brand.verification}</Pill>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className={`${sponsorCard} p-4`}>
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-5 w-5 text-acid" />
              <p className="font-display text-lg font-black text-content-primary">Datos de la marca</p>
            </div>
            <BrandForm
              onDone={(slug) => {
                window.location.href = `/sponsors/marca/${slug}`;
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
