// ============================================================================
// LARVAZ SPONSORS — Modelo de datos
// Extensión nativa de LARVAZ HIP-HOP. Todos los registros se relacionan con
// los perfiles existentes (profiles.id) y se persisten en el store de Larvaz.
// ============================================================================

export type SponsorCommercialCategory =
  | 'indumentaria'
  | 'calzado'
  | 'accesorios'
  | 'tecnologia'
  | 'musica'
  | 'audiovisual'
  | 'arte'
  | 'deportes'
  | 'bebidas'
  | 'eventos'
  | 'servicios'
  | 'otros';

export type SponsorArtistCategory =
  | 'mc'
  | 'bboy'
  | 'dj'
  | 'graffiti'
  | 'bailarin'
  | 'productor'
  | 'fotografo'
  | 'crew'
  | 'skate'
  | 'otros';

export type BrandVerificationStatus = 'pendiente' | 'verificada' | 'rechazada' | 'suspendida';

export interface BrandReputation {
  score: number; // 0 a 5
  reviews: number;
}

export interface SponsorBrand {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  logo_url?: string;
  cover_url?: string;
  description: string;
  category: SponsorCommercialCategory;
  country: string;
  province?: string;
  city: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  seeking_categories: SponsorArtistCategory[];
  interest_locations: string[];
  verification: BrandVerificationStatus;
  verification_note?: string;
  verified_at?: string;
  verified_by?: string;
  followers: string[];
  reputation: BrandReputation;
  created_at: string;
  updated_at?: string;
}

export type SponsorshipType = 'economico' | 'productos' | 'logistico' | 'mixto' | 'cripto';
export type PaymentModality = 'unico' | 'mensual' | 'proyecto' | 'campana';

export interface CryptoPaymentDetails {
  asset: string;
  blockchain: string;
  network: string;
  amount: number;
  receiving_address?: string;
  status: 'pendiente' | 'comprobante_recibido' | 'verificado';
  tx_ref?: string;
}

export interface SponsorshipOffer {
  type: SponsorshipType;
  payment_modality?: PaymentModality;
  amount?: number;
  currency?: string;
  products?: string[];
  logistics?: string[];
  crypto?: CryptoPaymentDetails;
  summary: string;
}

export type CounterpartKind =
  | 'publicaciones'
  | 'historias'
  | 'menciones'
  | 'fotos'
  | 'videos'
  | 'posts_larvaz'
  | 'presentaciones'
  | 'presencia_marca'
  | 'disenos'
  | 'murales'
  | 'produccion_musical'
  | 'colaboraciones'
  | 'exclusividad'
  | 'otro';

export type CounterpartStatus = 'pendiente' | 'en_proceso' | 'entregado' | 'aprobado' | 'rechazado';

export interface Counterpart {
  id: string;
  kind: CounterpartKind;
  description: string;
  quantity: number;
  platform?: string;
  due_date?: string;
  evidence_required?: string;
  status: CounterpartStatus;
  evidence_url?: string;
}

export type OpportunityStatus = 'borrador' | 'abierta' | 'pausada' | 'cerrada';

export interface SponsorshipOpportunity {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  image_url?: string;
  offer: SponsorshipOffer;
  artist_categories: SponsorArtistCategory[];
  counterparts: Counterpart[];
  country: string;
  province?: string;
  city: string;
  is_remote: boolean;
  duration_days: number;
  deadline: string;
  slots: number;
  status: OpportunityStatus;
  applications_count: number;
  created_at: string;
}

export type ApplicationStatus = 'pendiente' | 'preseleccionada' | 'oferta' | 'aceptada' | 'rechazada' | 'retirada';

export interface SponsorOffer {
  amount?: number;
  currency?: string;
  note: string;
  sent_at: string;
}

export interface SponsorApplication {
  id: string;
  opportunity_id: string;
  brand_id: string;
  artist_id: string;
  artist_username: string;
  artist_name: string;
  artist_avatar?: string;
  message: string;
  portfolio_url?: string;
  social_links: { label: string; url: string }[];
  experience: string;
  proposal: string;
  status: ApplicationStatus;
  offer?: SponsorOffer;
  brand_note?: string;
  created_at: string;
  updated_at?: string;
}

export type AgreementStatus =
  | 'pendiente'
  | 'negociacion'
  | 'aceptado'
  | 'en_curso'
  | 'cumplimiento_parcial'
  | 'completado'
  | 'cancelado'
  | 'disputa';

export interface AgreementHistoryItem {
  at: string;
  by_id: string;
  by_name: string;
  action: string;
  note?: string;
}

export interface SponsorshipAgreement {
  id: string;
  opportunity_id?: string;
  application_id?: string;
  brand_id: string;
  artist_id: string;
  artist_username: string;
  artist_name: string;
  title: string;
  benefits: string;
  offer?: SponsorshipOffer;
  counterparts: Counterpart[];
  start_date: string;
  end_date: string;
  terms: string;
  status: AgreementStatus;
  accepted_by_brand: boolean;
  accepted_by_artist: boolean;
  history: AgreementHistoryItem[];
  created_at: string;
}

export type SponsorPostKind =
  | 'normal'
  | 'producto'
  | 'lanzamiento'
  | 'promocion'
  | 'patrocinio'
  | 'convocatoria'
  | 'busqueda'
  | 'sorteo'
  | 'concurso'
  | 'desafio'
  | 'premio'
  | 'donacion'
  | 'evento'
  | 'competencia'
  | 'proyecto';

export interface SponsorComment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

export interface SponsorPost {
  id: string;
  brand_id: string;
  author_id: string;
  kind: SponsorPostKind;
  title: string;
  body: string;
  image_url?: string;
  gallery: string[];
  link_url?: string;
  tags: string[];
  likes: string[];
  shares: number;
  comments: SponsorComment[];
  created_at: string;
  /** Vínculos a módulos del segmento */
  sweepstake_id?: string;
  challenge_id?: string;
  campaign_id?: string;
}

export type SweepstakeMethod =
  | 'boton'
  | 'comentarios'
  | 'likes'
  | 'numeros'
  | 'palabras'
  | 'mejor_comentario'
  | 'aleatorio';

export type SweepstakeStatus = 'borrador' | 'activo' | 'cerrado' | 'sorteado' | 'cancelado';

export interface SweepstakeCommentRule {
  mode: 'libre' | 'palabra' | 'pregunta' | 'creativo' | 'adivinanza';
  required_word?: string;
  question?: string;
  answer?: string;
}

export interface SweepstakeNumberRule {
  mode: 'exacto' | 'cercano' | 'primero' | 'aleatorio_acertantes';
  min: number;
  max: number;
  /** Secreto del sorteo. Nunca se muestra hasta finalizar. */
  secret: number;
}

export interface SweepstakeWordRule {
  secret: string;
  hints: string[];
}

export interface SweepstakeWinner {
  participation_id: string;
  user_id: string;
  username: string;
  position: number;
  prize_id?: string;
}

export interface SweepstakeAuditEntry {
  id: string;
  at: string;
  actor_id: string;
  action: string;
  hash: string;
  detail?: string;
}

export interface SponsorSweepstake {
  id: string;
  brand_id: string;
  post_id: string;
  title: string;
  description: string;
  prize_image_url?: string;
  category: SponsorArtistCategory | 'otros';
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
  status: SweepstakeStatus;
  likes_required: boolean;
  comment_rule?: SweepstakeCommentRule;
  number_rule?: SweepstakeNumberRule;
  word_rule?: SweepstakeWordRule;
  judging?: { criteria: string; winner_participation_id?: string; justification?: string };
  seed?: string;
  drawn_at?: string;
  winners: SweepstakeWinner[];
  audit: SweepstakeAuditEntry[];
  created_at: string;
}

export interface SweepstakeParticipation {
  id: string;
  sweepstake_id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  method: SweepstakeMethod;
  comment_text?: string;
  guess?: string;
  valid: boolean;
  invalid_reason?: string;
  score?: number;
}

export type PrizeDeliveryStatus =
  | 'pendiente'
  | 'contactando'
  | 'coordinando'
  | 'enviado'
  | 'entregado'
  | 'incidencia'
  | 'confirmado';

export interface PrizeDeliveryEvent {
  at: string;
  status: PrizeDeliveryStatus;
  note?: string;
  proof_url?: string;
}

export interface SponsorPrize {
  id: string;
  brand_id: string;
  sweepstake_id?: string;
  challenge_id?: string;
  position: number;
  title: string;
  description?: string;
  kind: 'dinero' | 'cripto' | 'producto' | 'servicio' | 'experiencia' | 'beca' | 'patrocinio';
  estimated_value?: number;
  currency?: string;
  winner_user_id?: string;
  winner_username?: string;
  status: PrizeDeliveryStatus;
  delivery: PrizeDeliveryEvent[];
  created_at: string;
}

export type ChallengeStatus = 'abierto' | 'en_evaluacion' | 'cerrado';

export interface ChallengeEntry {
  id: string;
  challenge_id: string;
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  title: string;
  description: string;
  media_url?: string;
  votes: string[];
  score?: number;
  created_at: string;
}

export interface SponsorChallenge {
  id: string;
  brand_id: string;
  post_id: string;
  title: string;
  description: string;
  rules: string;
  discipline: SponsorArtistCategory;
  deadline: string;
  prize_description: string;
  judging_mode: 'votos' | 'jurado';
  criteria: string[];
  status: ChallengeStatus;
  entries: ChallengeEntry[];
  winner_entry_id?: string;
  justification?: string;
  created_at: string;
}

export type CampaignStatus = 'activa' | 'pausada' | 'finalizada';

export interface CampaignUpdate {
  at: string;
  text: string;
}

export interface SponsorCampaign {
  id: string;
  brand_id?: string;
  owner_id: string;
  post_id?: string;
  title: string;
  description: string;
  image_url?: string;
  beneficiary: string;
  goal_amount: number;
  currency: string;
  raised_amount: number;
  donors_count: number;
  closes_at: string;
  use_of_funds: string;
  updates: CampaignUpdate[];
  status: CampaignStatus;
  created_at: string;
}

export type ContributionStatus = 'pendiente' | 'verificado' | 'rechazado';

export interface CampaignContribution {
  id: string;
  campaign_id: string;
  user_id?: string;
  donor_name: string;
  amount: number;
  currency: string;
  method: 'transferencia' | 'cripto' | 'externo';
  status: ContributionStatus;
  tx_ref?: string;
  message?: string;
  anonymous: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export type PointsAction =
  | 'sorteo_participar'
  | 'desafio_participar'
  | 'comentario_sponsor'
  | 'donacion_verificada'
  | 'acuerdo_completado'
  | 'resena'
  | 'perfil_completo';

export interface PointsEntry {
  id: string;
  user_id: string;
  action: PointsAction;
  points: number;
  ref_id?: string;
  ref_type?: string;
  created_at: string;
}

export interface SponsorReview {
  id: string;
  agreement_id: string;
  brand_id: string;
  from_id: string;
  from_role: 'marca' | 'artista';
  ratings: {
    seriousness: number;
    compliance: number;
    communication: number;
    quality: number;
  };
  comment: string;
  created_at: string;
}

export type SponsorNotificationType =
  | 'nueva_postulacion'
  | 'nueva_oportunidad'
  | 'oferta'
  | 'acuerdo'
  | 'sorteo'
  | 'participacion'
  | 'ganador'
  | 'premio'
  | 'donacion'
  | 'campana'
  | 'compromiso'
  | 'verificacion'
  | 'review';

export interface SponsorNotification {
  id: string;
  user_id: string;
  type: SponsorNotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  created_at: string;
}

export interface SponsorAudit {
  id: string;
  at: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  detail?: string;
  hash?: string;
}

export interface SponsorsState {
  version: number;
  seeded: boolean;
  brands: SponsorBrand[];
  opportunities: SponsorshipOpportunity[];
  applications: SponsorApplication[];
  agreements: SponsorshipAgreement[];
  posts: SponsorPost[];
  sweepstakes: SponsorSweepstake[];
  participations: SweepstakeParticipation[];
  prizes: SponsorPrize[];
  challenges: SponsorChallenge[];
  campaigns: SponsorCampaign[];
  contributions: CampaignContribution[];
  points: PointsEntry[];
  reviews: SponsorReview[];
  notifications: SponsorNotification[];
  audit: SponsorAudit[];
}

export interface SponsorActor {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
  is_guest?: boolean;
  location?: string;
}

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}
