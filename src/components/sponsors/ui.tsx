'use client';

import React from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  ChevronDown,
  Clock,
  Crown,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { SponsorBrand, SponsorPrize } from '@/types/sponsors';
import { BRAND_STATUS_LABEL, initials } from '@/lib/sponsors/catalog';

// ============================================================================
// Primitivas visuales del segmento LARVAZ SPONSORS
// ============================================================================

export const sponsorCard =
  'rounded-2xl border border-surface-border bg-surface/80 backdrop-blur-sm overflow-hidden';

export function SectionHeading({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="font-display text-2xl md:text-3xl font-black tracking-wide text-content-primary flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {subtitle ? <p className="text-xs text-content-secondary mt-1 leading-relaxed">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type Tone = 'acid' | 'magenta' | 'cyan' | 'orange' | 'neutral' | 'success' | 'danger';

const toneMap: Record<Tone, string> = {
  acid: 'bg-acid/10 text-acid border-acid/30',
  magenta: 'bg-magenta/10 text-magenta border-magenta/30',
  cyan: 'bg-cyan/10 text-cyan border-cyan/30',
  orange: 'bg-orange/10 text-orange border-orange/30',
  neutral: 'bg-surface-elevated text-content-secondary border-surface-border',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  danger: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export function Pill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${toneMap[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SponsorBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-acid px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-background">
      <Crown className="h-2.5 w-2.5" />
      Sponsor
    </span>
  );
}

export function VerifiedBadge({ brand }: { brand?: SponsorBrand }) {
  if (!brand) return null;
  if (brand.verification === 'verificada') {
    return (
      <Pill tone="acid">
        <BadgeCheck className="h-3 w-3" /> Verificada
      </Pill>
    );
  }
  return <Pill tone={brand.verification === 'rechazada' || brand.verification === 'suspendida' ? 'danger' : 'neutral'}>{BRAND_STATUS_LABEL[brand.verification]}</Pill>;
}

export function BrandAvatar({
  brand,
  size = 48,
  className = '',
}: {
  brand?: SponsorBrand | null;
  size?: number;
  className?: string;
}) {
  if (!brand) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-surface-elevated text-content-muted ${className}`}
        style={{ width: size, height: size }}
      >
        <Crown className="h-5 w-5" />
      </div>
    );
  }
  return brand.logo_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.logo_url}
      alt={brand.name}
      className={`rounded-xl object-cover bg-surface-elevated ${className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`flex items-center justify-center rounded-xl bg-acid/15 text-acid font-display font-black ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials(brand.name)}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'acid',
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-elevated/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-content-muted font-bold">{label}</p>
      <p className={`mt-1 font-display text-2xl font-black leading-none ${tone === 'acid' ? 'text-acid' : tone === 'magenta' ? 'text-magenta' : tone === 'cyan' ? 'text-cyan' : tone === 'orange' ? 'text-orange' : 'text-content-primary'}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[10px] text-content-muted leading-tight">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-border bg-surface/40 p-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-acid/10 text-acid">
        {icon || <Sparkles className="h-5 w-5" />}
      </div>
      <h3 className="font-display text-lg font-black text-content-primary">{title}</h3>
      {description ? <p className="mx-auto mt-1 max-w-md text-xs text-content-secondary leading-relaxed">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Notice({ error, success }: { error?: string | null; success?: string | null }) {
  if (!error && !success) return null;
  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-xs ${
        error ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      }`}
    >
      {error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      <span className="leading-relaxed">{error || success}</span>
    </div>
  );
}

export function ProgressBar({ value, goal, currency }: { value: number; goal: number; currency: string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          className="h-full rounded-full bg-gradient-to-r from-acid via-acid to-cyan transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-content-secondary">
        <span className="font-bold text-acid">
          {value.toLocaleString('es-AR')} {currency} recaudados
        </span>
        <span>{pct}% de {goal.toLocaleString('es-AR')} {currency}</span>
      </div>
    </div>
  );
}

export function Countdown({ dateIso, label }: { dateIso: string; label: string }) {
  const diff = new Date(dateIso).getTime() - Date.now();
  if (Number.isNaN(diff)) return null;
  const past = diff <= 0;
  const days = Math.floor(Math.abs(diff) / 86_400_000);
  const hours = Math.floor((Math.abs(diff) % 86_400_000) / 3_600_000);
  const mins = Math.floor((Math.abs(diff) % 3_600_000) / 60_000);
  const text = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${past ? 'text-content-muted' : 'text-orange'}`}>
      <Clock className="h-3 w-3" />
      {past ? `${label} finalizado` : `${label} ${text}`}
    </span>
  );
}

// ---------------------------------------------------------------- formularios

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-content-secondary">
        {label}
        {required ? <span className="text-magenta">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[10px] text-content-muted leading-snug">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-surface-border bg-surface-elevated px-3 py-2.5 text-sm text-content-primary placeholder:text-content-muted outline-none transition focus:border-acid/60 focus:ring-2 focus:ring-acid/20';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return <input {...rest} className={`${inputClass} ${className}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;
  return <textarea {...rest} className={`${inputClass} min-h-[96px] resize-y ${className}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props;
  return (
    <div className="relative">
      <select {...rest} className={`${inputClass} appearance-none pr-8 ${className}`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
    </div>
  );
}

export function Check({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-surface-border bg-surface-elevated/50 p-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-acid"
      />
      <span>
        <span className="block text-xs font-semibold text-content-primary">{label}</span>
        {hint ? <span className="block text-[10px] text-content-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------- botones

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'magenta';

const btnMap: Record<BtnVariant, string> = {
  primary: 'bg-acid text-background hover:bg-acid-hover shadow-acid-sm',
  secondary: 'border border-surface-border bg-surface-elevated text-content-primary hover:bg-surface-hover',
  ghost: 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated',
  danger: 'border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20',
  magenta: 'bg-magenta text-white hover:bg-magenta-hover shadow-magenta-glow',
};

const btnBase =
  'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50';

export function Btn({
  variant = 'primary',
  loading,
  className = '',
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean }) {
  return (
    <button {...rest} disabled={rest.disabled || loading} className={`${btnBase} ${btnMap[variant]} ${className}`}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function BtnLink({
  href,
  variant = 'primary',
  className = '',
  children,
}: {
  href: string;
  variant?: BtnVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${btnBase} ${btnMap[variant]} ${className}`}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------- modal

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border border-surface-border bg-surface p-4 sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-display text-xl font-black text-content-primary">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-content-secondary hover:bg-surface-elevated hover:text-content-primary"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        {footer ? <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- premios

export function prizeEmoji(kind: SponsorPrize['kind']): string {
  switch (kind) {
    case 'dinero':
      return '💵';
    case 'cripto':
      return '🪙';
    case 'producto':
      return '📦';
    case 'servicio':
      return '🛠️';
    case 'experiencia':
      return '🎟️';
    case 'beca':
      return '🎓';
    case 'patrocinio':
      return '🤝';
    default:
      return '🎁';
  }
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-surface-border bg-surface p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition ${
            active === tab.id ? 'bg-acid text-background' : 'text-content-secondary hover:bg-surface-elevated hover:text-content-primary'
          }`}
        >
          {tab.label}
          {typeof tab.count === 'number' ? (
            <span className={`rounded-full px-1.5 text-[9px] ${active === tab.id ? 'bg-background/20' : 'bg-surface-elevated'}`}>
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
