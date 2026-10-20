import { NextRequest, NextResponse } from 'next/server';
import { fetchExternalMetadata } from '@/lib/metadata-fetcher';
import { validateExternalUrl } from '@/lib/ssrf-validator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Parámetro URL requerido y debe ser una cadena válida.' },
        { status: 400 }
      );
    }

    const validation = validateExternalUrl(url);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'URL no permitida por políticas de seguridad.' },
        { status: 422 }
      );
    }

    const result = await fetchExternalMetadata(url);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching external metadata:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'No se pudo procesar la URL externa.',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
