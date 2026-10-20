'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldAlert, X, Check } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
}) => {
  const { createReport } = useApp();
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const reasons = [
    { value: 'spam', label: 'Spam comercial o enlaces maliciosos' },
    { value: 'harassment', label: 'Acoso, insultos o violencia' },
    { value: 'inappropriate', label: 'Contenido inapropiado o explícito sin contexto' },
    { value: 'copyright', label: 'Infracción de derechos de autor' },
    { value: 'other', label: 'Otro motivo contrario a las normas de la comunidad' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReport({
      targetType,
      targetId,
      reason,
      details,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface border border-surface-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-magenta/10 border border-magenta/30 text-magenta">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-content-primary tracking-wide">
              DENUNCIAR CONTENIDO
            </h3>
            <p className="text-xs text-content-secondary">
              Reporte confidencial para el equipo de moderación comunitaria.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-acid/20 text-acid mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-content-primary">
              Reporte enviado con éxito
            </p>
            <p className="text-xs text-content-secondary">
              Gracias por ayudar a cuidar el muro de Larvaz Hip-Hop.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-2">
                Motivo del reporte
              </label>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      reason === r.value
                        ? 'border-acid bg-acid/10 text-content-primary font-semibold'
                        : 'border-surface-border bg-surface-elevated text-content-secondary hover:text-content-primary'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={(e) => setReason(e.target.value)}
                      className="accent-[#C6FF00]"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
                Detalles adicionales (opcional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Añade contexto adicional si es necesario..."
                rows={3}
                className="w-full rounded-xl bg-surface-elevated border border-surface-border px-3 py-2 text-xs text-content-primary focus:border-acid focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-bold text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-magenta hover:bg-magenta-hover text-content-primary text-xs font-bold transition-colors shadow-magenta-glow"
              >
                Enviar Denuncia
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
