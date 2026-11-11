import { fileToDataUrl } from './audio-compress';

export interface UploadedMediaResult {
  url: string;
  storage: 'supabase' | 'local';
}

/** Hasta este tamaño toleramos guardar el archivo como data URL local. */
const MAX_LOCAL_FALLBACK_BYTES: Record<'image' | 'audio' | 'video', number> = {
  image: 1.2 * 1024 * 1024,
  audio: 700 * 1024,
  video: 700 * 1024,
};

/**
 * Sube un archivo a Supabase Storage mediante /api/media/upload.
 * Si el storage no está disponible (modo local), cae a data URL para
 * archivos chicos. Los archivos grandes fallan con un error claro en vez
 * de romper localStorage o el límite de body de Vercel.
 */
export async function uploadMediaFile(
  file: File,
  kind: 'image' | 'audio' | 'video'
): Promise<UploadedMediaResult> {
  let serverError = '';

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);

    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.url) {
        return { url: String(data.url), storage: 'supabase' };
      }
    } else {
      try {
        const data = await res.json();
        serverError = String(data?.error || '');
      } catch {
        serverError = `El servidor respondió ${res.status}`;
      }
    }
  } catch {
    serverError = 'No hay conexión con el almacenamiento de Larvaz';
  }

  if (file.size > MAX_LOCAL_FALLBACK_BYTES[kind]) {
    throw new Error(
      serverError ||
        'No se pudo subir el archivo al almacenamiento de Larvaz. Probá de nuevo en unos segundos.'
    );
  }

  return { url: await fileToDataUrl(file), storage: 'local' };
}
