// ============================================================================
// LARVAZ SPONSORS — Store local-first
//
// Un único punto de verdad para el segmento. Persiste en localStorage igual
// que el resto de LARVAZ y concentra TODAS las validaciones críticas
// (sorteos, premios, donaciones, acuerdos, permisos) en un solo lugar, para
// que ninguna pantalla pueda saltearse las reglas.
//
// En producción las mismas reglas viven en la migración SQL
// `supabase/migrations/20261116000000_sponsors.sql` con RLS y triggers.
// ============================================================================

import type {
  AgreementStatus,
  ApplicationStatus,
  BrandVerificationStatus,
  CampaignContribution,
  CampaignStatus,
  ChallengeEntry,
  Counterpart,
  CounterpartStatus,
  OpportunityStatus,
  PointsAction,
  PointsEntry,
  PrizeDeliveryStatus,
  SponsorApplication,
  SponsorAudit,
  SponsorBrand,
  SponsorCampaign,
  SponsorChallenge,
  SponsorComment,
  SponsorCommercialCategory,
  SponsorArtistCategory,
  SponsorNotification,
  SponsorNotificationType,
  SponsorPost,
  SponsorPostKind,
  SponsorPrize,
  SponsorReview,
  SponsorsState,
  SponsorSweepstake,
  SponsorshipAgreement,
  SponsorshipOffer,
  SponsorshipOpportunity,
  SweepstakeMethod,
  SweepstakeParticipation,
  ActionResult,
  SponsorActor,
} from '@/types/sponsors';
import { createSeedState } from './seed';
import { POINTS_RULES, slugify, formatMoney, normalizeAnswer, isPast, artistCategoryLabel } from './catalog';
import { createDrawSeed, seededShuffle, sha256Hex } from './hash';

const STORAGE_KEY = 'larvaz_sponsors_v1';
const EVENT_NAME = 'larvaz-sponsors-updated';

const nowIso = () => new Date().toISOString();

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
      ? Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('')
      : Math.random().toString(16).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isAdminActor(actor?: SponsorActor | null): boolean {
  return Boolean(actor && ['admin', 'super_admin', 'moderator'].includes(actor.role || ''));
}

function fail<T = undefined>(error: string): ActionResult<T> {
  return { ok: false, error };
}

function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

function validUrl(value?: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return Boolean(url.hostname.includes('.'));
  } catch {
    return false;
  }
}

// ============================================================================
// Entradas de las acciones (lo que cada formulario puede enviar)
// ============================================================================

export interface BrandInput {
  name: string;
  description: string;
  category: SponsorCommercialCategory;
  country: string;
  province?: string;
  city: string;
  logo_url?: string;
  cover_url?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  seeking_categories: SponsorArtistCategory[];
  interest_locations: string[];
}

export interface OpportunityInput {
  brand_id: string;
  title: string;
  description: string;
  image_url?: string;
  offer: SponsorshipOffer;
  artist_categories: SponsorArtistCategory[];
  counterparts: Omit<Counterpart, 'id' | 'status'>[];
  country: string;
  province?: string;
  city: string;
  is_remote: boolean;
  duration_days: number;
  deadline: string;
  slots: number;
  status?: OpportunityStatus;
}

export interface ApplicationInput {
  message: string;
  portfolio_url?: string;
  social_links: { label: string; url: string }[];
  experience: string;
  proposal: string;
}

export interface SponsorPostInput {
  brand_id: string;
  kind: SponsorPostKind;
  title: string;
  body: string;
  image_url?: string;
  gallery?: string[];
  link_url?: string;
  tags?: string[];
  sweepstake_id?: string;
  challenge_id?: string;
  campaign_id?: string;
}

export interface SweepstakeInput {
  brand_id: string;
  title: string;
  description: string;
  prize_image_url?: string;
  category: SponsorArtistCategory;
  prize_value?: number;
  currency?: string;
  winners_count: number;
  starts_at: string;
  ends_at: string;
  draw_at: string;
  countries: string[];
  requirements: string[];
  rules: string;
  method: SweepstakeMethod;
  delivery_method: string;
  likes_required: boolean;
  comment_rule?: SponsorSweepstake['comment_rule'];
  number_rule?: SponsorSweepstake['number_rule'];
  word_rule?: SponsorSweepstake['word_rule'];
  judging?: { criteria: string };
  prize_title?: string;
  prize_kind?: SponsorPrize['kind'];
  post_body?: string;
  post_image_url?: string;
}

export interface ChallengeInput {
  brand_id: string;
  title: string;
  description: string;
  rules: string;
  discipline: SponsorArtistCategory;
  deadline: string;
  prize_description: string;
  judging_mode: 'votos' | 'jurado';
  criteria: string[];
  cover_url?: string;
}

export interface CampaignInput {
  brand_id?: string;
  title: string;
  description: string;
  image_url?: string;
  beneficiary: string;
  goal_amount: number;
  currency: string;
  closes_at: string;
  use_of_funds: string;
}

export interface ContributionInput {
  amount: number;
  currency: string;
  method: CampaignContribution['method'];
  message?: string;
  anonymous: boolean;
  tx_ref?: string;
}

export interface ReviewInput {
  ratings: SponsorReview['ratings'];
  comment: string;
}

export interface BrandStats {
  followers: number;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  opportunities: number;
  applications: number;
  agreements: number;
  activeCampaigns: number;
  activeSweepstakes: number;
  participants: number;
  winners: number;
  pendingPrizes: number;
  donationsVerified: number;
  points?: number;
}

// ============================================================================
// Store
// ============================================================================

class SponsorsStore {
  // Estado determinista que usan el servidor y la primera hidratación del
  // cliente. Nunca se hidrata desde localStorage para que el HTML no cambie
  // entre SSR e hidratación; después React pasa al estado persistido.
  private serverState: SponsorsState = clone(createSeedState());
  private state: SponsorsState = this.serverState;
  private listeners = new Set<() => void>();
  private hydrated = false;

  // -------------------------------------------------------------- núcleo
  private hydrate() {
    if (this.hydrated || typeof window === 'undefined') return;
    this.hydrated = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SponsorsState;
        if (parsed && parsed.version) {
          this.state = { ...clone(createSeedState()), ...parsed };
        }
      } else {
        this.persist();
      }
    } catch {
      /* almacenamiento no disponible: seguimos en memoria */
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* cuota llena: la sesión sigue funcionando en memoria */
    }
  }

  private emit() {
    this.state = { ...this.state };
    this.persist();
    this.listeners.forEach((listener) => listener());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): SponsorsState => this.state;

  /**
   * Carga localStorage recién después del montaje. Así el primer render del
   * cliente coincide con el HTML del servidor y no hay errores de hidratación.
   */
  hydrateFromStorage = () => {
    this.hydrate();
    this.listeners.forEach((listener) => listener());
  };

  /** Snapshot estable para SSR e hidratación (sin localStorage). */
  getServerSnapshot = (): SponsorsState => this.serverState;

  getState = (): SponsorsState => this.getSnapshot();

  /** Sincroniza cambios hechos en otra pestaña. */
  refreshFromStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SponsorsState;
      if (parsed && parsed.version) {
        this.state = { ...clone(createSeedState()), ...parsed };
        this.listeners.forEach((listener) => listener());
      }
    } catch {
      /* ignorado */
    }
  };

  resetDemo = () => {
    this.state = clone(createSeedState());
    this.emit();
  };

  private log(
    actor: SponsorActor | null,
    action: string,
    targetType: string,
    targetId: string,
    detail?: string
  ): SponsorAudit {
    const entry: SponsorAudit = {
      id: uid('aud'),
      at: nowIso(),
      actor_id: actor?.id || 'sistema',
      action,
      target_type: targetType,
      target_id: targetId,
      detail,
      hash: sha256Hex(`${action}|${targetType}|${targetId}|${actor?.id || 'sistema'}|${detail || ''}|${Date.now()}`),
    };
    this.state.audit = [entry, ...this.state.audit].slice(0, 500);
    return entry;
  }

  private notify(input: {
    user_id: string;
    type: SponsorNotificationType;
    title: string;
    body: string;
    href?: string;
  }) {
    if (!input.user_id || input.user_id.startsWith('demo-') || input.user_id === 'user-guest') return;
    const notification: SponsorNotification = {
      id: uid('snot'),
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      read: false,
      created_at: nowIso(),
    };
    this.state.notifications = [notification, ...this.state.notifications].slice(0, 300);
  }

  // -------------------------------------------------------------- puntos
  private awardPoints(
    userId: string | undefined,
    action: PointsAction,
    refId?: string,
    refType?: string
  ): { awarded: number; capped: boolean } {
    if (!userId || userId.startsWith('demo-')) return { awarded: 0, capped: false };
    const rule = POINTS_RULES.find((r) => r.action === action);
    if (!rule) return { awarded: 0, capped: false };

    // Anti-duplicado por referencia (misma acción sobre el mismo objeto).
    if (refId && this.state.points.some((p) => p.user_id === userId && p.action === action && p.ref_id === refId)) {
      return { awarded: 0, capped: true };
    }

    // Tope diario por tipo de acción.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = this.state.points.filter(
      (p) => p.user_id === userId && p.action === action && new Date(p.created_at).getTime() >= today.getTime()
    ).length;
    if (todayCount >= rule.daily) return { awarded: 0, capped: true };

    const entry: PointsEntry = {
      id: uid('pt'),
      user_id: userId,
      action,
      points: rule.points,
      ref_id: refId,
      ref_type: refType,
      created_at: nowIso(),
    };
    this.state.points = [entry, ...this.state.points];
    return { awarded: rule.points, capped: false };
  }

  // -------------------------------------------------------------- consultas
  getBrand = (brandId?: string): SponsorBrand | undefined =>
    this.getSnapshot().brands.find((b) => b.id === brandId);

  getBrandBySlug = (slug?: string): SponsorBrand | undefined =>
    this.getSnapshot().brands.find((b) => b.slug === slug);

  getBrandsByOwner = (ownerId?: string): SponsorBrand[] =>
    this.getSnapshot().brands.filter((b) => b.owner_id === ownerId);

  getOpportunity = (id?: string): SponsorshipOpportunity | undefined =>
    this.getSnapshot().opportunities.find((o) => o.id === id);

  getApplication = (id?: string): SponsorApplication | undefined =>
    this.getSnapshot().applications.find((a) => a.id === id);

  getAgreement = (id?: string): SponsorshipAgreement | undefined =>
    this.getSnapshot().agreements.find((a) => a.id === id);

  getPost = (id?: string): SponsorPost | undefined => this.getSnapshot().posts.find((p) => p.id === id);

  getSweepstake = (id?: string): SponsorSweepstake | undefined =>
    this.getSnapshot().sweepstakes.find((s) => s.id === id);

  getSweepstakeByPost = (postId?: string): SponsorSweepstake | undefined =>
    this.getSnapshot().sweepstakes.find((s) => s.post_id === postId);

  getChallenge = (id?: string): SponsorChallenge | undefined =>
    this.getSnapshot().challenges.find((c) => c.id === id);

  getChallengeByPost = (postId?: string): SponsorChallenge | undefined =>
    this.getSnapshot().challenges.find((c) => c.post_id === postId);

  getCampaign = (id?: string): SponsorCampaign | undefined =>
    this.getSnapshot().campaigns.find((c) => c.id === id);

  getCampaignByPost = (postId?: string): SponsorCampaign | undefined =>
    this.getSnapshot().campaigns.find((c) => c.post_id === postId);

  getPrize = (id?: string): SponsorPrize | undefined => this.getSnapshot().prizes.find((p) => p.id === id);

  getPrizeBySweepstake = (sweepstakeId?: string): SponsorPrize | undefined =>
    this.getSnapshot().prizes.find((p) => p.sweepstake_id === sweepstakeId);

  getParticipations = (sweepstakeId: string): SweepstakeParticipation[] =>
    this.getSnapshot().participations.filter((p) => p.sweepstake_id === sweepstakeId);

  getMyParticipation = (sweepstakeId: string, userId?: string): SweepstakeParticipation | undefined =>
    this.getSnapshot().participations.find((p) => p.sweepstake_id === sweepstakeId && p.user_id === userId);

  getContributions = (campaignId: string): CampaignContribution[] =>
    this.getSnapshot().contributions.filter((c) => c.campaign_id === campaignId);

  getPointsFor = (userId?: string): number =>
    this.getSnapshot()
      .points.filter((p) => p.user_id === userId)
      .reduce((sum, p) => sum + p.points, 0);

  getPointsHistory = (userId?: string): PointsEntry[] =>
    this.getSnapshot().points.filter((p) => p.user_id === userId);

  getNotificationsFor = (userId?: string): SponsorNotification[] =>
    this.getSnapshot().notifications.filter((n) => n.user_id === userId);

  getUnreadCount = (userId?: string): number =>
    this.getSnapshot().notifications.filter((n) => n.user_id === userId && !n.read).length;

  getBrandReviews = (brandId: string): SponsorReview[] =>
    this.getSnapshot().reviews.filter((r) => r.brand_id === brandId);

  getAgreementReviews = (agreementId: string): SponsorReview[] =>
    this.getSnapshot().reviews.filter((r) => r.agreement_id === agreementId);

  getAudit = (): SponsorAudit[] => this.getSnapshot().audit;

  canManageBrand = (actor: SponsorActor | null | undefined, brandId: string): boolean => {
    if (!actor || actor.is_guest) return false;
    const brand = this.getBrand(brandId);
    if (!brand) return false;
    return brand.owner_id === actor.id || isAdminActor(actor);
  };

  canManagePost = (actor: SponsorActor | null | undefined, postId: string): boolean => {
    const post = this.getPost(postId);
    if (!post) return false;
    return this.canManageBrand(actor, post.brand_id);
  };

  // -------------------------------------------------------------- marcas
  createBrand(actor: SponsorActor | null, input: BrandInput): ActionResult<SponsorBrand> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para crear tu perfil de marca.');
    if (!input.name.trim() || input.name.trim().length < 2) return fail('El nombre de la marca es obligatorio.');
    if (!input.description.trim() || input.description.trim().length < 20)
      return fail('Contá de qué se trata tu marca (mínimo 20 caracteres).');
    if (!input.country.trim() || !input.city.trim()) return fail('País y ciudad son obligatorios.');
    if (!validUrl(input.website)) return fail('El sitio web no parece una URL válida.');

    const state = this.getSnapshot();
    if (state.brands.some((b) => b.owner_id === actor.id && b.name.toLowerCase() === input.name.trim().toLowerCase())) {
      return fail('Ya tenés una marca registrada con ese nombre.');
    }

    let slug = slugify(input.name) || uid('marca');
    if (state.brands.some((b) => b.slug === slug)) slug = `${slug}-${state.brands.length + 1}`;

    const autoVerify = isAdminActor(actor);
    const brand: SponsorBrand = {
      id: uid('brand'),
      owner_id: actor.id,
      slug,
      name: input.name.trim(),
      logo_url: input.logo_url,
      cover_url: input.cover_url,
      description: input.description.trim(),
      category: input.category,
      country: input.country.trim(),
      province: input.province?.trim(),
      city: input.city.trim(),
      website: input.website?.trim(),
      instagram: input.instagram?.trim(),
      tiktok: input.tiktok?.trim(),
      facebook: input.facebook?.trim(),
      contact_name: input.contact_name?.trim(),
      contact_email: input.contact_email?.trim(),
      contact_phone: input.contact_phone?.trim(),
      seeking_categories: input.seeking_categories,
      interest_locations: input.interest_locations,
      verification: autoVerify ? 'verificada' : 'pendiente',
      verified_at: autoVerify ? nowIso() : undefined,
      verified_by: autoVerify ? actor.id : undefined,
      verification_note: autoVerify ? 'Verificada automáticamente por rol administrativo.' : undefined,
      followers: [],
      reputation: { score: 0, reviews: 0 },
      created_at: nowIso(),
    };

    this.state.brands = [brand, ...this.state.brands];
    this.log(actor, 'Marca creada', 'brand', brand.id, brand.name);
    if (!autoVerify) {
      this.notify({
        user_id: brand.owner_id,
        type: 'verificacion',
        title: 'Marca enviada a verificación',
        body: `${brand.name} quedó pendiente de revisión por el equipo LARVAZ.`,
        href: `/sponsors/marca/${brand.slug}`,
      });
    }
    this.awardPoints(actor.id, 'perfil_completo', brand.id, 'brand');
    this.emit();
    return ok(brand);
  }

  updateBrand(actor: SponsorActor | null, brandId: string, patch: Partial<BrandInput>): ActionResult<SponsorBrand> {
    if (!this.canManageBrand(actor, brandId)) return fail('No tenés permisos para editar esta marca.');
    const brand = this.getBrand(brandId);
    if (!brand) return fail('Marca inexistente.');
    if (patch.website && !validUrl(patch.website)) return fail('El sitio web no parece una URL válida.');

    const updated: SponsorBrand = {
      ...brand,
      ...patch,
      name: patch.name?.trim() || brand.name,
      description: patch.description?.trim() || brand.description,
      updated_at: nowIso(),
    };
    this.state.brands = this.state.brands.map((b) => (b.id === brandId ? updated : b));
    this.log(actor, 'Marca actualizada', 'brand', brandId);
    this.emit();
    return ok(updated);
  }

  setBrandVerification(
    actor: SponsorActor | null,
    brandId: string,
    status: BrandVerificationStatus,
    note?: string
  ): ActionResult<SponsorBrand> {
    if (!isAdminActor(actor)) return fail('Solo administración puede verificar marcas.');
    const brand = this.getBrand(brandId);
    if (!brand) return fail('Marca inexistente.');
    const updated: SponsorBrand = {
      ...brand,
      verification: status,
      verification_note: note,
      verified_at: status === 'verificada' ? nowIso() : undefined,
      verified_by: status === 'verificada' ? actor!.id : undefined,
      updated_at: nowIso(),
    };
    this.state.brands = this.state.brands.map((b) => (b.id === brandId ? updated : b));
    this.log(actor, `Marca ${status}`, 'brand', brandId, note);
    this.notify({
      user_id: brand.owner_id,
      type: 'verificacion',
      title:
        status === 'verificada'
          ? '¡Tu marca fue verificada!'
          : status === 'suspendida'
            ? 'Tu marca fue suspendida'
            : 'Revisión de marca actualizada',
      body: note || `Estado actual: ${status}.`,
      href: `/sponsors/marca/${brand.slug}`,
    });
    this.emit();
    return ok(updated);
  }

  toggleFollowBrand(actor: SponsorActor | null, brandId: string): ActionResult<{ following: boolean }> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para seguir marcas.');
    const brand = this.getBrand(brandId);
    if (!brand) return fail('Marca inexistente.');
    const following = !brand.followers.includes(actor.id);
    this.state.brands = this.state.brands.map((b) =>
      b.id === brandId
        ? { ...b, followers: following ? [...b.followers, actor.id] : b.followers.filter((f) => f !== actor.id) }
        : b
    );
    this.emit();
    return ok({ following });
  }

  // -------------------------------------------------------------- oportunidades
  createOpportunity(actor: SponsorActor | null, input: OpportunityInput): ActionResult<SponsorshipOpportunity> {
    if (!this.canManageBrand(actor, input.brand_id)) return fail('Solo la marca puede publicar propuestas.');
    if (!input.title.trim()) return fail('Poné un título a la convocatoria.');
    if (!input.description.trim() || input.description.length < 30)
      return fail('La descripción debe explicar la propuesta (mínimo 30 caracteres).');
    if (!input.offer.summary.trim()) return fail('Resumí qué ofrece el patrocinio.');
    if (!input.counterparts.length) return fail('Agregá al menos una contraprestación para el artista.');
    if (!input.artist_categories.length) return fail('Elegí qué tipo de artista buscás.');
    if (input.slots < 1) return fail('La cantidad de artistas debe ser al menos 1.');
    if (isPast(input.deadline)) return fail('La fecha límite ya pasó.');

    const opportunity: SponsorshipOpportunity = {
      id: uid('opp'),
      brand_id: input.brand_id,
      title: input.title.trim(),
      description: input.description.trim(),
      image_url: input.image_url,
      offer: input.offer,
      artist_categories: input.artist_categories,
      counterparts: input.counterparts.map((c) => ({ ...c, id: uid('cp'), status: 'pendiente' as CounterpartStatus })),
      country: input.country,
      province: input.province,
      city: input.city,
      is_remote: input.is_remote,
      duration_days: Math.max(1, input.duration_days),
      deadline: input.deadline,
      slots: Math.max(1, input.slots),
      status: input.status || 'abierta',
      applications_count: 0,
      created_at: nowIso(),
    };
    this.state.opportunities = [opportunity, ...this.state.opportunities];
    this.log(actor, 'Propuesta publicada', 'opportunity', opportunity.id, opportunity.title);

    const brand = this.getBrand(input.brand_id);
    const followerIds = brand?.followers || [];
    followerIds.forEach((userId) => {
      this.notify({
        user_id: userId,
        type: 'nueva_oportunidad',
        title: `${brand?.name} publicó una propuesta`,
        body: opportunity.title,
        href: `/sponsors/oportunidad/${opportunity.id}`,
      });
    });
    this.emit();
    return ok(opportunity);
  }

  setOpportunityStatus(actor: SponsorActor | null, opportunityId: string, status: OpportunityStatus): ActionResult {
    const opp = this.getOpportunity(opportunityId);
    if (!opp) return fail('Propuesta inexistente.');
    if (!this.canManageBrand(actor, opp.brand_id)) return fail('No tenés permisos sobre esta propuesta.');
    this.state.opportunities = this.state.opportunities.map((o) => (o.id === opportunityId ? { ...o, status } : o));
    this.log(actor, `Propuesta ${status}`, 'opportunity', opportunityId);
    this.emit();
    return ok();
  }

  updateOpportunity(actor: SponsorActor | null, opportunityId: string, patch: Partial<OpportunityInput>): ActionResult<SponsorshipOpportunity> {
    const opp = this.getOpportunity(opportunityId);
    if (!opp) return fail('Propuesta inexistente.');
    if (!this.canManageBrand(actor, opp.brand_id)) return fail('No tenés permisos sobre esta propuesta.');
    const updated: SponsorshipOpportunity = {
      ...opp,
      ...patch,
      offer: patch.offer || opp.offer,
      counterparts: patch.counterparts
        ? patch.counterparts.map((c) => ({ ...c, id: uid('cp'), status: 'pendiente' as CounterpartStatus }))
        : opp.counterparts,
      artist_categories: patch.artist_categories || opp.artist_categories,
      updated_at: nowIso(),
    } as SponsorshipOpportunity;
    this.state.opportunities = this.state.opportunities.map((o) => (o.id === opportunityId ? updated : o));
    this.log(actor, 'Propuesta actualizada', 'opportunity', opportunityId);
    this.emit();
    return ok(updated);
  }

  // -------------------------------------------------------------- postulaciones
  applyToOpportunity(
    actor: SponsorActor | null,
    opportunityId: string,
    input: ApplicationInput
  ): ActionResult<SponsorApplication> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para postularte.');
    const opp = this.getOpportunity(opportunityId);
    if (!opp) return fail('La propuesta no existe.');
    if (opp.status !== 'abierta') return fail('Esta convocatoria no está recibiendo postulaciones.');
    if (isPast(opp.deadline)) return fail('La convocatoria ya cerró.');
    if (input.message.trim().length < 20) return fail('Contá tu propuesta en al menos 20 caracteres.');
    if (!validUrl(input.portfolio_url)) return fail('El portfolio no parece una URL válida.');

    const brand = this.getBrand(opp.brand_id);
    if (brand?.owner_id === actor.id) return fail('No podés postularte a tu propia marca.');

    const existing = this.getSnapshot().applications.find(
      (a) => a.opportunity_id === opportunityId && a.artist_id === actor.id && a.status !== 'retirada' && a.status !== 'rechazada'
    );
    if (existing) return fail('Ya tenés una postulación activa en esta propuesta.');

    const application: SponsorApplication = {
      id: uid('app'),
      opportunity_id: opportunityId,
      brand_id: opp.brand_id,
      artist_id: actor.id,
      artist_username: actor.username,
      artist_name: actor.full_name,
      artist_avatar: actor.avatar_url,
      message: input.message.trim(),
      portfolio_url: input.portfolio_url?.trim(),
      social_links: input.social_links.filter((s) => s.url.trim()),
      experience: input.experience.trim(),
      proposal: input.proposal.trim(),
      status: 'pendiente',
      created_at: nowIso(),
    };

    this.state.applications = [application, ...this.state.applications];
    this.state.opportunities = this.state.opportunities.map((o) =>
      o.id === opportunityId ? { ...o, applications_count: o.applications_count + 1 } : o
    );
    this.log(actor, 'Postulación enviada', 'application', application.id, opp.title);
    if (brand) {
      this.notify({
        user_id: brand.owner_id,
        type: 'nueva_postulacion',
        title: 'Nueva postulación recibida',
        body: `${actor.full_name} se postuló a "${opp.title}".`,
        href: `/sponsors/panel?tab=postulaciones`,
      });
    }
    this.emit();
    return ok(application);
  }

  withdrawApplication(actor: SponsorActor | null, applicationId: string): ActionResult {
    const app = this.getApplication(applicationId);
    if (!app) return fail('Postulación inexistente.');
    if (!actor || app.artist_id !== actor.id) return fail('No podés retirar esta postulación.');
    this.state.applications = this.state.applications.map((a) =>
      a.id === applicationId ? { ...a, status: 'retirada' as ApplicationStatus, updated_at: nowIso() } : a
    );
    this.state.opportunities = this.state.opportunities.map((o) =>
      o.id === app.opportunity_id ? { ...o, applications_count: Math.max(0, o.applications_count - 1) } : o
    );
    this.log(actor, 'Postulación retirada', 'application', applicationId);
    this.emit();
    return ok();
  }

  setApplicationStatus(
    actor: SponsorActor | null,
    applicationId: string,
    status: ApplicationStatus,
    note?: string
  ): ActionResult {
    const app = this.getApplication(applicationId);
    if (!app) return fail('Postulación inexistente.');
    if (!this.canManageBrand(actor, app.brand_id)) return fail('Solo la marca puede gestionar postulaciones.');
    this.state.applications = this.state.applications.map((a) =>
      a.id === applicationId ? { ...a, status, brand_note: note ?? a.brand_note, updated_at: nowIso() } : a
    );
    this.log(actor, `Postulación ${status}`, 'application', applicationId, note);
    if (status !== 'retirada') {
      this.notify({
        user_id: app.artist_id,
        type: 'nueva_postulacion',
        title: `Tu postulación está ${status}`,
        body: note || 'La marca actualizó el estado de tu postulación.',
        href: '/sponsors/artista',
      });
    }
    this.emit();
    return ok();
  }

  sendOffer(actor: SponsorActor | null, applicationId: string, offer: { note: string; amount?: number; currency?: string }): ActionResult {
    const app = this.getApplication(applicationId);
    if (!app) return fail('Postulación inexistente.');
    if (!this.canManageBrand(actor, app.brand_id)) return fail('Solo la marca puede enviar ofertas.');
    if (!offer.note.trim()) return fail('Escribí el detalle de la oferta.');
    this.state.applications = this.state.applications.map((a) =>
      a.id === applicationId
        ? {
            ...a,
            status: 'oferta' as ApplicationStatus,
            offer: { note: offer.note.trim(), amount: offer.amount, currency: offer.currency, sent_at: nowIso() },
            updated_at: nowIso(),
          }
        : a
    );
    this.log(actor, 'Oferta enviada', 'application', applicationId, offer.note);
    this.notify({
      user_id: app.artist_id,
      type: 'oferta',
      title: 'Recibiste una oferta de patrocinio',
      body: `${this.getBrand(app.brand_id)?.name || 'Una marca'}: ${offer.note}`,
      href: '/sponsors/artista',
    });
    this.emit();
    return ok();
  }

  respondToOffer(actor: SponsorActor | null, applicationId: string, accept: boolean): ActionResult<SponsorshipAgreement> {
    const app = this.getApplication(applicationId);
    if (!app) return fail('Postulación inexistente.');
    if (!actor || app.artist_id !== actor.id) return fail('Solo el artista puede responder la oferta.');
    if (app.status !== 'oferta') return fail('No hay una oferta pendiente para responder.');

    if (!accept) {
      this.state.applications = this.state.applications.map((a) =>
        a.id === applicationId ? { ...a, status: 'rechazada' as ApplicationStatus, updated_at: nowIso() } : a
      );
      this.log(actor, 'Oferta rechazada', 'application', applicationId);
      this.emit();
      return ok();
    }

    const opp = this.getOpportunity(app.opportunity_id);
    const brand = this.getBrand(app.brand_id);
    const agreement: SponsorshipAgreement = {
      id: uid('agr'),
      opportunity_id: app.opportunity_id,
      application_id: app.id,
      brand_id: app.brand_id,
      artist_id: app.artist_id,
      artist_username: app.artist_username,
      artist_name: app.artist_name,
      title: opp?.title || 'Acuerdo de patrocinio',
      benefits: opp?.offer.summary || app.offer?.note || '',
      offer: opp?.offer,
      counterparts: (opp?.counterparts || []).map((c) => ({ ...c, id: uid('cp') })),
      start_date: nowIso(),
      end_date: new Date(Date.now() + (opp?.duration_days || 30) * 86_400_000).toISOString(),
      terms:
        opp?.description ||
        'Las partes acuerdan cumplir las contraprestaciones detalladas y registrar evidencias en LARVAZ.',
      status: 'aceptado',
      accepted_by_brand: true,
      accepted_by_artist: true,
      history: [
        { at: nowIso(), by_id: actor.id, by_name: actor.full_name, action: 'Oferta aceptada', note: 'Acuerdo digital generado' },
      ],
      created_at: nowIso(),
    };

    this.state.agreements = [agreement, ...this.state.agreements];
    this.state.applications = this.state.applications.map((a) =>
      a.id === applicationId ? { ...a, status: 'aceptada' as ApplicationStatus, updated_at: nowIso() } : a
    );
    if (opp) {
      this.state.opportunities = this.state.opportunities.map((o) =>
        o.id === opp.id ? { ...o, slots: Math.max(0, o.slots - 1) } : o
      );
    }
    this.log(actor, 'Acuerdo aceptado', 'agreement', agreement.id, agreement.title);
    if (brand) {
      this.notify({
        user_id: brand.owner_id,
        type: 'acuerdo',
        title: 'Acuerdo aceptado',
        body: `${actor.full_name} aceptó la oferta. El acuerdo ya está activo.`,
        href: '/sponsors/panel?tab=acuerdos',
      });
    }
    this.notify({
      user_id: app.artist_id,
      type: 'acuerdo',
      title: 'Nuevo acuerdo de patrocinio',
      body: `${formatMoney(app.offer?.amount, app.offer?.currency || 'USD')} — ${agreement.title}`,
      href: '/sponsors/artista',
    });
    this.emit();
    return ok(agreement);
  }

  // -------------------------------------------------------------- acuerdos
  setAgreementStatus(
    actor: SponsorActor | null,
    agreementId: string,
    status: AgreementStatus,
    note?: string
  ): ActionResult {
    const agreement = this.getAgreement(agreementId);
    if (!agreement) return fail('Acuerdo inexistente.');
    const isArtist = Boolean(actor && actor.id === agreement.artist_id);
    const isBrand = this.canManageBrand(actor, agreement.brand_id);
    if (!isArtist && !isBrand) return fail('No formás parte de este acuerdo.');
    if (status === 'completado' && agreement.status !== 'completado') {
      const pending = agreement.counterparts.filter((c) => c.status !== 'aprobado' && c.status !== 'entregado');
      if (pending.length) return fail('Todavía hay contraprestaciones pendientes de aprobación.');
    }

    // El estado "aceptado" exige la firma de ambas partes. Cada parte solo
    // puede firmar por la suya: nadie acepta en nombre de la otra.
    const acceptedByBrand = status === 'aceptado' ? agreement.accepted_by_brand || isBrand : agreement.accepted_by_brand;
    const acceptedByArtist = status === 'aceptado' ? agreement.accepted_by_artist || isArtist : agreement.accepted_by_artist;
    const bothAccepted = acceptedByBrand && acceptedByArtist;
    const nextStatus: AgreementStatus = status === 'aceptado' && !bothAccepted ? 'pendiente' : status;

    const updated: SponsorshipAgreement = {
      ...agreement,
      status: nextStatus,
      accepted_by_brand: acceptedByBrand,
      accepted_by_artist: acceptedByArtist,
      history: [
        ...agreement.history,
        {
          at: nowIso(),
          by_id: actor?.id || 'sistema',
          by_name: actor?.full_name || 'Sistema',
          action: status === 'aceptado' ? 'Firma registrada' : `Estado: ${nextStatus}`,
          note:
            status === 'aceptado' && !bothAccepted
              ? 'Falta la confirmación de la otra parte'
              : note,
        },
      ],
    };
    this.state.agreements = this.state.agreements.map((a) => (a.id === agreementId ? updated : a));
    this.log(actor, `Acuerdo ${nextStatus}`, 'agreement', agreementId, note);

    const counterpartId =
      isArtist ? this.getBrand(agreement.brand_id)?.owner_id : agreement.artist_id;
    if (counterpartId) {
      this.notify({
        user_id: counterpartId,
        type: 'acuerdo',
        title: status === 'aceptado' && !bothAccepted ? 'Falta tu firma en el acuerdo' : 'Tu acuerdo cambió de estado',
        body:
          status === 'aceptado' && !bothAccepted
            ? `${agreement.title}: la otra parte firmó, falta tu confirmación.`
            : `${agreement.title}: ${nextStatus}`,
        href: isArtist ? '/sponsors/panel?tab=acuerdos' : '/sponsors/artista?tab=acuerdos',
      });
    }
    if (nextStatus === 'completado') {
      this.awardPoints(agreement.artist_id, 'acuerdo_completado', agreement.id, 'agreement');
      this.awardPoints(this.getBrand(agreement.brand_id)?.owner_id, 'acuerdo_completado', agreement.id, 'agreement');
    }
    this.emit();
    return ok();
  }

  updateCounterpart(
    actor: SponsorActor | null,
    agreementId: string,
    counterpartId: string,
    patch: { status?: CounterpartStatus; evidence_url?: string }
  ): ActionResult {
    const agreement = this.getAgreement(agreementId);
    if (!agreement) return fail('Acuerdo inexistente.');
    const isArtist = actor?.id === agreement.artist_id;
    const isBrand = this.canManageBrand(actor, agreement.brand_id);
    if (!isArtist && !isBrand) return fail('No formás parte de este acuerdo.');

    // El artista entrega y marca avances; solo la marca aprueba o rechaza.
    if (isArtist && !isBrand && patch.status && !['pendiente', 'en_proceso', 'entregado'].includes(patch.status)) {
      return fail('Solo la marca puede aprobar o rechazar el entregable.');
    }

    this.state.agreements = this.state.agreements.map((a) =>
      a.id === agreementId
        ? {
            ...a,
            counterparts: a.counterparts.map((c) =>
              c.id === counterpartId ? { ...c, ...patch } : c
            ),
            history: [
              ...a.history,
              {
                at: nowIso(),
                by_id: actor?.id || 'sistema',
                by_name: actor?.full_name || 'Sistema',
                action: 'Entregable actualizado',
                note: patch.status || 'Evidencia adjunta',
              },
            ],
          }
        : a
    );
    this.log(actor, 'Entregable actualizado', 'agreement', agreementId, counterpartId);
    this.emit();
    return ok();
  }

  // -------------------------------------------------------------- publicaciones
  createSponsorPost(actor: SponsorActor | null, input: SponsorPostInput): ActionResult<SponsorPost> {
    if (!this.canManageBrand(actor, input.brand_id)) return fail('Solo la marca puede publicar.');
    if (!input.title.trim()) return fail('La publicación necesita un título.');
    if (!input.body.trim() || input.body.trim().length < 10) return fail('Escribí el contenido (mínimo 10 caracteres).');
    if (input.link_url && !validUrl(input.link_url)) return fail('El enlace no es válido.');

    const post: SponsorPost = {
      id: uid('spost'),
      brand_id: input.brand_id,
      author_id: actor!.id,
      kind: input.kind,
      title: input.title.trim(),
      body: input.body.trim(),
      image_url: input.image_url,
      gallery: (input.gallery || []).filter(Boolean),
      link_url: input.link_url?.trim(),
      tags: (input.tags || []).map((t) => t.replace(/^#/, '').trim()).filter(Boolean).slice(0, 8),
      likes: [],
      shares: 0,
      comments: [],
      created_at: nowIso(),
      sweepstake_id: input.sweepstake_id,
      challenge_id: input.challenge_id,
      campaign_id: input.campaign_id,
    };
    this.state.posts = [post, ...this.state.posts];
    this.log(actor, 'Publicación de marca', 'post', post.id, post.title);
    this.emit();
    return ok(post);
  }

  toggleSponsorPostLike(postId: string, actor: SponsorActor | null): ActionResult<{ liked: boolean; likes: number }> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para reaccionar.');
    const post = this.getPost(postId);
    if (!post) return fail('Publicación inexistente.');
    const liked = !post.likes.includes(actor.id);
    const likes = liked ? [...post.likes, actor.id] : post.likes.filter((id) => id !== actor.id);
    this.state.posts = this.state.posts.map((p) => (p.id === postId ? { ...p, likes } : p));
    this.emit();
    return ok({ liked, likes: likes.length });
  }

  addSponsorComment(postId: string, actor: SponsorActor | null, content: string): ActionResult<SponsorComment> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para comentar.');
    const post = this.getPost(postId);
    if (!post) return fail('Publicación inexistente.');
    const clean = content.trim();
    if (clean.length < 2) return fail('El comentario está vacío.');
    if (clean.length > 600) return fail('Máximo 600 caracteres.');

    const comment: SponsorComment = {
      id: uid('spc'),
      post_id: postId,
      user_id: actor.id,
      username: actor.username,
      full_name: actor.full_name,
      avatar_url: actor.avatar_url,
      content: clean,
      created_at: nowIso(),
    };
    this.state.posts = this.state.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p));
    this.awardPoints(actor.id, 'comentario_sponsor', comment.id, 'sponsor_comment');
    this.log(actor, 'Comentario en publicación de marca', 'post', postId);
    this.emit();
    return ok(comment);
  }

  removeSponsorComment(postId: string, commentId: string, actor: SponsorActor | null): ActionResult {
    const post = this.getPost(postId);
    if (!post) return fail('Publicación inexistente.');
    const comment = post.comments.find((c) => c.id === commentId);
    if (!comment) return fail('Comentario inexistente.');
    if (comment.user_id !== actor?.id && !this.canManageBrand(actor, post.brand_id)) {
      return fail('No podés borrar este comentario.');
    }
    this.state.posts = this.state.posts.map((p) =>
      p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p
    );
    this.log(actor, 'Comentario moderado', 'post', postId, commentId);
    this.emit();
    return ok();
  }

  shareSponsorPost(postId: string): ActionResult<{ shares: number }> {
    const post = this.getPost(postId);
    if (!post) return fail('Publicación inexistente.');
    const shares = post.shares + 1;
    this.state.posts = this.state.posts.map((p) => (p.id === postId ? { ...p, shares } : p));
    this.emit();
    return ok({ shares });
  }

  removeSponsorPost(actor: SponsorActor | null, postId: string, reason?: string): ActionResult {
    const post = this.getPost(postId);
    if (!post) return fail('Publicación inexistente.');
    if (!this.canManageBrand(actor, post.brand_id) && !isAdminActor(actor)) return fail('No tenés permisos.');
    this.state.posts = this.state.posts.filter((p) => p.id !== postId);
    this.log(actor, 'Publicación eliminada', 'post', postId, reason);
    this.emit();
    return ok();
  }

  // -------------------------------------------------------------- sorteos
  createSweepstake(actor: SponsorActor | null, input: SweepstakeInput): ActionResult<SponsorSweepstake> {
    if (!this.canManageBrand(actor, input.brand_id)) return fail('Solo la marca puede crear sorteos.');
    if (!input.title.trim()) return fail('El sorteo necesita un nombre.');
    if (!input.rules.trim() || input.rules.trim().length < 30) return fail('Las bases y condiciones son obligatorias.');
    if (input.winners_count < 1) return fail('Tiene que haber al menos un ganador.');
    if (!input.delivery_method.trim()) return fail('Indicá cómo se entrega el premio.');
    if (new Date(input.ends_at).getTime() <= new Date(input.starts_at).getTime())
      return fail('La fecha de fin debe ser posterior al inicio.');
    if (new Date(input.draw_at).getTime() < new Date(input.ends_at).getTime())
      return fail('La selección no puede ser anterior al cierre de participaciones.');
    if (input.method === 'comentarios' && !input.comment_rule) return fail('Configurá la regla de comentarios.');
    if (input.method === 'numeros' && (!input.number_rule || input.number_rule.min >= input.number_rule.max))
      return fail('Configurá un rango numérico válido.');
    if (input.method === 'palabras' && !input.word_rule?.secret) return fail('Definí la palabra secreta.');
    if (input.method === 'mejor_comentario' && !input.judging?.criteria.trim())
      return fail('Publicá los criterios de evaluación del jurado.');
    if (input.number_rule && (input.number_rule.secret < input.number_rule.min || input.number_rule.secret > input.number_rule.max))
      return fail('El número secreto debe estar dentro del rango.');

    const brand = this.getBrand(input.brand_id);
    const post = this.createSponsorPost(actor, {
      brand_id: input.brand_id,
      kind: 'sorteo',
      title: input.title,
      body: input.post_body || `${input.description}\n\nBases: ${input.rules}`,
      image_url: input.post_image_url || input.prize_image_url,
      tags: ['sorteo', 'larvaz', 'sponsors'],
    });

    if (!post.ok || !post.data) return fail(post.error || 'No se pudo crear la publicación del sorteo.');

    const sweepstake: SponsorSweepstake = {
      id: uid('sw'),
      brand_id: input.brand_id,
      post_id: post.data.id,
      title: input.title.trim(),
      description: input.description.trim(),
      prize_image_url: input.prize_image_url,
      category: input.category,
      prize_value: input.prize_value,
      currency: input.currency || 'USD',
      winners_count: input.winners_count,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      draw_at: input.draw_at,
      countries: input.countries,
      requirements: input.requirements.filter(Boolean),
      rules: input.rules.trim(),
      method: input.method,
      delivery_method: input.delivery_method.trim(),
      status: new Date(input.starts_at).getTime() > Date.now() ? 'borrador' : 'activo',
      likes_required: input.likes_required,
      comment_rule: input.comment_rule,
      number_rule: input.number_rule,
      word_rule: input.word_rule,
      judging: input.judging ? { criteria: input.judging.criteria } : undefined,
      winners: [],
      audit: [],
      created_at: nowIso(),
    };

    this.state.sweepstakes = [sweepstake, ...this.state.sweepstakes];
    this.state.posts = this.state.posts.map((p) =>
      p.id === sweepstake.post_id ? { ...p, sweepstake_id: sweepstake.id } : p
    );
    this.state.prizes = [
      {
        id: uid('prize'),
        brand_id: input.brand_id,
        sweepstake_id: sweepstake.id,
        position: 1,
        title: input.prize_title || input.title,
        description: input.description,
        kind: input.prize_kind || 'producto',
        estimated_value: input.prize_value,
        currency: input.currency || 'USD',
        status: 'pendiente',
        delivery: [],
        created_at: nowIso(),
      },
      ...this.state.prizes,
    ];
    this.log(actor, 'Sorteo publicado', 'sweepstake', sweepstake.id, 'Reglas bloqueadas al iniciar');
    this.notify({
      user_id: brand?.owner_id || '',
      type: 'sorteo',
      title: 'Sorteo publicado',
      body: `${sweepstake.title} ya está activo en LARVAZ.`,
      href: `/sponsors/sorteo/${sweepstake.id}`,
    });
    this.emit();
    return ok(sweepstake);
  }

  /** Las reglas quedan bloqueadas una vez que el sorteo arrancó. */
  updateSweepstake(actor: SponsorActor | null, sweepstakeId: string, patch: Partial<SweepstakeInput>): ActionResult {
    const sw = this.getSweepstake(sweepstakeId);
    if (!sw) return fail('Sorteo inexistente.');
    if (!this.canManageBrand(actor, sw.brand_id)) return fail('No tenés permisos.');
    if (sw.status !== 'borrador') {
      return fail('Las reglas no se pueden modificar una vez iniciado el sorteo.');
    }
    const locked = ['brand_id', 'method', 'number_rule', 'word_rule', 'comment_rule', 'winners_count', 'starts_at', 'ends_at', 'draw_at'];
    const changed = Object.keys(patch).some((k) => locked.includes(k) && patch[k as keyof SweepstakeInput] !== undefined);
    if (changed) return fail('Reglas estructurales bloqueadas desde el borrador.');
    this.state.sweepstakes = this.state.sweepstakes.map((s) =>
      s.id === sweepstakeId ? { ...s, ...(patch as Partial<SponsorSweepstake>) } : s
    );
    this.log(actor, 'Sorteo actualizado', 'sweepstake', sweepstakeId);
    this.emit();
    return ok();
  }

  private eligibilityError(
    actor: SponsorActor,
    sw: SponsorSweepstake,
    post: SponsorPost | undefined
  ): string | null {
    if (sw.status !== 'activo') return 'Este sorteo no está recibiendo participaciones.';
    if (isPast(sw.ends_at)) return 'Las participaciones ya cerraron.';
    if (new Date(sw.starts_at).getTime() > Date.now()) return 'El sorteo todavía no comenzó.';
    if (sw.countries.length) {
      const location = (actor.location || '').toLowerCase();
      const allowed = sw.countries.some((c) => location.includes(c.toLowerCase()));
      if (!allowed) return `Este sorteo solo está habilitado para: ${sw.countries.join(', ')}.`;
    }
    const needsLike = sw.method === 'likes' || sw.likes_required;
    if (needsLike && (!post || !post.likes.includes(actor.id))) {
      return 'Primero tenés que darle like a la publicación del sorteo.';
    }
    return null;
  }

  participateSweepstake(
    actor: SponsorActor | null,
    sweepstakeId: string,
    payload: { comment_text?: string; guess?: string } = {}
  ): ActionResult<SweepstakeParticipation> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para participar.');
    const sw = this.getSweepstake(sweepstakeId);
    if (!sw) return fail('Sorteo inexistente.');
    const post = this.getPost(sw.post_id);
    const eligibility = this.eligibilityError(actor, sw, post);
    if (eligibility) return fail(eligibility);

    if (this.getMyParticipation(sweepstakeId, actor.id)) {
      return fail('Ya estás participando en este sorteo.');
    }

    let valid = true;
    let invalidReason: string | undefined;
    let commentText: string | undefined;
    let guess: string | undefined;

    if (sw.method === 'comentarios' || sw.method === 'mejor_comentario') {
      commentText = (payload.comment_text || '').trim();
      if (!commentText) return fail('Escribí tu comentario para participar.');
      const rule = sw.comment_rule;
      if (sw.method === 'mejor_comentario') {
        if (commentText.length < 10) return fail('Tu comentario tiene que tener al menos 10 caracteres.');
        if (commentText.length > 600) return fail('Máximo 600 caracteres.');
      } else if (rule?.mode === 'palabra') {
        const word = normalizeAnswer(rule.required_word || '');
        if (!word || !normalizeAnswer(commentText).includes(word)) {
          return fail(`Tu comentario debe incluir la palabra "${rule.required_word}".`);
        }
      } else if (rule?.mode === 'pregunta' || rule?.mode === 'adivinanza') {
        const expected = normalizeAnswer(rule.answer || '');
        if (!expected || !normalizeAnswer(commentText).includes(expected)) {
          return fail('La respuesta no es correcta. Volvé a intentarlo.');
        }
      } else if (commentText.length < 3) {
        return fail('El comentario es demasiado corto.');
      }
    }

    if (sw.method === 'numeros') {
      const rule = sw.number_rule;
      if (!rule) return fail('El sorteo no tiene regla numérica configurada.');
      const num = Number(payload.guess);
      if (!Number.isFinite(num) || !Number.isInteger(num)) return fail('Ingresá un número entero.');
      if (num < rule.min || num > rule.max) return fail(`El número debe estar entre ${rule.min} y ${rule.max}.`);
      guess = String(num);
    }

    if (sw.method === 'palabras') {
      const rule = sw.word_rule;
      const typed = (payload.guess || '').trim();
      if (!typed) return fail('Escribí tu respuesta.');
      guess = typed;
      if (!rule || normalizeAnswer(typed) !== normalizeAnswer(rule.secret)) {
        valid = false;
        invalidReason = 'Respuesta incorrecta';
      }
    }

    if (!valid) {
      // Los intentos incorrectos no bloquean: se registran como no válidos.
      const attempt: SweepstakeParticipation = {
        id: uid('sp'),
        sweepstake_id: sweepstakeId,
        user_id: actor.id,
        username: actor.username,
        full_name: actor.full_name,
        avatar_url: actor.avatar_url,
        created_at: nowIso(),
        method: sw.method,
        guess,
        valid: false,
        invalid_reason: invalidReason,
      };
      this.state.participations = [attempt, ...this.state.participations];
      this.log(actor, 'Intento inválido', 'sweepstake', sweepstakeId, invalidReason);
      this.emit();
      return fail('Respuesta incorrecta. Podés volver a intentarlo.');
    }

    const participation: SweepstakeParticipation = {
      id: uid('sp'),
      sweepstake_id: sweepstakeId,
      user_id: actor.id,
      username: actor.username,
      full_name: actor.full_name,
      avatar_url: actor.avatar_url,
      created_at: nowIso(),
      method: sw.method,
      comment_text: commentText,
      guess,
      valid: true,
    };
    this.state.participations = [participation, ...this.state.participations];

    if (sw.method === 'comentarios' && commentText && post) {
      const comment: SponsorComment = {
        id: uid('spc'),
        post_id: post.id,
        user_id: actor.id,
        username: actor.username,
        full_name: actor.full_name,
        avatar_url: actor.avatar_url,
        content: commentText,
        created_at: nowIso(),
      };
      this.state.posts = this.state.posts.map((p) =>
        p.id === post.id ? { ...p, comments: [...p.comments, comment] } : p
      );
    }

    this.awardPoints(actor.id, 'sorteo_participar', participation.id, 'sweepstake');
    this.log(actor, 'Participación registrada', 'sweepstake', sweepstakeId);
    this.notify({
      user_id: actor.id,
      type: 'participacion',
      title: 'Participación registrada',
      body: `Estás participando en "${sw.title}".`,
      href: `/sponsors/sorteo/${sweepstakeId}`,
    });
    this.emit();
    return ok(participation);
  }

  pickBestComment(
    actor: SponsorActor | null,
    sweepstakeId: string,
    participationId: string,
    justification: string
  ): ActionResult {
    const sw = this.getSweepstake(sweepstakeId);
    if (!sw) return fail('Sorteo inexistente.');
    if (!this.canManageBrand(actor, sw.brand_id)) return fail('Solo la marca puede elegir al ganador.');
    if (sw.method !== 'mejor_comentario') return fail('Este sorteo no es de mejor comentario.');
    if (!justification.trim() || justification.trim().length < 10)
      return fail('La justificación de selección es obligatoria (mínimo 10 caracteres).');
    const part = this.getParticipations(sweepstakeId).find((p) => p.id === participationId && p.valid);
    if (!part) return fail('El comentario elegido no es una participación válida.');
    this.state.sweepstakes = this.state.sweepstakes.map((s) =>
      s.id === sweepstakeId
        ? { ...s, judging: { criteria: s.judging?.criteria || '', winner_participation_id: participationId, justification } }
        : s
    );
    this.log(actor, 'Ganador de jurado registrado', 'sweepstake', sweepstakeId, justification);
    this.emit();
    return ok();
  }

  closeSweepstake(actor: SponsorActor | null, sweepstakeId: string): ActionResult {
    const sw = this.getSweepstake(sweepstakeId);
    if (!sw) return fail('Sorteo inexistente.');
    if (!this.canManageBrand(actor, sw.brand_id)) return fail('No tenés permisos.');
    if (sw.status !== 'activo') return fail('El sorteo no está activo.');
    this.state.sweepstakes = this.state.sweepstakes.map((s) =>
      s.id === sweepstakeId ? { ...s, status: 'cerrado' } : s
    );
    this.log(actor, 'Participaciones cerradas', 'sweepstake', sweepstakeId);
    this.emit();
    return ok();
  }

  drawSweepstake(actor: SponsorActor | null, sweepstakeId: string): ActionResult<SponsorSweepstake> {
    const sw = this.getSweepstake(sweepstakeId);
    if (!sw) return fail('Sorteo inexistente.');
    if (!this.canManageBrand(actor, sw.brand_id)) return fail('No tenés permisos para sortear.');
    if (sw.status === 'sorteado') return fail('Este sorteo ya fue realizado.');
    if (sw.status === 'cancelado') return fail('Este sorteo fue cancelado.');

    const all = this.getParticipations(sweepstakeId).filter((p) => p.valid);
    if (!all.length) return fail('No hay participaciones válidas para sortear.');

    let pool = all;

    if (sw.method === 'numeros' && sw.number_rule) {
      const rule = sw.number_rule;
      const guessed = all.filter((p) => p.guess !== undefined);
      if (!guessed.length) return fail('Nadie envió un número todavía.');
      const exact = guessed.filter((p) => Number(p.guess) === rule.secret);
      if (rule.mode === 'primero') {
        const sorted = [...guessed].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const first = sorted.find((p) => Number(p.guess) === rule.secret);
        if (!first) return fail('Nadie acertó el número secreto.');
        pool = [first];
      } else if (rule.mode === 'cercano') {
        const best = Math.min(...guessed.map((p) => Math.abs(Number(p.guess) - rule.secret)));
        pool = guessed.filter((p) => Math.abs(Number(p.guess) - rule.secret) === best);
      } else if (rule.mode === 'aleatorio_acertantes') {
        if (!exact.length) return fail('Nadie acertó el número secreto.');
        pool = exact;
      } else {
        if (!exact.length) return fail('Nadie acertó el número secreto.');
        pool = exact;
      }
    }

    if (sw.method === 'palabras' && sw.word_rule) {
      const exact = all.filter((p) => normalizeAnswer(p.guess || '') === normalizeAnswer(sw.word_rule!.secret));
      if (!exact.length) return fail('Nadie acertó la palabra secreta.');
      pool = exact;
    }

    if (sw.method === 'mejor_comentario') {
      const winnerId = sw.judging?.winner_participation_id;
      if (!winnerId) return fail('Primero elegí el comentario ganador y justificá la decisión.');
      const chosen = all.find((p) => p.id === winnerId);
      if (!chosen) return fail('El comentario elegido no es válido.');
      pool = [chosen];
    }

    const seed = createDrawSeed();
    const winnersCount = Math.min(sw.winners_count, pool.length);
    const shuffled = seededShuffle(pool, seed).slice(0, winnersCount);

    const winners = shuffled.map((p, index) => ({
      participation_id: p.id,
      user_id: p.user_id,
      username: p.username,
      position: index + 1,
      prize_id: this.state.prizes.find((pr) => pr.sweepstake_id === sw.id && pr.position === index + 1)?.id,
    }));

    const auditHash = sha256Hex(
      `${seed}|${sw.id}|${shuffled.map((p) => p.id).join(',')}|${winnersCount}`
    );
    const drawnAt = nowIso();

    // Premios por ganador: reutilizamos los existentes por posición o creamos.
    const existingPrizes = this.state.prizes.filter((p) => p.sweepstake_id === sw.id);
    const newPrizes: SponsorPrize[] = [];
    winners.forEach((winner) => {
      const existing = existingPrizes.find((p) => p.position === winner.position);
      if (existing) {
        newPrizes.push({
          ...existing,
          winner_user_id: winner.user_id,
          winner_username: winner.username,
          status: 'pendiente',
        });
      } else {
        newPrizes.push({
          id: uid('prize'),
          brand_id: sw.brand_id,
          sweepstake_id: sw.id,
          position: winner.position,
          title: `${sw.title} — puesto ${winner.position}`,
          description: sw.description,
          kind: 'producto',
          estimated_value: sw.prize_value,
          currency: sw.currency || 'USD',
          winner_user_id: winner.user_id,
          winner_username: winner.username,
          status: 'pendiente',
          delivery: [],
          created_at: drawnAt,
        });
      }
    });
    const others = this.state.prizes.filter((p) => p.sweepstake_id !== sw.id);
    this.state.prizes = [...newPrizes, ...others];

    const updated: SponsorSweepstake = {
      ...sw,
      status: 'sorteado',
      seed,
      drawn_at: drawnAt,
      winners: winners.map((w) => ({
        ...w,
        prize_id: newPrizes.find((p) => p.position === w.position)?.id,
      })),
      audit: [
        {
          id: uid('swa'),
          at: drawnAt,
          actor_id: actor!.id,
          action: 'Sorteo realizado',
          hash: auditHash,
          detail: `${winnersCount} ganador(es) entre ${pool.length} participación(es) válidas. Semilla: ${seed}`,
        },
        ...sw.audit,
      ],
    };

    this.state.sweepstakes = this.state.sweepstakes.map((s) => (s.id === sweepstakeId ? updated : s));
    this.log(actor, 'Sorteo realizado', 'sweepstake', sweepstakeId, auditHash);

    winners.forEach((winner) => {
      this.notify({
        user_id: winner.user_id,
        type: 'ganador',
        title: '¡Ganaste un sorteo en LARVAZ!',
        body: `${sw.title} — puesto ${winner.position}. Coordiná la entrega del premio.`,
        href: `/sponsors/sorteo/${sw.id}`,
      });
    });
    const brand = this.getBrand(sw.brand_id);
    if (brand) {
      this.notify({
        user_id: brand.owner_id,
        type: 'sorteo',
        title: 'Sorteo finalizado',
        body: `${sw.title}: ${winners.length} ganador(es) seleccionados con auditoría ${auditHash.slice(0, 12)}…`,
        href: `/sponsors/sorteo/${sw.id}`,
      });
    }
    this.emit();
    return ok(updated);
  }

  cancelSweepstake(actor: SponsorActor | null, sweepstakeId: string, reason: string): ActionResult {
    const sw = this.getSweepstake(sweepstakeId);
    if (!sw) return fail('Sorteo inexistente.');
    if (!this.canManageBrand(actor, sw.brand_id)) return fail('No tenés permisos.');
    if (sw.status === 'sorteado') return fail('No se puede cancelar un sorteo ya realizado.');
    if (!reason.trim()) return fail('Indicá el motivo de cancelación.');
    this.state.sweepstakes = this.state.sweepstakes.map((s) =>
      s.id === sweepstakeId
        ? {
            ...s,
            status: 'cancelado',
            audit: [
              {
                id: uid('swa'),
                at: nowIso(),
                actor_id: actor!.id,
                action: 'Sorteo cancelado',
                hash: sha256Hex(`${s.id}|cancel|${reason}`),
                detail: reason,
              },
              ...s.audit,
            ],
          }
        : s
    );
    this.log(actor, 'Sorteo cancelado', 'sweepstake', sweepstakeId, reason);
    this.emit();
    return ok();
  }

  // -------------------------------------------------------------- premios
  updatePrizeStatus(
    actor: SponsorActor | null,
    prizeId: string,
    status: PrizeDeliveryStatus,
    note?: string,
    proofUrl?: string
  ): ActionResult {
    const prize = this.getPrize(prizeId);
    if (!prize) return fail('Premio inexistente.');
    if (!this.canManageBrand(actor, prize.brand_id)) return fail('No tenés permisos sobre este premio.');
    if (status === 'confirmado') return fail('La recepción solo la confirma el ganador.');
    this.state.prizes = this.state.prizes.map((p) =>
      p.id === prizeId
        ? {
            ...p,
            status,
            delivery: [...p.delivery, { at: nowIso(), status, note, proof_url: proofUrl }],
          }
        : p
    );
    this.log(actor, 'Premio actualizado', 'prize', prizeId, status);
    if (prize.winner_user_id) {
      this.notify({
        user_id: prize.winner_user_id,
        type: 'premio',
        title: 'Tu premio cambió de estado',
        body: `${prize.title}: ${status}${note ? ` — ${note}` : ''}`,
        href: '/sponsors/artista?tab=premios',
      });
    }
    this.emit();
    return ok();
  }

  confirmPrizeReceived(actor: SponsorActor | null, prizeId: string): ActionResult {
    const prize = this.getPrize(prizeId);
    if (!prize) return fail('Premio inexistente.');
    if (!actor || prize.winner_user_id !== actor.id) return fail('Solo el ganador puede confirmar la recepción.');
    this.state.prizes = this.state.prizes.map((p) =>
      p.id === prizeId
        ? {
            ...p,
            status: 'confirmado',
            delivery: [...p.delivery, { at: nowIso(), status: 'confirmado', note: 'Recepción confirmada por el ganador' }],
          }
        : p
    );
    this.log(actor, 'Recepción de premio confirmada', 'prize', prizeId);
    const brand = this.getBrand(prize.brand_id);
    if (brand) {
      this.notify({
        user_id: brand.owner_id,
        type: 'premio',
        title: 'El ganador confirmó la recepción',
        body: `${prize.title} — ${actor.full_name}`,
        href: '/sponsors/panel?tab=premios',
      });
    }
    this.emit();
    return ok();
  }

  // -------------------------------------------------------------- desafíos
  createChallenge(actor: SponsorActor | null, input: ChallengeInput): ActionResult<SponsorChallenge> {
    if (!this.canManageBrand(actor, input.brand_id)) return fail('Solo la marca puede crear desafíos.');
    if (!input.title.trim() || input.description.trim().length < 20) return fail('Completá el desafío (descripción mínima de 20 caracteres).');
    if (!input.rules.trim()) return fail('Las reglas del desafío son obligatorias.');
    if (isPast(input.deadline)) return fail('La fecha límite ya pasó.');
    if (!input.criteria.filter(Boolean).length) return fail('Definí al menos un criterio de evaluación.');

    const post = this.createSponsorPost(actor, {
      brand_id: input.brand_id,
      kind: 'desafio',
      title: input.title,
      body: `${input.description}\n\nReglas: ${input.rules}`,
      image_url: input.cover_url,
      tags: ['desafio', 'larvazchallenges', 'sponsors'],
    });
    if (!post.ok || !post.data) return fail(post.error || 'No se pudo publicar el desafío.');

    const challenge: SponsorChallenge = {
      id: uid('ch'),
      brand_id: input.brand_id,
      post_id: post.data.id,
      title: input.title.trim(),
      description: input.description.trim(),
      rules: input.rules.trim(),
      discipline: input.discipline,
      deadline: input.deadline,
      prize_description: input.prize_description.trim(),
      judging_mode: input.judging_mode,
      criteria: input.criteria.filter(Boolean),
      status: 'abierto',
      entries: [],
      created_at: nowIso(),
    };
    this.state.challenges = [challenge, ...this.state.challenges];
    this.state.posts = this.state.posts.map((p) =>
      p.id === challenge.post_id ? { ...p, challenge_id: challenge.id } : p
    );
    this.log(actor, 'Desafío publicado', 'challenge', challenge.id, challenge.title);
    this.emit();
    return ok(challenge);
  }

  submitChallengeEntry(
    actor: SponsorActor | null,
    challengeId: string,
    input: { title: string; description: string; media_url?: string }
  ): ActionResult<ChallengeEntry> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para participar del desafío.');
    const challenge = this.getChallenge(challengeId);
    if (!challenge) return fail('Desafío inexistente.');
    if (challenge.status !== 'abierto') return fail('El desafío no está recibiendo trabajos.');
    if (isPast(challenge.deadline)) return fail('El plazo de entrega terminó.');
    if (!input.title.trim()) return fail('Ponele un título a tu trabajo.');
    if (input.description.trim().length < 10) return fail('Describí tu trabajo (mínimo 10 caracteres).');
    if (!validUrl(input.media_url)) return fail('El enlace del trabajo no es válido.');
    if (challenge.entries.some((e) => e.user_id === actor.id)) return fail('Ya presentaste un trabajo en este desafío.');

    const entry: ChallengeEntry = {
      id: uid('che'),
      challenge_id: challengeId,
      user_id: actor.id,
      username: actor.username,
      full_name: actor.full_name,
      avatar_url: actor.avatar_url,
      title: input.title.trim(),
      description: input.description.trim(),
      media_url: input.media_url?.trim(),
      votes: [],
      created_at: nowIso(),
    };
    this.state.challenges = this.state.challenges.map((c) =>
      c.id === challengeId ? { ...c, entries: [entry, ...c.entries] } : c
    );
    this.awardPoints(actor.id, 'desafio_participar', entry.id, 'challenge_entry');
    this.log(actor, 'Trabajo presentado', 'challenge', challengeId, entry.title);
    this.emit();
    return ok(entry);
  }

  voteChallengeEntry(actor: SponsorActor | null, challengeId: string, entryId: string): ActionResult<{ votes: number }> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para votar.');
    const challenge = this.getChallenge(challengeId);
    if (!challenge) return fail('Desafío inexistente.');
    if (challenge.judging_mode !== 'votos') return fail('Este desafío se define por jurado.');
    if (challenge.status !== 'abierto') return fail('Las votaciones están cerradas.');
    const entry = challenge.entries.find((e) => e.id === entryId);
    if (!entry) return fail('Trabajo inexistente.');
    if (entry.user_id === actor.id) return fail('No podés votar tu propio trabajo.');
    if (entry.votes.includes(actor.id)) {
      // Permite retirar el voto, sin duplicados.
      const votes = entry.votes.filter((v) => v !== actor.id);
      this.state.challenges = this.state.challenges.map((c) =>
        c.id === challengeId
          ? { ...c, entries: c.entries.map((e) => (e.id === entryId ? { ...e, votes } : e)) }
          : c
      );
      this.emit();
      return ok({ votes: votes.length });
    }
    const votes = [...entry.votes, actor.id];
    this.state.challenges = this.state.challenges.map((c) =>
      c.id === challengeId
        ? { ...c, entries: c.entries.map((e) => (e.id === entryId ? { ...e, votes } : e)) }
        : c
    );
    this.log(actor, 'Voto emitido', 'challenge', challengeId, entryId);
    this.emit();
    return ok({ votes: votes.length });
  }

  setChallengeWinner(
    actor: SponsorActor | null,
    challengeId: string,
    entryId: string,
    justification: string
  ): ActionResult {
    const challenge = this.getChallenge(challengeId);
    if (!challenge) return fail('Desafío inexistente.');
    if (!this.canManageBrand(actor, challenge.brand_id)) return fail('Solo la marca puede definir ganadores.');
    if (!justification.trim() || justification.trim().length < 10)
      return fail('Registrá la justificación de la selección.');
    const entry = challenge.entries.find((e) => e.id === entryId);
    if (!entry) return fail('Trabajo inexistente.');

    this.state.challenges = this.state.challenges.map((c) =>
      c.id === challengeId
        ? { ...c, status: 'cerrado', winner_entry_id: entryId, justification: justification.trim() }
        : c
    );
    const prize: SponsorPrize = {
      id: uid('prize'),
      brand_id: challenge.brand_id,
      challenge_id: challengeId,
      position: 1,
      title: `${challenge.title} — ganador`,
      description: challenge.prize_description,
      kind: 'patrocinio',
      winner_user_id: entry.user_id,
      winner_username: entry.username,
      status: 'pendiente',
      delivery: [],
      created_at: nowIso(),
    };
    this.state.prizes = [prize, ...this.state.prizes];
    this.log(actor, 'Ganador de desafío', 'challenge', challengeId, `${entry.username}: ${justification}`);
    this.notify({
      user_id: entry.user_id,
      type: 'ganador',
      title: '¡Ganaste un desafío LARVAZ!',
      body: `${challenge.title}: ${challenge.prize_description}`,
      href: `/sponsors/desafio/${challengeId}`,
    });
    this.emit();
    return ok();
  }

  // -------------------------------------------------------------- campañas
  createCampaign(actor: SponsorActor | null, input: CampaignInput): ActionResult<SponsorCampaign> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para crear una campaña.');
    if (input.brand_id && !this.canManageBrand(actor, input.brand_id)) return fail('No podés publicar en nombre de esa marca.');
    if (!input.title.trim()) return fail('La campaña necesita un título.');
    if (input.description.trim().length < 30) return fail('Contá el proyecto (mínimo 30 caracteres).');
    if (!input.beneficiary.trim()) return fail('Indicá quién recibe el apoyo.');
    if (!(input.goal_amount > 0)) return fail('El objetivo económico debe ser mayor a cero.');
    if (isPast(input.closes_at)) return fail('La fecha de cierre ya pasó.');
    if (input.use_of_funds.trim().length < 15) return fail('Explicá el destino de los fondos.');

    const campaignPost: SponsorPost = {
      id: uid('spost'),
      brand_id: input.brand_id || '',
      author_id: actor.id,
      kind: 'donacion',
      title: input.title.trim(),
      body: input.description.trim(),
      image_url: input.image_url,
      gallery: [],
      tags: ['donacion', 'apoyar', 'larvaz'],
      likes: [],
      shares: 0,
      comments: [],
      created_at: nowIso(),
    };
    this.state.posts = [campaignPost, ...this.state.posts];

    const campaign: SponsorCampaign = {
      id: uid('camp'),
      brand_id: input.brand_id,
      owner_id: actor.id,
      post_id: campaignPost.id,
      title: input.title.trim(),
      description: input.description.trim(),
      image_url: input.image_url,
      beneficiary: input.beneficiary.trim(),
      goal_amount: input.goal_amount,
      currency: input.currency || 'USD',
      raised_amount: 0,
      donors_count: 0,
      closes_at: input.closes_at,
      use_of_funds: input.use_of_funds.trim(),
      updates: [],
      status: 'activa',
      created_at: nowIso(),
    };
    this.state.campaigns = [campaign, ...this.state.campaigns];
    if (campaign.post_id) {
      this.state.posts = this.state.posts.map((p) =>
        p.id === campaign.post_id ? { ...p, campaign_id: campaign.id } : p
      );
    }
    this.log(actor, 'Campaña creada', 'campaign', campaign.id, campaign.title);
    this.emit();
    return ok(campaign);
  }

  contributeToCampaign(actor: SponsorActor | null, campaignId: string, input: ContributionInput): ActionResult<CampaignContribution> {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) return fail('Campaña inexistente.');
    if (campaign.status !== 'activa') return fail('La campaña no está recibiendo aportes.');
    if (isPast(campaign.closes_at)) return fail('La campaña ya cerró.');
    if (!(input.amount > 0)) return fail('El importe debe ser mayor a cero.');
    if (input.message && input.message.length > 300) return fail('El mensaje es demasiado largo.');

    const contribution: CampaignContribution = {
      id: uid('cc'),
      campaign_id: campaignId,
      user_id: actor && !actor.is_guest ? actor.id : undefined,
      donor_name: input.anonymous ? 'Anónimo' : actor?.full_name || 'Donante',
      amount: Math.round(input.amount * 100) / 100,
      currency: input.currency || campaign.currency,
      method: input.method,
      status: 'pendiente',
      tx_ref: input.tx_ref?.trim(),
      message: input.message?.trim(),
      anonymous: input.anonymous,
      created_at: nowIso(),
    };
    this.state.contributions = [contribution, ...this.state.contributions];
    this.log(actor, 'Aporte registrado (pendiente)', 'campaign', campaignId, `${contribution.amount} ${contribution.currency}`);
    const owner = campaign.brand_id ? this.getBrand(campaign.brand_id)?.owner_id : campaign.owner_id;
    if (owner) {
      this.notify({
        user_id: owner,
        type: 'donacion',
        title: 'Nuevo aporte pendiente de verificación',
        body: `${contribution.donor_name}: ${formatMoney(contribution.amount, contribution.currency)}`,
        href: `/sponsors/campana/${campaignId}`,
      });
    }
    this.emit();
    return ok(contribution);
  }

  verifyContribution(
    actor: SponsorActor | null,
    contributionId: string,
    accept: boolean,
    note?: string
  ): ActionResult {
    const contribution = this.getSnapshot().contributions.find((c) => c.id === contributionId);
    if (!contribution) return fail('Aporte inexistente.');
    if (contribution.status !== 'pendiente') return fail('Este aporte ya fue revisado.');
    const campaign = this.getCampaign(contribution.campaign_id);
    if (!campaign) return fail('Campaña inexistente.');
    const owner = campaign.brand_id ? this.getBrand(campaign.brand_id)?.owner_id : campaign.owner_id;
    const allowed = isAdminActor(actor) || (actor && (actor.id === owner || actor.id === campaign.owner_id));
    if (!allowed) return fail('Solo la marca o administración puede verificar aportes.');

    this.state.contributions = this.state.contributions.map((c) =>
      c.id === contributionId
        ? {
            ...c,
            status: accept ? 'verificado' : 'rechazado',
            verified_by: actor?.id || 'sistema',
            verified_at: nowIso(),
          }
        : c
    );

    if (accept) {
      this.state.campaigns = this.state.campaigns.map((c) =>
        c.id === contribution.campaign_id
          ? {
              ...c,
              raised_amount: Math.round((c.raised_amount + contribution.amount) * 100) / 100,
              donors_count: c.donors_count + 1,
            }
          : c
      );
      this.awardPoints(contribution.user_id, 'donacion_verificada', contribution.id, 'contribution');
      if (contribution.user_id) {
        this.notify({
          user_id: contribution.user_id,
          type: 'donacion',
          title: 'Tu aporte fue verificado',
          body: `Gracias por apoyar "${campaign.title}".`,
          href: `/sponsors/campana/${campaign.id}`,
        });
      }
    }

    this.log(
      actor,
      accept ? 'Aporte verificado' : 'Aporte rechazado',
      'campaign',
      contribution.campaign_id,
      `${contribution.amount} ${contribution.currency}${note ? ` — ${note}` : ''}`
    );
    this.emit();
    return ok();
  }

  addCampaignUpdate(actor: SponsorActor | null, campaignId: string, text: string): ActionResult {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) return fail('Campaña inexistente.');
    const owner = campaign.brand_id ? this.getBrand(campaign.brand_id)?.owner_id : campaign.owner_id;
    if (!isAdminActor(actor) && actor?.id !== owner && actor?.id !== campaign.owner_id) {
      return fail('Solo la organización puede publicar novedades.');
    }
    if (text.trim().length < 5) return fail('Escribí la novedad.');
    this.state.campaigns = this.state.campaigns.map((c) =>
      c.id === campaignId ? { ...c, updates: [{ at: nowIso(), text: text.trim() }, ...c.updates] } : c
    );
    this.log(actor, 'Novedad de campaña', 'campaign', campaignId);
    this.emit();
    return ok();
  }

  setCampaignStatus(actor: SponsorActor | null, campaignId: string, status: CampaignStatus): ActionResult {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) return fail('Campaña inexistente.');
    const owner = campaign.brand_id ? this.getBrand(campaign.brand_id)?.owner_id : campaign.owner_id;
    if (!isAdminActor(actor) && actor?.id !== owner && actor?.id !== campaign.owner_id) {
      return fail('No tenés permisos sobre esta campaña.');
    }
    this.state.campaigns = this.state.campaigns.map((c) => (c.id === campaignId ? { ...c, status } : c));
    this.log(actor, `Campaña ${status}`, 'campaign', campaignId);
    this.emit();
    return ok();
  }

  // -------------------------------------------------------------- reputación
  createReview(actor: SponsorActor | null, agreementId: string, input: ReviewInput): ActionResult<SponsorReview> {
    if (!actor || actor.is_guest) return fail('Iniciá sesión para dejar una reseña.');
    const agreement = this.getAgreement(agreementId);
    if (!agreement) return fail('Acuerdo inexistente.');
    if (agreement.status !== 'completado') {
      return fail('Solo podés reseñar colaboraciones completadas y verificadas.');
    }
    const isArtist = agreement.artist_id === actor.id;
    const brand = this.getBrand(agreement.brand_id);
    const isBrand = brand?.owner_id === actor.id;
    if (!isArtist && !isBrand) return fail('No formás parte de este acuerdo.');

    const role = isArtist ? 'artista' : 'marca';
    const already = this.getAgreementReviews(agreementId).some((r) => r.from_role === role);
    if (already) return fail('Ya dejaste tu reseña para este acuerdo.');

    const ratings = input.ratings;
    const values = [ratings.seriousness, ratings.compliance, ratings.communication, ratings.quality];
    if (values.some((v) => !(v >= 1 && v <= 5))) return fail('Puntuá de 1 a 5 en todos los criterios.');
    if (input.comment.trim().length < 10) return fail('Contá brevemente tu experiencia (mínimo 10 caracteres).');

    const review: SponsorReview = {
      id: uid('rev'),
      agreement_id: agreementId,
      brand_id: agreement.brand_id,
      from_id: actor.id,
      from_role: role,
      ratings,
      comment: input.comment.trim(),
      created_at: nowIso(),
    };
    this.state.reviews = [review, ...this.state.reviews];

    const brandReviews = this.state.reviews.filter((r) => r.brand_id === agreement.brand_id);
    const avg =
      brandReviews.reduce((sum, r) => {
        const rv = [r.ratings.seriousness, r.ratings.compliance, r.ratings.communication, r.ratings.quality];
        return sum + rv.reduce((a, b) => a + b, 0) / 4;
      }, 0) / Math.max(1, brandReviews.length);
    this.state.brands = this.state.brands.map((b) =>
      b.id === agreement.brand_id
        ? { ...b, reputation: { score: Math.round(avg * 10) / 10, reviews: brandReviews.length } }
        : b
    );

    this.awardPoints(actor.id, 'resena', review.id, 'review');
    this.log(actor, 'Reseña publicada', 'agreement', agreementId, role);
    const target = isArtist ? brand?.owner_id : agreement.artist_id;
    if (target) {
      this.notify({
        user_id: target,
        type: 'review',
        title: 'Recibiste una reseña',
        body: `${actor.full_name} valoró tu colaboración.`,
        href: isArtist ? '/sponsors/panel?tab=reputacion' : '/sponsors/artista?tab=reputacion',
      });
    }
    this.emit();
    return ok(review);
  }

  // -------------------------------------------------------------- notificaciones
  markNotificationRead = (notificationId: string) => {
    this.state.notifications = this.state.notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.emit();
  };

  markAllNotificationsRead = (userId?: string) => {
    this.state.notifications = this.state.notifications.map((n) =>
      n.user_id === userId ? { ...n, read: true } : n
    );
    this.emit();
  };

  // -------------------------------------------------------------- estadísticas
  brandStats(brandId: string): BrandStats {
    const state = this.getSnapshot();
    const posts = state.posts.filter((p) => p.brand_id === brandId);
    const opportunities = state.opportunities.filter((o) => o.brand_id === brandId);
    const applications = state.applications.filter((a) => a.brand_id === brandId);
    const sweepstakes = state.sweepstakes.filter((s) => s.brand_id === brandId);
    const challenges = state.challenges.filter((c) => c.brand_id === brandId);
    const campaigns = state.campaigns.filter((c) => c.brand_id === brandId);
    const campaignIds = new Set(campaigns.map((c) => c.id));
    const sweepstakeIds = new Set(sweepstakes.map((s) => s.id));
    const brand = this.getBrand(brandId);

    return {
      followers: brand?.followers.length || 0,
      posts: posts.length,
      likes: posts.reduce((sum, p) => sum + p.likes.length, 0),
      comments: posts.reduce((sum, p) => sum + p.comments.length, 0),
      shares: posts.reduce((sum, p) => sum + p.shares, 0),
      opportunities: opportunities.length,
      applications: applications.length,
      agreements: state.agreements.filter((a) => a.brand_id === brandId).length,
      activeCampaigns: campaigns.filter((c) => c.status === 'activa').length,
      activeSweepstakes: sweepstakes.filter((s) => s.status === 'activo').length,
      participants: state.participations.filter((p) => sweepstakeIds.has(p.sweepstake_id) && p.valid).length,
      winners: sweepstakes.reduce((sum, s) => sum + s.winners.length, 0) + challenges.filter((c) => c.winner_entry_id).length,
      pendingPrizes: state.prizes.filter(
        (p) => p.brand_id === brandId && !['entregado', 'confirmado'].includes(p.status)
      ).length,
      donationsVerified: state.contributions
        .filter((c) => campaignIds.has(c.campaign_id) && c.status === 'verificado')
        .reduce((sum, c) => sum + c.amount, 0),
    };
  }

  globalStats() {
    const state = this.getSnapshot();
    return {
      brands: state.brands.length,
      verifiedBrands: state.brands.filter((b) => b.verification === 'verificada').length,
      pendingBrands: state.brands.filter((b) => b.verification === 'pendiente').length,
      opportunities: state.opportunities.filter((o) => o.status === 'abierta').length,
      applications: state.applications.length,
      agreements: state.agreements.length,
      activeAgreements: state.agreements.filter((a) => ['aceptado', 'en_curso', 'cumplimiento_parcial'].includes(a.status)).length,
      posts: state.posts.length,
      sweepstakes: state.sweepstakes.length,
      activeSweepstakes: state.sweepstakes.filter((s) => s.status === 'activo').length,
      participants: state.participations.filter((p) => p.valid).length,
      challenges: state.challenges.length,
      campaigns: state.campaigns.length,
      raised: state.contributions.filter((c) => c.status === 'verificado').reduce((sum, c) => sum + c.amount, 0),
      pendingContributions: state.contributions.filter((c) => c.status === 'pendiente').length,
      disputes: state.agreements.filter((a) => a.status === 'disputa').length,
      prizesPending: state.prizes.filter((p) => !['entregado', 'confirmado'].includes(p.status)).length,
    };
  }

  resolveDispute(actor: SponsorActor | null, agreementId: string, resolution: string): ActionResult {
    if (!isAdminActor(actor)) return fail('Solo administración puede resolver disputas.');
    const agreement = this.getAgreement(agreementId);
    if (!agreement) return fail('Acuerdo inexistente.');
    if (!resolution.trim()) return fail('Escribí la resolución.');
    this.state.agreements = this.state.agreements.map((a) =>
      a.id === agreementId
        ? {
            ...a,
            status: 'completado',
            history: [
              ...a.history,
              { at: nowIso(), by_id: actor!.id, by_name: actor!.full_name, action: 'Disputa resuelta', note: resolution },
            ],
          }
        : a
    );
    this.log(actor, 'Disputa resuelta', 'agreement', agreementId, resolution);
    [agreement.artist_id, this.getBrand(agreement.brand_id)?.owner_id].forEach((userId) => {
      if (!userId) return;
      this.notify({
        user_id: userId,
        type: 'acuerdo',
        title: 'Disputa resuelta por administración',
        body: resolution,
        href: '/sponsors/panel?tab=acuerdos',
      });
    });
    this.emit();
    return ok();
  }

  /** Texto de ayuda para mostrar el premio de un sorteo. */
  sweepstakePrizeLabel(sw: SponsorSweepstake): string {
    return `${formatMoney(sw.prize_value, sw.currency)} · ${artistCategoryLabel(sw.category)}`;
  }
}

export const sponsorsStore = new SponsorsStore();
export { isAdminActor };
export type { SponsorsStore };
export { EVENT_NAME as SPONSORS_EVENT };
