'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function PrivacidadPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 text-xs">
      <div className="p-3 rounded-xl bg-orange/10 border border-orange/30 flex items-start gap-2 text-xs mb-6">
        <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
        <p className="text-content-secondary leading-relaxed">
          <strong className="text-orange">BORRADOR:</strong> Este documento es un texto inicial de referencia. Debe ser revisado y aprobado por el equipo legal antes del lanzamiento público de Larvaz Hip-Hop.
        </p>
      </div>

      <h1 className="font-display font-black text-2xl text-content-primary">POLÍTICA DE PRIVACIDAD</h1>
      <div className="space-y-4 text-content-secondary leading-relaxed">
        <p>Larvaz Hip-Hop respeta tu privacidad. Solo recopilamos los datos necesarios para el funcionamiento de la plataforma comunitaria.</p>
        <h2 className="font-bold text-content-primary text-sm">Datos que recopilamos</h2>
        <p>Nombre de usuario, correo electrónico, contenido publicado voluntariamente (publicaciones, comentarios), y datos técnicos de sesión para la autenticación segura mediante Supabase Auth.</p>
        <h2 className="font-bold text-content-primary text-sm">Lo que nunca hacemos</h2>
        <p>No vendemos tus datos a terceros. No mostramos publicidad conductual. No almacenamos datos de tarjetas bancarias. No compartimos tu información privada con otras plataformas.</p>
        <h2 className="font-bold text-content-primary text-sm">Tus derechos</h2>
        <p>Puedes solicitar la eliminación de tu cuenta y todos tus datos en cualquier momento escribiendo a contacto@larvazhiphop.org.</p>
      </div>
    </div>
  );
}
