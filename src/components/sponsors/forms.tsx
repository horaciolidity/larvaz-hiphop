'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import type {
  CounterpartKind,
  SponsorArtistCategory,
  SponsorCommercialCategory,
  SponsorshipOffer,
  SponsorshipType,
  SweepstakeMethod,
  SponsorPrize,
} from '@/types/sponsors';
import {
  ARTIST_CATEGORIES,
  COMMERCIAL_CATEGORIES,
  COUNTRIES,
  COUNTERPART_KINDS,
  SWEEPSTAKE_METHODS,
} from '@/lib/sponsors/catalog';
import type { BrandInput, CampaignInput, ChallengeInput, OpportunityInput, SweepstakeInput } from '@/lib/sponsors/store';
import { uploadMediaFile } from '@/lib/media-upload';
import { useSponsors } from '@/context/SponsorsContext';
import { Btn, Check, Field, Input, Notice, Select, Textarea } from './ui';

// ============================================================================
// Utilidades de formulario
// ============================================================================

export function isoToLocalInput(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export function localInputToIso(value: string): string {
  if (!value) return '';
  return new Date(value).toISOString();
}

const splitList = (value: string) =>
  value
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);

export function ChipToggle<T extends string>({
  items,
  selected,
  onToggle,
  tone = 'acid',
}: {
  items: { id: T; label: string; emoji?: string }[];
  selected: T[];
  onToggle: (id: T) => void;
  tone?: 'acid' | 'magenta' | 'cyan';
}) {
  const activeClass =
    tone === 'magenta'
      ? 'border-magenta bg-magenta/15 text-magenta'
      : tone === 'cyan'
        ? 'border-cyan bg-cyan/15 text-cyan'
        : 'border-acid bg-acid/15 text-acid';
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const active = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
              active ? activeClass : 'border-surface-border bg-surface-elevated text-content-secondary hover:text-content-primary'
            }`}
          >
            {item.emoji ? `${item.emoji} ` : ''}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function ImageInput({
  value,
  onChange,
  label = 'Imagen',
  aspect = 'h-28',
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  label?: string;
  aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadMediaFile(file, 'image');
      onChange(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label={label}>
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-surface-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className={`w-full ${aspect} object-cover`} />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute right-2 top-2 rounded-lg bg-background/80 p-1 text-content-primary"
            aria-label="Quitar imagen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-surface-border bg-surface-elevated/50 px-3 py-4 text-[11px] font-bold text-content-secondary hover:border-acid/40 hover:text-content-primary">
          <Upload className="h-4 w-4" />
          {uploading ? 'Subiendo…' : 'Subir imagen'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}
      {error ? <p className="mt-1 text-[10px] text-red-400">{error}</p> : null}
    </Field>
  );
}

// ============================================================================
// Perfil de marca
// ============================================================================

export function BrandForm({
  onDone,
  onCancel,
  initial,
  brandId,
}: {
  onDone?: (slug: string) => void;
  onCancel?: () => void;
  initial?: Partial<BrandInput>;
  brandId?: string;
}) {
  const { actor, store } = useSponsors();
  const [form, setForm] = useState<BrandInput>({
    name: initial?.name || '',
    description: initial?.description || '',
    category: initial?.category || 'indumentaria',
    country: initial?.country || 'Argentina',
    province: initial?.province || '',
    city: initial?.city || '',
    logo_url: initial?.logo_url,
    cover_url: initial?.cover_url,
    website: initial?.website || '',
    instagram: initial?.instagram || '',
    tiktok: initial?.tiktok || '',
    facebook: initial?.facebook || '',
    contact_name: initial?.contact_name || '',
    contact_email: initial?.contact_email || '',
    contact_phone: initial?.contact_phone || '',
    seeking_categories: initial?.seeking_categories || [],
    interest_locations: initial?.interest_locations || [],
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof BrandInput>(key: K, value: BrandInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSeeking = (id: SponsorArtistCategory) =>
    set(
      'seeking_categories',
      form.seeking_categories.includes(id)
        ? form.seeking_categories.filter((x) => x !== id)
        : [...form.seeking_categories, id]
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = brandId
      ? store.updateBrand(actor, brandId, form)
      : store.createBrand(actor, form);
    setSaving(false);
    if (!res.ok || !res.data) {
      setError(res.error || 'No se pudo guardar la marca.');
      return;
    }
    setError(null);
    onDone?.(res.data.slug);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Notice error={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre de la marca" required>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej: Muro Libre Supply" maxLength={60} />
        </Field>
        <Field label="Rubro comercial" required>
          <Select value={form.category} onChange={(e) => set('category', e.target.value as SponsorCommercialCategory)}>
            {COMMERCIAL_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Descripción" required hint="Qué hace la marca, qué ofrece y cómo apoya a la cultura.">
        <Textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Somos una tienda de indumentaria urbana…"
          maxLength={900}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <ImageInput value={form.logo_url} onChange={(url) => set('logo_url', url)} label="Logo" aspect="h-24" />
        <ImageInput value={form.cover_url} onChange={(url) => set('cover_url', url)} label="Portada" aspect="h-24" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="País" required>
          <Select value={form.country} onChange={(e) => set('country', e.target.value)}>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Provincia / Estado">
          <Input value={form.province} onChange={(e) => set('province', e.target.value)} placeholder="Buenos Aires" />
        </Field>
        <Field label="Ciudad" required>
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Ciudad Autónoma" />
        </Field>
        <Field label="Sitio web">
          <Input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://mimarca.com" />
        </Field>
        <Field label="Instagram">
          <Input value={form.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@mimarca" />
        </Field>
        <Field label="TikTok">
          <Input value={form.tiktok} onChange={(e) => set('tiktok', e.target.value)} placeholder="@mimarca" />
        </Field>
        <Field label="Facebook">
          <Input value={form.facebook} onChange={(e) => set('facebook', e.target.value)} placeholder="/mimarca" />
        </Field>
        <Field label="Datos de contacto">
          <Input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Nombre y apellido" />
        </Field>
        <Field label="Email de contacto">
          <Input value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="hola@mimarca.com" />
        </Field>
        <Field label="Teléfono / WhatsApp">
          <Input value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="+54 9 11 …" />
        </Field>
      </div>

      <Field label="Categorías de artistas que buscás">
        <ChipToggle items={ARTIST_CATEGORIES} selected={form.seeking_categories} onToggle={toggleSeeking} />
      </Field>

      <Field label="Ubicaciones de interés" hint="Escribí países o ciudades separadas por coma.">
        <Input
          value={form.interest_locations.join(', ')}
          onChange={(e) => set('interest_locations', splitList(e.target.value))}
          placeholder="Argentina, Chile, CDMX"
        />
      </Field>

      <p className="rounded-lg border border-surface-border bg-surface-elevated/60 p-2.5 text-[10px] leading-relaxed text-content-muted">
        Las marcas nuevas quedan <span className="font-bold text-content-primary">pendientes de verificación</span> por el
        equipo LARVAZ. Las cuentas administrativas se verifican automáticamente para poder probar el flujo completo.
      </p>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Btn type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Btn>
        ) : null}
        <Btn type="submit" loading={saving}>
          {brandId ? 'Guardar cambios' : 'Crear perfil de marca'}
        </Btn>
      </div>
    </form>
  );
}

// ============================================================================
// Oportunidad de patrocinio
// ============================================================================

const emptyCounterpart = () => ({
  kind: 'publicaciones' as CounterpartKind,
  description: '',
  quantity: 1,
  platform: '',
  due_date: '',
  evidence_required: '',
});

export function OpportunityForm({
  brandId,
  onCreated,
  onCancel,
}: {
  brandId: string;
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}) {
  const { actor, store } = useSponsors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [type, setType] = useState<SponsorshipType>('economico');
  const [modality, setModality] = useState<'unico' | 'mensual' | 'proyecto' | 'campana'>('unico');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [products, setProducts] = useState('');
  const [logistics, setLogistics] = useState('');
  const [summary, setSummary] = useState('');
  const [crypto, setCrypto] = useState({ asset: 'USDT', blockchain: 'Ethereum', network: 'Polygon', amount: '', receiving_address: '' });
  const [categories, setCategories] = useState<SponsorArtistCategory[]>([]);
  const [counterparts, setCounterparts] = useState([emptyCounterpart()]);
  const [country, setCountry] = useState('Argentina');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [duration, setDuration] = useState('30');
  const [deadline, setDeadline] = useState(isoToLocalInput(new Date(Date.now() + 14 * 86_400_000).toISOString()));
  const [slots, setSlots] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (id: SponsorArtistCategory) =>
    setCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const updateCounterpart = (index: number, patch: Partial<ReturnType<typeof emptyCounterpart>>) =>
    setCounterparts((prev) => prev.map((cp, i) => (i === index ? { ...cp, ...patch } : cp)));

  const buildOffer = (): SponsorshipOffer => {
    const offer: SponsorshipOffer = {
      type,
      payment_modality: type === 'economico' || type === 'mixto' ? modality : undefined,
      amount: amount ? Number(amount) : undefined,
      currency,
      products: splitList(products),
      logistics: splitList(logistics),
      summary,
    };
    if (type === 'cripto' || type === 'mixto') {
      offer.crypto = {
        asset: crypto.asset,
        blockchain: crypto.blockchain,
        network: crypto.network,
        amount: Number(crypto.amount || amount || 0),
        receiving_address: crypto.receiving_address || undefined,
        status: 'pendiente',
      };
    }
    return offer;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const input: OpportunityInput = {
      brand_id: brandId,
      title,
      description,
      image_url: imageUrl,
      offer: buildOffer(),
      artist_categories: categories,
      counterparts: counterparts
        .filter((cp) => cp.description.trim())
        .map((cp) => ({
          kind: cp.kind,
          description: cp.description,
          quantity: Number(cp.quantity) || 1,
          platform: cp.platform || undefined,
          due_date: cp.due_date ? localInputToIso(cp.due_date) : undefined,
          evidence_required: cp.evidence_required || undefined,
        })),
      country,
      province,
      city,
      is_remote: isRemote,
      duration_days: Number(duration) || 30,
      deadline: localInputToIso(deadline),
      slots: Number(slots) || 1,
      status: 'abierta',
    };
    const res = store.createOpportunity(actor, input);
    setSaving(false);
    if (!res.ok || !res.data) {
      setError(res.error || 'No se pudo publicar la propuesta.');
      return;
    }
    setError(null);
    onCreated?.(res.data.id);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Notice error={error} />

      <Field label="Título de la convocatoria" required>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="3 MCs para campaña de zapatillas" maxLength={90} />
      </Field>
      <Field label="Descripción" required hint="Contexto, objetivo de la campaña y qué esperás del artista.">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1200} />
      </Field>
      <ImageInput value={imageUrl} onChange={setImageUrl} label="Imagen de la propuesta" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo de patrocinio" required>
          <Select value={type} onChange={(e) => setType(e.target.value as SponsorshipType)}>
            <option value="economico">Económico</option>
            <option value="productos">Productos</option>
            <option value="logistico">Logístico</option>
            <option value="mixto">Mixto</option>
            <option value="cripto">Criptomonedas</option>
          </Select>
        </Field>
        {(type === 'economico' || type === 'mixto') && (
          <Field label="Modalidad de pago">
            <Select value={modality} onChange={(e) => setModality(e.target.value as typeof modality)}>
              <option value="unico">Pago único</option>
              <option value="mensual">Pago mensual</option>
              <option value="proyecto">Pago por proyecto</option>
              <option value="campana">Pago por campaña</option>
            </Select>
          </Field>
        )}
        <Field label="Monto (si aplica)">
          <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="450" />
        </Field>
        <Field label="Moneda">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
            <option value="CLP">CLP</option>
            <option value="COP">COP</option>
            <option value="MXN">MXN</option>
            <option value="EUR">EUR</option>
          </Select>
        </Field>
      </div>

      {(type === 'productos' || type === 'mixto') && (
        <Field label="Productos incluidos" hint="Separalos con coma.">
          <Input value={products} onChange={(e) => setProducts(e.target.value)} placeholder="2 pares de zapatillas, hoodie, gorra" />
        </Field>
      )}

      {(type === 'logistico' || type === 'mixto') && (
        <Field label="Logística incluida" hint="Viáticos, transporte, alojamiento, comidas, entradas.">
          <Input value={logistics} onChange={(e) => setLogistics(e.target.value)} placeholder="Hospedaje 3 noches, transporte, comidas" />
        </Field>
      )}

      {(type === 'cripto' || type === 'mixto') && (
        <div className="rounded-xl border border-cyan/25 bg-cyan/5 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-cyan">Pago en criptomonedas</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Activo digital">
              <Input value={crypto.asset} onChange={(e) => setCrypto({ ...crypto, asset: e.target.value })} placeholder="USDT" />
            </Field>
            <Field label="Blockchain">
              <Input value={crypto.blockchain} onChange={(e) => setCrypto({ ...crypto, blockchain: e.target.value })} placeholder="Ethereum" />
            </Field>
            <Field label="Red">
              <Input value={crypto.network} onChange={(e) => setCrypto({ ...crypto, network: e.target.value })} placeholder="Polygon" />
            </Field>
            <Field label="Monto cripto">
              <Input type="number" min={0} value={crypto.amount} onChange={(e) => setCrypto({ ...crypto, amount: e.target.value })} />
            </Field>
          </div>
          <Field label="Dirección de recepción del artista" hint="Se acuerda con el artista antes de transferir. LARVAZ no custodia fondos.">
            <Input
              value={crypto.receiving_address}
              onChange={(e) => setCrypto({ ...crypto, receiving_address: e.target.value })}
              placeholder="0x…"
            />
          </Field>
          <p className="mt-1 text-[10px] leading-relaxed text-content-muted">
            Estado inicial: pendiente. La confirmación depende del comprobante y la verificación en la red. No se simulan pagos.
          </p>
        </div>
      )}

      <Field label="Resumen del beneficio" required>
        <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="USD 450 + 2 pares de zapatillas + traslados" maxLength={160} />
      </Field>

      <Field label="Tipo de artista buscado" required>
        <ChipToggle items={ARTIST_CATEGORIES} selected={categories} onToggle={toggleCategory} tone="magenta" />
      </Field>

      <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-wider text-content-secondary">Contraprestaciones</p>
          <button
            type="button"
            onClick={() => setCounterparts((prev) => [...prev, emptyCounterpart()])}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-acid"
          >
            <Plus className="h-3 w-3" /> Agregar
          </button>
        </div>
        <div className="space-y-2">
          {counterparts.map((cp, index) => (
            <div key={index} className="rounded-lg border border-surface-border bg-surface p-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Tipo">
                  <Select
                    value={cp.kind}
                    onChange={(e) => updateCounterpart(index, { kind: e.target.value as CounterpartKind })}
                  >
                    {COUNTERPART_KINDS.map((kind) => (
                      <option key={kind.id} value={kind.id}>
                        {kind.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Cantidad">
                  <Input
                    type="number"
                    min={1}
                    value={cp.quantity}
                    onChange={(e) => updateCounterpart(index, { quantity: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <Field label="Descripción" required>
                <Input
                  value={cp.description}
                  onChange={(e) => updateCounterpart(index, { description: e.target.value })}
                  placeholder="Reel de 45 segundos para el lanzamiento"
                />
              </Field>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Plataforma">
                  <Input value={cp.platform} onChange={(e) => updateCounterpart(index, { platform: e.target.value })} placeholder="Instagram / TikTok" />
                </Field>
                <Field label="Fecha límite">
                  <Input type="datetime-local" value={cp.due_date} onChange={(e) => updateCounterpart(index, { due_date: e.target.value })} />
                </Field>
              </div>
              <Field label="Evidencia solicitada">
                <Input
                  value={cp.evidence_required}
                  onChange={(e) => updateCounterpart(index, { evidence_required: e.target.value })}
                  placeholder="Link público de la publicación"
                />
              </Field>
              {counterparts.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setCounterparts((prev) => prev.filter((_, i) => i !== index))}
                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-400"
                >
                  <Trash2 className="h-3 w-3" /> Quitar
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="País">
          <Select value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Provincia / Estado">
          <Input value={province} onChange={(e) => setProvince(e.target.value)} />
        </Field>
        <Field label="Ciudad" required>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="CDMX" />
        </Field>
        <Field label="Duración (días)">
          <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
        <Field label="Fecha límite de postulación" required>
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Cantidad de artistas" required>
          <Input type="number" min={1} value={slots} onChange={(e) => setSlots(e.target.value)} />
        </Field>
      </div>

      <Check checked={isRemote} onChange={setIsRemote} label="La colaboración puede ser remota" />

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Btn type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Btn>
        ) : null}
        <Btn type="submit" loading={saving}>
          Publicar propuesta
        </Btn>
      </div>
    </form>
  );
}

// ============================================================================
// Sorteo
// ============================================================================

export function SweepstakeForm({
  brandId,
  onCreated,
  onCancel,
}: {
  brandId: string;
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}) {
  const { actor, store } = useSponsors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeImage, setPrizeImage] = useState<string | undefined>();
  const [prizeTitle, setPrizeTitle] = useState('');
  const [prizeKind, setPrizeKind] = useState<SponsorPrize['kind']>('producto');
  const [prizeCategory, setPrizeCategory] = useState<SponsorArtistCategory>('otros');
  const [prizeValue, setPrizeValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [winners, setWinners] = useState('1');
  const [startsAt, setStartsAt] = useState(isoToLocalInput(new Date().toISOString()));
  const [endsAt, setEndsAt] = useState(isoToLocalInput(new Date(Date.now() + 10 * 86_400_000).toISOString()));
  const [drawAt, setDrawAt] = useState(isoToLocalInput(new Date(Date.now() + 10 * 86_400_000 + 3_600_000).toISOString()));
  const [countries, setCountries] = useState<string[]>([]);
  const [requirements, setRequirements] = useState('Ser mayor de 18 años\nTener perfil en LARVAZ');
  const [rules, setRules] = useState('');
  const [method, setMethod] = useState<SweepstakeMethod>('boton');
  const [delivery, setDelivery] = useState('Envío nacional por correo o entrega coordinada.');
  const [likesRequired, setLikesRequired] = useState(false);
  const [commentMode, setCommentMode] = useState<'libre' | 'palabra' | 'pregunta' | 'creativo' | 'adivinanza'>('palabra');
  const [requiredWord, setRequiredWord] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [numMode, setNumMode] = useState<'exacto' | 'cercano' | 'primero' | 'aleatorio_acertantes'>('aleatorio_acertantes');
  const [numMin, setNumMin] = useState('1');
  const [numMax, setNumMax] = useState('100');
  const [numSecret, setNumSecret] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [hints, setHints] = useState('');
  const [criteria, setCriteria] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const input: SweepstakeInput = {
      brand_id: brandId,
      title,
      description,
      prize_image_url: prizeImage,
      prize_title: prizeTitle || title,
      prize_kind: prizeKind,
      prize_value: prizeValue ? Number(prizeValue) : undefined,
      currency,
      category: prizeCategory,
      winners_count: Number(winners) || 1,
      starts_at: localInputToIso(startsAt),
      ends_at: localInputToIso(endsAt),
      draw_at: localInputToIso(drawAt),
      countries,
      requirements: splitList(requirements.replace(/\n/g, ',')),
      rules,
      method,
      delivery_method: delivery,
      likes_required: likesRequired,
      post_body: description,
      post_image_url: prizeImage,
      comment_rule:
        method === 'comentarios' || method === 'mejor_comentario'
          ? {
              mode: method === 'mejor_comentario' ? 'creativo' : commentMode,
              required_word: requiredWord || undefined,
              question: question || undefined,
              answer: answer || undefined,
            }
          : undefined,
      number_rule:
        method === 'numeros'
          ? { mode: numMode, min: Number(numMin), max: Number(numMax), secret: Number(numSecret) }
          : undefined,
      word_rule:
        method === 'palabras'
          ? { secret: secretWord, hints: splitList(hints) }
          : undefined,
      judging: method === 'mejor_comentario' ? { criteria } : undefined,
    };
    const res = store.createSweepstake(actor, input);
    setSaving(false);
    if (!res.ok || !res.data) {
      setError(res.error || 'No se pudo crear el sorteo.');
      return;
    }
    setError(null);
    onCreated?.(res.data.id);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Notice error={error} />

      <Field label="Nombre del sorteo" required>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Zapatilla edición cypher + kit" maxLength={90} />
      </Field>
      <Field label="Descripción" required>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={800} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <ImageInput value={prizeImage} onChange={setPrizeImage} label="Imagen del premio" />
        <div className="space-y-3">
          <Field label="Nombre del premio">
            <Input value={prizeTitle} onChange={(e) => setPrizeTitle(e.target.value)} placeholder="Zapatilla edición cypher" />
          </Field>
          <Field label="Tipo de premio">
            <Select value={prizeKind} onChange={(e) => setPrizeKind(e.target.value as SponsorPrize['kind'])}>
              <option value="producto">Producto / indumentaria</option>
              <option value="dinero">Dinero</option>
              <option value="cripto">Criptomonedas</option>
              <option value="servicio">Servicio</option>
              <option value="experiencia">Experiencia / entradas</option>
              <option value="beca">Beca</option>
              <option value="patrocinio">Patrocinio</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Valor estimado">
              <Input type="number" min={0} value={prizeValue} onChange={(e) => setPrizeValue(e.target.value)} />
            </Field>
            <Field label="Moneda">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
                <option value="CLP">CLP</option>
                <option value="COP">COP</option>
                <option value="MXN">MXN</option>
              </Select>
            </Field>
          </div>
          <Field label="Categoría artística del premio">
            <Select value={prizeCategory} onChange={(e) => setPrizeCategory(e.target.value as SponsorArtistCategory)}>
              {ARTIST_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ganadores" required>
          <Input type="number" min={1} max={20} value={winners} onChange={(e) => setWinners(e.target.value)} />
        </Field>
        <Field label="Método de selección" required>
          <Select value={method} onChange={(e) => setMethod(e.target.value as SweepstakeMethod)}>
            {SWEEPSTAKE_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Inicio" required>
          <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </Field>
        <Field label="Cierre de participaciones" required>
          <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </Field>
        <Field label="Fecha de selección" required>
          <Input type="datetime-local" value={drawAt} onChange={(e) => setDrawAt(e.target.value)} />
        </Field>
        <Field label="Forma de entrega" required>
          <Input value={delivery} onChange={(e) => setDelivery(e.target.value)} />
        </Field>
      </div>

      <Field label="Países habilitados" hint="Si no elegís ninguno, participa toda la comunidad.">
        <ChipToggle
          items={COUNTRIES.map((c) => ({ id: c, label: c }))}
          selected={countries}
          onToggle={(id) =>
            setCountries((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
          }
          tone="cyan"
        />
      </Field>

      {method === 'comentarios' ? (
        <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-3 space-y-2">
          <Field label="Regla del comentario">
            <Select value={commentMode} onChange={(e) => setCommentMode(e.target.value as typeof commentMode)}>
              <option value="libre">Comentario libre</option>
              <option value="palabra">Palabra obligatoria</option>
              <option value="pregunta">Responder una pregunta</option>
              <option value="creativo">Comentario creativo</option>
              <option value="adivinanza">Adivinanza</option>
            </Select>
          </Field>
          {commentMode === 'palabra' ? (
            <Field label="Palabra obligatoria" required>
              <Input value={requiredWord} onChange={(e) => setRequiredWord(e.target.value)} placeholder="LARVAZ" />
            </Field>
          ) : null}
          {commentMode === 'pregunta' || commentMode === 'adivinanza' ? (
            <>
              <Field label="Pregunta">
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} />
              </Field>
              <Field label="Respuesta válida" required>
                <Input value={answer} onChange={(e) => setAnswer(e.target.value)} />
              </Field>
            </>
          ) : null}
        </div>
      ) : null}

      {method === 'numeros' ? (
        <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Modo">
              <Select value={numMode} onChange={(e) => setNumMode(e.target.value as typeof numMode)}>
                <option value="exacto">Número exacto</option>
                <option value="cercano">Número más cercano</option>
                <option value="primero">Primer usuario en acertar</option>
                <option value="aleatorio_acertantes">Aleatorio entre acertantes</option>
              </Select>
            </Field>
            <Field label="Número secreto" required hint="No se muestra hasta finalizar el sorteo.">
              <Input type="number" value={numSecret} onChange={(e) => setNumSecret(e.target.value)} />
            </Field>
            <Field label="Mínimo">
              <Input type="number" value={numMin} onChange={(e) => setNumMin(e.target.value)} />
            </Field>
            <Field label="Máximo">
              <Input type="number" value={numMax} onChange={(e) => setNumMax(e.target.value)} />
            </Field>
          </div>
        </div>
      ) : null}

      {method === 'palabras' ? (
        <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-3 space-y-2">
          <Field label="Palabra o frase secreta" required>
            <Input value={secretWord} onChange={(e) => setSecretWord(e.target.value)} />
          </Field>
          <Field label="Pistas" hint="Separadas por coma.">
            <Input value={hints} onChange={(e) => setHints(e.target.value)} placeholder="Empieza con L, tiene 6 letras" />
          </Field>
        </div>
      ) : null}

      {method === 'mejor_comentario' ? (
        <div className="rounded-xl border border-magenta/25 bg-magenta/5 p-3">
          <Field label="Consigna y criterios públicos" required>
            <Textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="Mejor historia sobre tu barrio. Se evalúa originalidad, emoción y escritura." />
          </Field>
        </div>
      ) : null}

      <Field label="Requisitos" hint="Uno por línea o separados por coma.">
        <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} />
      </Field>
      <Field label="Bases y condiciones" required hint="Obligatorias. Quedan bloqueadas al iniciar el sorteo.">
        <Textarea value={rules} onChange={(e) => setRules(e.target.value)} maxLength={2000} />
      </Field>

      <Check
        checked={likesRequired}
        onChange={setLikesRequired}
        label="El like a la publicación es requisito para participar"
        hint="No se permiten participaciones duplicadas por el mismo like."
      />

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Btn type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Btn>
        ) : null}
        <Btn type="submit" loading={saving}>
          Crear y publicar sorteo
        </Btn>
      </div>
    </form>
  );
}

// ============================================================================
// Desafío
// ============================================================================

export function ChallengeForm({
  brandId,
  onCreated,
  onCancel,
}: {
  brandId: string;
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}) {
  const { actor, store } = useSponsors();
  const [form, setForm] = useState<ChallengeInput>({
    brand_id: brandId,
    title: '',
    description: '',
    rules: '',
    discipline: 'mc',
    deadline: localInputToIso(new Date(Date.now() + 14 * 86_400_000).toISOString()),
    prize_description: '',
    judging_mode: 'jurado',
    criteria: ['Originalidad', 'Técnica'],
    cover_url: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = store.createChallenge(actor, form);
    setSaving(false);
    if (!res.ok || !res.data) {
      setError(res.error || 'No se pudo crear el desafío.');
      return;
    }
    setError(null);
    onCreated?.(res.data.id);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Notice error={error} />
      <Field label="Título del desafío" required>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="16 barras sobre sample de soul" />
      </Field>
      <Field label="Descripción" required>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Disciplina">
          <Select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value as SponsorArtistCategory })}>
            {ARTIST_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cierre" required>
          <Input type="datetime-local" value={isoToLocalInput(form.deadline)} onChange={(e) => setForm({ ...form, deadline: localInputToIso(e.target.value) })} />
        </Field>
        <Field label="Modo de evaluación">
          <Select value={form.judging_mode} onChange={(e) => setForm({ ...form, judging_mode: e.target.value as 'votos' | 'jurado' })}>
            <option value="jurado">Jurado con criterios</option>
            <option value="votos">Votación de la comunidad</option>
          </Select>
        </Field>
        <Field label="Premio" required>
          <Input value={form.prize_description} onChange={(e) => setForm({ ...form, prize_description: e.target.value })} placeholder="Sesión de grabación + master" />
        </Field>
      </div>
      <Field label="Criterios de evaluación" hint="Separados por coma.">
        <Input
          value={form.criteria.join(', ')}
          onChange={(e) => setForm({ ...form, criteria: splitList(e.target.value) })}
        />
      </Field>
      <Field label="Reglas" required>
        <Textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
      </Field>
      <ImageInput value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })} label="Portada" />

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Btn type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Btn>
        ) : null}
        <Btn type="submit" loading={saving}>
          Publicar desafío
        </Btn>
      </div>
    </form>
  );
}

// ============================================================================
// Campaña de donación
// ============================================================================

export function CampaignForm({
  brandId,
  onCreated,
  onCancel,
}: {
  brandId?: string;
  onCreated?: (id: string) => void;
  onCancel?: () => void;
}) {
  const { actor, store } = useSponsors();
  const [form, setForm] = useState<CampaignInput>({
    brand_id: brandId,
    title: '',
    description: '',
    beneficiary: '',
    goal_amount: 1000,
    currency: 'USD',
    closes_at: localInputToIso(new Date(Date.now() + 30 * 86_400_000).toISOString()),
    use_of_funds: '',
    image_url: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = store.createCampaign(actor, form);
    setSaving(false);
    if (!res.ok || !res.data) {
      setError(res.error || 'No se pudo crear la campaña.');
      return;
    }
    setError(null);
    onCreated?.(res.data.id);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Notice error={error} />
      <Field label="Título del proyecto" required>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Videoclip de mi primer single" />
      </Field>
      <Field label="Descripción" required>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </Field>
      <ImageInput value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} label="Imagen del proyecto" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Beneficiario" required>
          <Input value={form.beneficiary} onChange={(e) => setForm({ ...form, beneficiary: e.target.value })} />
        </Field>
        <Field label="Fecha de cierre" required>
          <Input type="datetime-local" value={isoToLocalInput(form.closes_at)} onChange={(e) => setForm({ ...form, closes_at: localInputToIso(e.target.value) })} />
        </Field>
        <Field label="Objetivo económico" required>
          <Input type="number" min={1} value={form.goal_amount} onChange={(e) => setForm({ ...form, goal_amount: Number(e.target.value) })} />
        </Field>
        <Field label="Moneda">
          <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
            <option value="CLP">CLP</option>
            <option value="COP">COP</option>
            <option value="MXN">MXN</option>
          </Select>
        </Field>
      </div>
      <Field label="Destino de los fondos" required hint="Se publica con el proyecto y se rinde con comprobantes.">
        <Textarea value={form.use_of_funds} onChange={(e) => setForm({ ...form, use_of_funds: e.target.value })} />
      </Field>
      <p className="rounded-lg border border-cyan/25 bg-cyan/5 p-2.5 text-[10px] leading-relaxed text-cyan/90">
        LARVAZ no custodia fondos. Los aportes quedan <b>pendientes</b> hasta que la organización verifica la transferencia o
        el comprobante cripto. Sólo entonces se suman a la recaudación.
      </p>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Btn type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Btn>
        ) : null}
        <Btn type="submit" loading={saving}>
          Crear campaña
        </Btn>
      </div>
    </form>
  );
}
