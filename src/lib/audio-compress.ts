/**
 * Compresión de imágenes y audio 100% en el navegador.
 *
 * Los audios se decodifican con Web Audio y se vuelven a codificar a MP3
 * mono con lamejs. El resultado pesa muchísimo menos (por ejemplo un MP3
 * de 320 kbps baja a ~64 kbps) y se reproduce en cualquier navegador.
 */

export interface CompressAudioOptions {
  /** Bitrate final en kbps (48, 56, 64, 80, 96...) */
  bitrateKbps?: number;
  /** Duración máxima permitida en segundos */
  maxDurationSec?: number;
  /** Frecuencia de muestreo final */
  sampleRate?: number;
}

export interface CompressedAudioResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  duration: number;
  bitrateKbps: number;
  wasCompressed: boolean;
}

export class MediaCompressionError extends Error {
  code: 'decode' | 'duration' | 'encoder' | 'unsupported';
  constructor(message: string, code: MediaCompressionError['code'] = 'unsupported') {
    super(message);
    this.name = 'MediaCompressionError';
    this.code = code;
  }
}

function clamp16(value: number): number {
  const s = Math.max(-1, Math.min(1, value));
  return s < 0 ? s * 0x8000 : s * 0x7fff;
}

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as any).webkitAudioContext || null;
}

function getOfflineAudioContextClass(): typeof OfflineAudioContext | null {
  if (typeof window === 'undefined') return null;
  return (
    window.OfflineAudioContext ||
    (window as any).webkitOfflineAudioContext ||
    null
  );
}

/**
 * Recomprime un audio (principalmente MP3) a un bitrate menor.
 * Si el archivo original ya pesa menos que el resultado, se conserva el original.
 */
export async function compressAudioFile(
  file: File,
  options: CompressAudioOptions = {}
): Promise<CompressedAudioResult> {
  const bitrateKbps = options.bitrateKbps ?? 64;
  const maxDurationSec = options.maxDurationSec ?? 600;
  const sampleRate = options.sampleRate ?? 44100;

  const AudioCtx = getAudioContextClass();
  const OfflineCtx = getOfflineAudioContextClass();
  if (!AudioCtx || !OfflineCtx) {
    throw new MediaCompressionError(
      'Tu navegador no permite comprimir audio. Se subirá el archivo original.',
      'unsupported'
    );
  }

  const arrayBuffer = await file.arrayBuffer();

  let decoded: AudioBuffer;
  const ctx = new AudioCtx();
  try {
    decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    await ctx.close().catch(() => {});
    throw new MediaCompressionError(
      'No pudimos leer este audio. Probá con MP3, WAV, OGG o M4A.',
      'decode'
    );
  }
  await ctx.close().catch(() => {});

  if (!decoded || !decoded.duration || decoded.duration < 0.2) {
    throw new MediaCompressionError('El audio está vacío o dañado.', 'decode');
  }
  if (decoded.duration > maxDurationSec) {
    throw new MediaCompressionError(
      `El audio dura ${Math.round(decoded.duration)}s y el máximo para esta calidad es ${Math.round(
        maxDurationSec
      )}s. Elegí una calidad menor o recortalo.`,
      'duration'
    );
  }

  let rendered: AudioBuffer;
  try {
    const frameCount = Math.max(1, Math.ceil(decoded.duration * sampleRate));
    const offline = new OfflineCtx(1, frameCount, sampleRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    rendered = await offline.startRendering();
  } catch {
    throw new MediaCompressionError('No pudimos procesar este audio.', 'decode');
  }

  const pcmFloat = rendered.getChannelData(0);
  const pcm = new Int16Array(pcmFloat.length);
  for (let i = 0; i < pcmFloat.length; i++) {
    pcm[i] = clamp16(pcmFloat[i]);
  }

  try {
    const lameModule: any = await import('@breezystack/lamejs');
    const Mp3Encoder =
      lameModule.Mp3Encoder || lameModule.default?.Mp3Encoder || lameModule.default;
    if (!Mp3Encoder) throw new Error('Encoder no disponible');

    const encoder = new Mp3Encoder(1, sampleRate, bitrateKbps);
    const chunks: Uint8Array[] = [];
    const blockSize = 1152;

    for (let i = 0; i < pcm.length; i += blockSize) {
      const chunk = encoder.encodeBuffer(pcm.subarray(i, Math.min(i + blockSize, pcm.length)));
      if (chunk && chunk.length > 0) chunks.push(new Uint8Array(chunk));
    }
    const tail = encoder.flush();
    if (tail && tail.length > 0) chunks.push(new Uint8Array(tail));

    const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
    const baseName = (file.name || 'audio').replace(/\.[^.]+$/, '').slice(0, 80) || 'audio';
    const compressedFile = new File([blob], `${baseName}.mp3`, {
      type: 'audio/mpeg',
      lastModified: Date.now(),
    });

    // Si el archivo original ya era más chico, no vale la pena recodificar.
    if (compressedFile.size >= file.size) {
      return {
        file,
        originalSize: file.size,
        compressedSize: file.size,
        duration: decoded.duration,
        bitrateKbps: 0,
        wasCompressed: false,
      };
    }

    return {
      file: compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      duration: decoded.duration,
      bitrateKbps,
      wasCompressed: true,
    };
  } catch (err: any) {
    if (err instanceof MediaCompressionError) throw err;
    throw new MediaCompressionError(
      'No pudimos comprimir el audio. Se subirá el archivo original.',
      'encoder'
    );
  }
}

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  /** Si la imagen ya pesa menos que esto, se deja tal cual */
  skipUnderBytes?: number;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = objectUrl;
  });
}

/**
 * Redimensiona y recomprime fotos a JPEG para ahorrar espacio.
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const quality = options.quality ?? 0.82;
  const skipUnderBytes = options.skipUnderBytes ?? 350 * 1024;

  if (file.size <= skipUnderBytes) return file;

  try {
    const img = await loadImageElement(file);
    const ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
    const targetWidth = Math.max(1, Math.round(img.width * ratio));
    const targetHeight = Math.max(1, Math.round(img.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob || blob.size >= file.size) return file;

    const baseName = (file.name || 'foto').replace(/\.[^.]+$/, '').slice(0, 80) || 'foto';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

/** Convierte un File a data URL (fallback local cuando Storage no está disponible). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
