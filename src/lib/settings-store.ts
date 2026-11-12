import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  DEFAULT_PLATFORM_SETTINGS,
  normalizePlatformSettings,
  PlatformSettings,
} from '@/lib/platform-settings';

export const MEDIA_BUCKET = 'post-media';
const SETTINGS_PATH = 'settings/platform.json';

const BUCKET_MIME_TYPES = [
  'image/*',
  'audio/*',
  'video/*',
  'application/json',
  'application/octet-stream',
];

/** Crea el bucket público de medios si todavía no existe. */
export async function ensureMediaBucket(): Promise<boolean> {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === MEDIA_BUCKET);
    if (exists) return true;

    const { error } = await supabaseAdmin.storage.createBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: 4718592,
      allowedMimeTypes: BUCKET_MIME_TYPES,
    });
    if (error) {
      console.warn('[settings] No se pudo crear el bucket:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[settings] Error verificando bucket:', err);
    return false;
  }
}

/**
 * El bucket pudo haberse creado antes solo para imágenes/audio/video.
 * Supabase rechaza la subida del JSON de configuración si `application/json`
 * no está en la lista permitida, así que la ampliamos una vez por escritura.
 */
async function ensureSettingsMimeAllowed(): Promise<void> {
  try {
    await supabaseAdmin.storage.updateBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: 4718592,
      allowedMimeTypes: BUCKET_MIME_TYPES,
    });
  } catch {
    // si falla, la subida devolverá el error real más abajo
  }
}

/** Lee la configuración global; si no existe devuelve los valores por defecto. */
export async function readPlatformSettings(): Promise<PlatformSettings> {
  try {
    const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
    if (!base) return { ...DEFAULT_PLATFORM_SETTINGS };

    // Se lee por la URL pública con cache-busting: el endpoint autenticado de
    // Storage puede devolver una copia en caché justo después de guardar.
    const url = `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${SETTINGS_PATH}?v=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return { ...DEFAULT_PLATFORM_SETTINGS };

    const json = await res.json();
    return normalizePlatformSettings(json);
  } catch {
    return { ...DEFAULT_PLATFORM_SETTINGS };
  }
}

/** Guarda la configuración global validada. */
export async function writePlatformSettings(
  input: Partial<PlatformSettings> & Record<string, any>,
  updatedBy?: string
): Promise<PlatformSettings> {
  const normalized = normalizePlatformSettings({
    ...input,
    updatedAt: new Date().toISOString(),
    updatedBy,
  });

  await ensureMediaBucket();
  await ensureSettingsMimeAllowed();

  const payload = Buffer.from(JSON.stringify(normalized, null, 2), 'utf8');
  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(SETTINGS_PATH, payload, {
      contentType: 'application/json',
      upsert: true,
      cacheControl: '0',
    });

  if (error) throw new Error(error.message);
  return normalized;
}

export interface StorageStats {
  files: number;
  bytes: number;
}

/** Recorre el bucket para calcular archivos y peso total (uso del panel admin). */
export async function getStorageStats(): Promise<StorageStats> {
  let files = 0;
  let bytes = 0;

  const walk = async (prefix: string, depth: number): Promise<void> => {
    if (depth > 3) return;
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(MEDIA_BUCKET)
        .list(prefix, { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });

      if (error || !data) return;

      for (const item of data) {
        if (item.id) {
          files += 1;
          bytes += Number((item.metadata as any)?.size || 0);
        } else {
          const child = prefix ? `${prefix}/${item.name}` : item.name;
          await walk(child, depth + 1);
        }
      }
    } catch {
      // ignoramos errores de carpetas puntuales
    }
  };

  await walk('', 0);
  return { files, bytes };
}
