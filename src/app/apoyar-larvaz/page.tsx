'use client';

import React, { useState } from 'react';
import {
  HeartHandshake,
  Server,
  Code2,
  ShieldCheck,
  Sparkles,
  Accessibility,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function ApoyarLarvazPage() {
  const [selectedTier, setSelectedTier] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');

  const providerConfigured = process.env.NEXT_PUBLIC_DONATION_PROVIDER === 'stripe' || process.env.NEXT_PUBLIC_DONATION_PROVIDER === 'mercadopago';

  const sustainabilityPillars = [
    {
      icon: Server,
      title: 'Infraestructura & Servidores',
      desc: 'Bases de datos PostgreSQL, almacenamiento de avatares/portadas y ancho de banda para la PWA comunitaria.',
    },
    {
      icon: Code2,
      title: 'Desarrollo Continuo',
      desc: 'Mantenimiento del código abierto, seguridad, integración de reproductores y mejoras de velocidad.',
    },
    {
      icon: ShieldCheck,
      title: 'Moderación & Cuidado Comunitario',
      desc: 'Herramientas activas para combatir el spam comercial y preservar un espacio cultural underground seguro y respetuoso.',
    },
    {
      icon: Sparkles,
      title: 'Apoyo a Actividades Culturales',
      desc: 'Fondo solidario para difusión de eventos callejeros, premios de cyphers comunitarios y fanzines físicos.',
    },
    {
      icon: Accessibility,
      title: 'Accesibilidad & Rendimiento',
      desc: 'Optimización para que la plataforma funcione rápido en teléfonos modestos y conexiones móviles lentas.',
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-magenta/10 border border-magenta/30 text-magenta text-xs font-bold uppercase tracking-wider">
          <HeartHandshake className="w-4 h-4" />
          <span>Autogestión Comunitaria</span>
        </div>

        <h1 className="font-display font-black text-3xl md:text-4xl text-content-primary tracking-wide">
          SOSTENER LARVAZ HIP-HOP
        </h1>

        <p className="text-xs md:text-sm text-content-secondary leading-relaxed">
          Larvaz no vende datos de sus usuarios, no muestra publicidad invasiva ni divide la cultura para favorecer algoritmos comerciales. La plataforma se sostiene gracias a la autogestión y el compromiso de la comunidad.
        </p>
      </div>

      {/* Transparency Pillars Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-acid">
          ¿En qué se utilizan los aportes voluntarios?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sustainabilityPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-surface border border-surface-border space-y-1.5"
              >
                <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
                  <Icon className="w-4 h-4 text-acid" />
                  <span>{p.title}</span>
                </div>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donation Tiers & Real Status Notice */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-5">
        <div>
          <h2 className="font-display font-black text-xl text-content-primary tracking-wide">
            APORTE VOLUNTARIO
          </h2>
          <p className="text-xs text-content-secondary mt-1">
            Los aportes son estrictamente solidarios y no otorgan ventajas algorítmicas en el feed ni restringen el acceso a nadie.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-3 gap-3">
          {[5, 10, 25].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setSelectedTier(amount);
                setCustomAmount('');
              }}
              className={`p-3 rounded-xl border text-center transition-all ${
                selectedTier === amount && !customAmount
                  ? 'border-acid bg-acid/10 text-acid font-bold shadow-acid-sm'
                  : 'border-surface-border bg-surface-elevated text-content-primary hover:border-content-secondary'
              }`}
            >
              <span className="font-display font-black text-xl block">
                ${amount} USD
              </span>
              <span className="text-[10px] text-content-secondary uppercase">
                Aporte Mensual
              </span>
            </button>
          ))}
        </div>

        {/* Informative Provider Notice (Honest Architecture) */}
        {!providerConfigured ? (
          <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border text-xs space-y-2">
            <div className="flex items-center gap-2 text-orange font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Integración de Pasarela de Pago en Preparación</span>
            </div>
            <p className="text-content-secondary leading-relaxed text-[11px]">
              La plataforma no simula cobros falsos con tarjetas ni almacena datos financieros. La infraestructura está lista para conectarse con webhooks seguros de <strong>Stripe</strong> o <strong>MercadoPago</strong> tan pronto se definan las llaves en <code className="text-acid">.env.local</code>.
            </p>
            <div className="pt-2 text-[11px] text-content-muted">
              Si deseas colaborar directamente con el colectivo mientras se activa la pasarela, contáctanos en <span className="text-acid font-mono">contacto@larvazhiphop.org</span>.
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full py-3.5 rounded-xl bg-magenta text-content-primary font-bold text-xs uppercase tracking-wider shadow-magenta-glow hover:bg-magenta-hover transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Proceder al Checkout Seguro (${customAmount || selectedTier} USD)</span>
          </button>
        )}
      </div>

      {/* Commitment */}
      <div className="p-4 rounded-xl border border-surface-border/60 bg-surface/40 text-center text-xs text-content-secondary space-y-1">
        <p className="font-bold text-content-primary">
          Compromiso de Autenticidad Cultural
        </p>
        <p className="text-[11px]">
          LARVAZ HIPHOP — UNA COMUNIDAD. TODOS LOS ELEMENTOS. UN MISMO LUGAR.
        </p>
      </div>
    </div>
  );
}
