'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Trophy } from 'lucide-react';
import { useSponsors } from '@/context/SponsorsContext';
import { SponsorNav } from '@/components/sponsors/SponsorNav';
import { SweepstakeCard } from '@/components/sponsors/cards';
import { BtnLink, EmptyState, Pill, SectionHeading, Tabs } from '@/components/sponsors/ui';
import type { SweepstakeStatus } from '@/types/sponsors';

type Tab = 'activos' | 'proximos' | 'finalizados' | 'todos';

export default function SorteosPage() {
  const { state } = useSponsors();
  const [tab, setTab] = useState<Tab>('activos');

  const groups = useMemo(() => {
    const now = Date.now();
    const sorted = [...state.sweepstakes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      activos: sorted.filter((s) => s.status === 'activo' && new Date(s.ends_at).getTime() > now),
      proximos: sorted.filter((s) => s.status === 'borrador' || new Date(s.starts_at).getTime() > now),
      finalizados: sorted.filter((s) => s.status === 'sorteado' || s.status === 'cerrado' || s.status === 'cancelado'),
      todos: sorted,
    } satisfies Record<Tab, typeof sorted>;
  }, [state.sweepstakes]);

  const list = groups[tab];

  return (
    <div className="pb-10">
      <SponsorNav />
      <SectionHeading
        title="SORTEOS"
        subtitle="Botón, comentarios, likes, números, palabras, mejor comentario o azar. Reglas públicas y sorteo auditable."
        icon={<Trophy className="h-6 w-6 text-acid" />}
        action={
          <BtnLink href="/sponsors/publicar?tab=sorteo" className="!px-3 !py-2">
            <Plus className="h-3.5 w-3.5" /> Crear sorteo
          </BtnLink>
        }
      />

      <Tabs
        tabs={[
          { id: 'activos', label: 'Activos', count: groups.activos.length },
          { id: 'proximos', label: 'Próximos', count: groups.proximos.length },
          { id: 'finalizados', label: 'Finalizados', count: groups.finalizados.length },
          { id: 'todos', label: 'Todos', count: groups.todos.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Pill tone="acid">{list.length} sorteos</Pill>
        <Pill tone="neutral">1 participación por usuario</Pill>
        <Pill tone="cyan">Resultado verificable con semilla pública</Pill>
      </div>

      {list.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((sweepstake) => (
            <SweepstakeCard key={sweepstake.id} sweepstake={sweepstake} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Trophy className="h-5 w-5" />}
          title={tab === 'activos' ? 'No hay sorteos activos' : 'Sin sorteos en esta categoría'}
          description="Cuando una marca publique un sorteo, aparece acá con sus bases, premio y fecha de selección."
          action={<BtnLink href="/sponsors">Volver a Sponsors</BtnLink>}
        />
      )}

      <p className="mt-4 text-[10px] leading-relaxed text-content-muted">
        Los sorteos se realizan con una semilla criptográfica pública y un hash de auditoría que cualquiera puede recomponer.
        Las reglas quedan bloqueadas al iniciar y los premios se entregan con estados verificables.
      </p>
    </div>
  );
}
