'use client';

import React, { useMemo, useState } from 'react';
import { Flame, Plus } from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { ChallengeCard } from '@/components/sponsors/cards';
import { BtnLink, EmptyState, Pill, SectionHeading, Tabs } from '@/components/sponsors/ui';

type Tab = 'abiertos' | 'cerrados' | 'todos';

export default function DesafiosPage() {
  const { state } = useSponsors();
  const [tab, setTab] = useState<Tab>('abiertos');

  const groups = useMemo(() => {
    const sorted = [...state.challenges].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      abiertos: sorted.filter((c) => c.status === 'abierto' && new Date(c.deadline).getTime() > Date.now()),
      cerrados: sorted.filter((c) => c.status !== 'abierto' || new Date(c.deadline).getTime() <= Date.now()),
      todos: sorted,
    } satisfies Record<Tab, typeof sorted>;
  }, [state.challenges]);

  const list = groups[tab];

  return (
    <div className="pb-10">
      <SponsorNav />
      <SectionHeading
        title="LARVAZ CHALLENGES"
        subtitle="Desafíos de marcas para la comunidad: MC, DJ, graffiti, breaking, producción y más."
        icon={<Flame className="h-6 w-6 text-magenta" />}
        action={
          <BtnLink href="/sponsors/publicar?tab=desafio" className="!px-3 !py-2">
            <Plus className="h-3.5 w-3.5" /> Crear desafío
          </BtnLink>
        }
      />

      <Tabs
        tabs={[
          { id: 'abiertos', label: 'Abiertos', count: groups.abiertos.length },
          { id: 'cerrados', label: 'Cerrados', count: groups.cerrados.length },
          { id: 'todos', label: 'Todos', count: groups.todos.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Pill tone="magenta">{list.length} desafíos</Pill>
        <Pill tone="neutral">Un trabajo por usuario</Pill>
        <Pill tone="cyan">Votación abierta o jurado con criterios</Pill>
      </div>

      {list.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Flame className="h-5 w-5" />}
          title={tab === 'abiertos' ? 'No hay desafíos abiertos' : 'Sin desafíos en esta categoría'}
          description="Los desafíos se publican desde el panel de una marca. Cada trabajo se presenta una única vez y la votación no permite duplicados."
          action={<BtnLink href="/sponsors">Volver a Sponsors</BtnLink>}
        />
      )}
    </div>
  );
}
