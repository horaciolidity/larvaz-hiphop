'use client';

import React, { useMemo, useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { CampaignCard } from '@/components/sponsors/cards';
import { BtnLink, EmptyState, Pill, SectionHeading, Tabs } from '@/components/sponsors/ui';
import { formatMoney, isPast } from '@/lib/sponsors/catalog';

type Tab = 'activas' | 'cerradas' | 'todas';

export default function CampanasPage() {
  const { state } = useSponsors();
  const [tab, setTab] = useState<Tab>('activas');

  const groups = useMemo(() => {
    const sorted = [...state.campaigns].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      activas: sorted.filter((c) => c.status === 'activa' && !isPast(c.closes_at)),
      cerradas: sorted.filter((c) => c.status !== 'activa' || isPast(c.closes_at)),
      todas: sorted,
    } satisfies Record<Tab, typeof sorted>;
  }, [state.campaigns]);

  const list = groups[tab];
  const raised = list.reduce((sum, campaign) => sum + campaign.raised_amount, 0);

  return (
    <div className="pb-10">
      <SponsorNav />
      <SectionHeading
        title="APOYAR PROYECTOS"
        subtitle="Campañas de donación de la comunidad. LARVAZ no custodia fondos: cada aporte se verifica con la organización."
        icon={<Heart className="h-6 w-6 text-cyan" />}
        action={
          <BtnLink href="/sponsors/publicar?tab=campana" className="!px-3 !py-2">
            <Plus className="h-3.5 w-3.5" /> Crear proyecto
          </BtnLink>
        }
      />

      <Tabs
        tabs={[
          { id: 'activas', label: 'Activas', count: groups.activas.length },
          { id: 'cerradas', label: 'Cerradas', count: groups.cerradas.length },
          { id: 'todas', label: 'Todas', count: groups.todas.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Pill tone="cyan">{list.length} proyectos</Pill>
        <Pill tone="acid">Recaudación verificada: {formatMoney(raised)}</Pill>
        <Pill tone="orange">Los pendientes no suman</Pill>
      </div>

      {list.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Heart className="h-5 w-5" />}
          title={tab === 'activas' ? 'No hay proyectos activos' : 'Sin proyectos en esta categoría'}
          description="Artistas y marcas pueden crear campañas para financiar videoclips, murales, giras o materiales."
          action={<BtnLink href="/sponsors">Volver a Sponsors</BtnLink>}
        />
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-content-muted">
        Los aportes se registran como pendientes y solo se suman a la recaudación cuando la organización los verifica con
        comprobante o referencia de transacción. LARVAZ no recibe, retiene ni transfiere el dinero.
      </p>
    </div>
  );
}
