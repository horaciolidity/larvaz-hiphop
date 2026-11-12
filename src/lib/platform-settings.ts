/**
 * Ajustes globales de la plataforma.
 *
 * Estos valores se editan desde el Panel Super Admin y se guardan en
 * Supabase Storage (settings/platform.json) para que todos los usuarios
 * reciban la misma configuración sin necesidad de migraciones SQL.
 */

export interface PlatformWalletSettings {
  btc: string;
  eth: string;
  sol: string;
  usdt: string;
  usdc: string;
  contactEmail: string;
}

export interface PlatformMediaSettings {
  /** Máximo de fotos por publicación */
  maxImagesPerPost: number;
  /** Máximo de audios por publicación */
  maxAudiosPerPost: number;
  /** Tamaño máximo del archivo original de imagen (MB) */
  maxImageMb: number;
  /** Tamaño máximo del archivo original de audio (MB) */
  maxAudioMb: number;
  /** Tamaño máximo del archivo original de video (MB) */
  maxVideoMb: number;
  /** Lado máximo al que se redimensionan las fotos */
  imageMaxDimension: number;
  /** Calidad JPEG (0.4 - 0.95) */
  imageQuality: number;
  /** Bitrate por defecto para recomprimir audios a MP3 */
  audioBitrateKbps: number;
  /** Duración máxima de audio permitida (segundos) */
  audioMaxDurationSec: number;
  /** Recompresión automática de audio activada */
  audioCompressionEnabled: boolean;
  /** Límite de subida por archivo (MB). Vercel limita el body a ~4.5 MB. */
  maxUploadMb: number;
  /** Cuota orientativa de almacenamiento (MB) usada en el panel */
  storageQuotaMb: number;
}

export interface PlatformFeatureSettings {
  commentsEnabled: boolean;
  uploadsEnabled: boolean;
  registrationsEnabled: boolean;
  referralsEnabled: boolean;
  tipsEnabled: boolean;
  radioEnabled: boolean;
}

export interface PlatformSettings {
  wallets: PlatformWalletSettings;
  media: PlatformMediaSettings;
  features: PlatformFeatureSettings;
  announcement: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const MAX_SERVER_UPLOAD_MB = 4.2;

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  wallets: {
    btc: '',
    eth: '',
    sol: '',
    usdt: '',
    usdc: '',
    contactEmail: 'contacto@larvazhiphop.org',
  },
  media: {
    maxImagesPerPost: 3,
    maxAudiosPerPost: 3,
    maxImageMb: 20,
    maxAudioMb: 30,
    maxVideoMb: 25,
    imageMaxDimension: 1600,
    imageQuality: 0.82,
    audioBitrateKbps: 64,
    audioMaxDurationSec: 600,
    audioCompressionEnabled: true,
    maxUploadMb: MAX_SERVER_UPLOAD_MB,
    storageQuotaMb: 1024,
  },
  features: {
    commentsEnabled: true,
    uploadsEnabled: true,
    registrationsEnabled: true,
    referralsEnabled: true,
    tipsEnabled: true,
    radioEnabled: true,
  },
  announcement: '',
};

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function cleanString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim().slice(0, 240) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Normaliza y valida cualquier JSON recibido antes de usarlo o guardarlo. */
export function normalizePlatformSettings(input: any): PlatformSettings {
  const raw = input && typeof input === 'object' ? input : {};
  const rawMedia = raw.media && typeof raw.media === 'object' ? raw.media : {};
  const rawWallets = raw.wallets && typeof raw.wallets === 'object' ? raw.wallets : {};
  const rawFeatures = raw.features && typeof raw.features === 'object' ? raw.features : {};
  const d = DEFAULT_PLATFORM_SETTINGS;

  const media: PlatformMediaSettings = {
    maxImagesPerPost: Math.round(clampNumber(rawMedia.maxImagesPerPost, d.media.maxImagesPerPost, 1, 10)),
    maxAudiosPerPost: Math.round(clampNumber(rawMedia.maxAudiosPerPost, d.media.maxAudiosPerPost, 1, 10)),
    maxImageMb: clampNumber(rawMedia.maxImageMb, d.media.maxImageMb, 1, 20),
    maxAudioMb: clampNumber(rawMedia.maxAudioMb, d.media.maxAudioMb, 1, 30),
    maxVideoMb: clampNumber(rawMedia.maxVideoMb, d.media.maxVideoMb, 1, 30),
    imageMaxDimension: Math.round(clampNumber(rawMedia.imageMaxDimension, d.media.imageMaxDimension, 480, 2400)),
    imageQuality: clampNumber(rawMedia.imageQuality, d.media.imageQuality, 0.4, 0.95),
    audioBitrateKbps: Math.round(clampNumber(rawMedia.audioBitrateKbps, d.media.audioBitrateKbps, 32, 128)),
    audioMaxDurationSec: Math.round(clampNumber(rawMedia.audioMaxDurationSec, d.media.audioMaxDurationSec, 30, 3600)),
    audioCompressionEnabled: bool(rawMedia.audioCompressionEnabled, d.media.audioCompressionEnabled),
    maxUploadMb: clampNumber(rawMedia.maxUploadMb, d.media.maxUploadMb, 0.5, MAX_SERVER_UPLOAD_MB),
    storageQuotaMb: Math.round(clampNumber(rawMedia.storageQuotaMb, d.media.storageQuotaMb, 100, 10240)),
  };

  const wallets: PlatformWalletSettings = {
    btc: cleanString(rawWallets.btc),
    eth: cleanString(rawWallets.eth),
    sol: cleanString(rawWallets.sol),
    usdt: cleanString(rawWallets.usdt),
    usdc: cleanString(rawWallets.usdc),
    contactEmail: cleanString(rawWallets.contactEmail, d.wallets.contactEmail),
  };

  const features: PlatformFeatureSettings = {
    commentsEnabled: bool(rawFeatures.commentsEnabled, d.features.commentsEnabled),
    uploadsEnabled: bool(rawFeatures.uploadsEnabled, d.features.uploadsEnabled),
    registrationsEnabled: bool(rawFeatures.registrationsEnabled, d.features.registrationsEnabled),
    referralsEnabled: bool(rawFeatures.referralsEnabled, d.features.referralsEnabled),
    tipsEnabled: bool(rawFeatures.tipsEnabled, d.features.tipsEnabled),
    radioEnabled: bool(rawFeatures.radioEnabled, d.features.radioEnabled),
  };

  return {
    wallets,
    media,
    features,
    announcement: cleanString(raw.announcement),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : undefined,
  };
}
