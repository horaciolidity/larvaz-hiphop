import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BUCKET = 'post-media';
// Vercel limita el body del request a 4.5 MB: dejamos margen para el multipart.
const MAX_FILE_BYTES = 4.2 * 1024 * 1024;
const ALLOWED_KINDS = new Set(['image', 'audio', 'video']);

function safeName(name: string): string {
  const clean = (name || 'archivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean.slice(0, 90) || 'archivo';
}

async function ensureBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === BUCKET);
    if (!exists) {
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_BYTES,
        allowedMimeTypes: [
          'image/*',
          'audio/*',
          'video/*',
          'application/octet-stream',
        ],
      });
      if (error) {
        console.warn('[API /media/upload] No se pudo crear el bucket:', error.message);
      }
    }
  } catch (err) {
    console.warn('[API /media/upload] Error verificando bucket:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const kindRaw = String(formData.get('kind') || 'image');
    const kind = ALLOWED_KINDS.has(kindRaw) ? kindRaw : 'image';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }
    if (file.size <= 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `El archivo pesa ${(file.size / (1024 * 1024)).toFixed(
            1
          )} MB. El máximo por archivo es ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(1)} MB.`,
        },
        { status: 413 }
      );
    }

    await ensureBucket();

    const now = new Date();
    const folder = `${kind}/${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const path = `${folder}/${unique}-${safeName(file.name)}`;

    const arrayBuffer = await file.arrayBuffer();
    const contentType =
      file.type ||
      (kind === 'image'
        ? 'image/jpeg'
        : kind === 'audio'
          ? 'audio/mpeg'
          : 'video/mp4');

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(arrayBuffer), {
        contentType,
        upsert: false,
        cacheControl: '31536000',
      });

    if (error) {
      console.error('[API /media/upload] Error subiendo a Storage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    if (!publicData?.publicUrl) {
      return NextResponse.json(
        { error: 'No se pudo obtener la URL pública del archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      path,
      kind,
      size: file.size,
      contentType,
    });
  } catch (err: any) {
    console.error('[API /media/upload] Unexpected error:', err);
    return NextResponse.json(
      { error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
