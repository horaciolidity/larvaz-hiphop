'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function TerminosPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 text-xs">
      <div className="p-3 rounded-xl bg-orange/10 border border-orange/30 flex items-start gap-2 text-xs mb-6">
        <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
        <p className="text-content-secondary leading-relaxed">
          <strong className="text-orange">BORRADOR:</strong> Este documento es un texto inicial de referencia. Debe ser revisado y aprobado por el equipo legal antes del lanzamiento público de Larvaz Hip-Hop.
        </p>
      </div>

      <h1 className="font-display font-black text-2xl text-content-primary">TÉRMINOS DE USO</h1>
      <div className="space-y-4 text-content-secondary leading-relaxed">
        <p>Al usar Larvaz Hip-Hop aceptas estos términos. La plataforma es un espacio comunitario sin fines de lucro para la cultura hip-hop.</p>
        <h2 className="font-bold text-content-primary text-sm">Conducta en la plataforma</h2>
        <p>Está prohibido el spam comercial, el acoso, la difusión de contenido ilegal y la suplantación de identidad. Los moderadores pueden retirar contenido que viole estas normas.</p>
        <h2 className="font-bold text-content-primary text-sm">Propiedad del contenido</h2>
        <p>Los enlaces que publicas apuntan a plataformas externas de tu propiedad. Larvaz no reclama derechos sobre tu obra artística. No subas contenido ajeno sin permiso del autor.</p>
      </div>
    </div>
  );
}
