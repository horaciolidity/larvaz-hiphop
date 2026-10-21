'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function NormasPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 text-xs">
      <div className="p-3 rounded-xl bg-orange/10 border border-orange/30 flex items-start gap-2 text-xs mb-6">
        <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
        <p className="text-content-secondary leading-relaxed">
          <strong className="text-orange">BORRADOR:</strong> Este documento es un texto inicial de referencia. Debe ser revisado y aprobado por el equipo legal antes del lanzamiento público de Larvaz Hip-Hop.
        </p>
      </div>

      <h1 className="font-display font-black text-2xl text-content-primary">NORMAS COMUNITARIAS</h1>
      <div className="space-y-4 text-content-secondary leading-relaxed">
        <p className="font-bold text-acid text-sm">LARVAZ HIPHOP: UNA COMUNIDAD. TODOS LOS ELEMENTOS. UN MISMO LUGAR.</p>
        <ul className="space-y-2 list-disc pl-4">
          <li>Respeta a todos los miembros de la comunidad, independientemente de su disciplina, origen o nivel de experiencia.</li>
          <li>No publiques spam, enlaces de phishing ni publicidad comercial no solicitada.</li>
          <li>Da crédito a los artistas originales cuando compartas su trabajo.</li>
          <li>No hagas doble publicación del mismo contenido.</li>
          <li>Usa las denuncias de forma responsable. Los abusos del sistema pueden resultar en suspensión.</li>
          <li>El diálogo y el debate cultural son bienvenidos. El odio y el acoso no tienen lugar aquí.</li>
        </ul>
      </div>
    </div>
  );
}
