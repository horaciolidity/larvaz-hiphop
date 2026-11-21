'use client';

import React from 'react';
import type { HipHopDiscipline } from '@/types';
import { CORE_DISCIPLINES } from '@/lib/disciplines';

interface DisciplinePickerProps {
  value: HipHopDiscipline[];
  onChange: (next: HipHopDiscipline[]) => void;
  compact?: boolean;
  label?: string;
  hint?: string;
}

/**
 * Selector múltiple de las cuatro ramas del hip-hop.
 * La misma pieza se usa en el perfil y en el compositor del muro para que la
 * experiencia sea idéntica en todos los elementos.
 */
export const DisciplinePicker: React.FC<DisciplinePickerProps> = ({
  value,
  onChange,
  compact = false,
  label = '¿A qué ramas te dedicás?',
  hint = 'Podés elegir una o varias. MC, DJ, Graffiti y Breaking conviven en el mismo muro.',
}) => {
  const selected = new Set(value);

  const toggle = (id: HipHopDiscipline) => {
    if (selected.has(id)) {
      onChange(value.filter((item) => item !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {!compact && (
        <div>
          <p className="text-xs font-bold text-content-secondary uppercase tracking-wider">
            {label}
          </p>
          <p className="text-[11px] text-content-muted mt-0.5">{hint}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {CORE_DISCIPLINES.map((discipline) => {
          const active = selected.has(discipline.id);
          return (
            <button
              key={discipline.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(discipline.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border transition-all active:scale-95 ${
                compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
              } font-bold ${
                active
                  ? discipline.accent
                  : 'bg-surface-elevated border-surface-border text-content-secondary hover:text-content-primary hover:border-content-secondary/50'
              }`}
            >
              <span aria-hidden="true">{discipline.emoji}</span>
              <span>{compact ? discipline.shortLabel : discipline.label}</span>
              {active && <span className="text-[10px] leading-none">✓</span>}
            </button>
          );
        })}
      </div>
      {compact && (
        <p className="text-[10px] text-content-muted">
          Sumá una o varias ramas para que la comunidad te encuentre.
        </p>
      )}
    </div>
  );
};

export default DisciplinePicker;
