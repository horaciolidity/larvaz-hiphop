import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ensureMediaBucket, MEDIA_BUCKET, readPlatformSettings } from '@/lib/settings-store';
import { MAX_SERVER_UPLOAD_MB } from '@/lib/platform-settings';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

    const settings = await readPlatformSettings();
    if (!settings.features.uploadsEnabled) {
      return NextResponse.json(
        { error: 'Las subidas están pausadas temporalmente por la administración.' },
        { status: 403 }
      );
    }

    const maxMb = Math.min(settings.media.maxUploadMb, MAX_SERVER_UPLOAD_MB);
    const maxBytes = maxMb * 1024 * 1024;

    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: `El archivo pesa ${(file.size / (1024 * 1024)).toFixed(
            1
          )} MB. El máximo por archivo es ${maxMb.toFixed(1)} MB.`,
        },
        { status: 413 }
      );
    }

    await ensureMediaBucket();

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
      .from(MEDIA_BUCKET)
      .upload(path, Buffer.from(arrayBuffer), {
        contentType,
        upsert: false,
        cacheControl: '31536000',
      });

    if (error) {
      console.error('[API /media/upload] Error subiendo a Storage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
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
