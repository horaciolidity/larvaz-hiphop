'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, AlertTriangle } from 'lucide-react';

const DRAFT_NOTICE = (
  <div className="p-3 rounded-xl bg-orange/10 border border-orange/30 flex items-start gap-2 text-xs mb-6">
    <AlertTriangle className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
    <p className="text-content-secondary leading-relaxed">
      <strong className="text-orange">BORRADOR:</strong> Este documento es un texto inicial de referencia. Debe ser revisado y aprobado por el equipo legal antes del lanzamiento público de Larvaz Hip-Hop.
    </p>
  </div>
);

export function PrivacidadPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 text-xs">
      {DRAFT_NOTICE}
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

export function TerminosPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 text-xs">
      {DRAFT_NOTICE}
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

export function NormasPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 text-xs">
      {DRAFT_NOTICE}
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

export default PrivacidadPage;
