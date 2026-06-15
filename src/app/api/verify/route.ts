import { NextRequest, NextResponse } from 'next/server';
import { getExtractor, GeminiError } from '@/lib/extractor';
import { compareLabelToApplication } from '@/lib/comparator/compare';
import type { LabelFields, LabelImage } from '@/lib/extractor/types';
import { loadPublicImage } from '@/lib/images/loadPublicImage';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface VerifyResponse {
  fields: LabelFields;
  comparison: ReturnType<typeof compareLabelToApplication>;
  latencyMs: number;
  totalMs: number;
  model: string;
}

type LoadedRequest = {
  images: LabelImage[];
  expected: Partial<LabelFields>;
};

async function readImages(req: NextRequest): Promise<LoadedRequest | NextResponse<{ error: string }>> {
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const expectedRaw = form.get('expected');
    const expected: Partial<LabelFields> = expectedRaw
      ? JSON.parse(typeof expectedRaw === 'string' ? expectedRaw : await (expectedRaw as Blob).text())
      : {};

    const images: LabelImage[] = [];
    for (const [name, kind] of [
      ['image', 'front'] as const,
      ['imageBack', 'back'] as const,
    ]) {
      const f = form.get(name);
      if (f && f instanceof Blob) {
        const buf = new Uint8Array(await f.arrayBuffer());
        images.push({
          bytes: buf,
          mimeType: (f as File).type || 'image/png',
          kind,
        });
      }
    }
    if (images.length > 0) return { images, expected };

    const samplePath = form.get('samplePath');
    const sampleBackPath = form.get('sampleBackPath');
    if (typeof samplePath === 'string') {
      return loadSample(
        samplePath,
        typeof sampleBackPath === 'string' && sampleBackPath ? sampleBackPath : undefined,
        expected,
      );
    }
    return NextResponse.json(
      { error: 'Provide an image file or a samplePath.' },
      { status: 400 },
    );
  }
  // JSON body with samplePath (and optional sampleBackPath)
  const body = await req.json();
  if (body?.samplePath) {
    return loadSample(body.samplePath, body.sampleBackPath, body.expected ?? {});
  }
  return NextResponse.json(
    { error: 'Provide multipart form with image or JSON with samplePath.' },
    { status: 400 },
  );
}

async function loadSample(
  samplePath: string,
  sampleBackPath: string | undefined,
  expected: Partial<LabelFields>,
): Promise<LoadedRequest | NextResponse<{ error: string }>> {
  try {
    const front = await readPublicImage(samplePath, 'front');
    const images: LabelImage[] = [front];
    if (sampleBackPath) {
      const back = await readPublicImage(sampleBackPath, 'back');
      images.push(back);
    }
    return { images, expected };
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

async function readPublicImage(samplePath: string, kind: 'front' | 'back'): Promise<LabelImage> {
  if (!samplePath.startsWith('/labels/')) throw new Error('samplePath must be under /labels/');
  const { bytes, mimeType } = await loadPublicImage(samplePath);
  return { bytes, mimeType, kind };
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<VerifyResponse | { error: string }>> {
  const totalStart = Date.now();
  try {
    const loaded = await readImages(req);
    if (loaded instanceof NextResponse) return loaded;
    const extractor = getExtractor();
    const extraction = await extractor.extract(loaded.images);
    const comparison = compareLabelToApplication(extraction.fields, loaded.expected);
    const totalMs = Date.now() - totalStart;
    return NextResponse.json({
      fields: extraction.fields,
      comparison,
      latencyMs: extraction.latencyMs,
      totalMs,
      model: extraction.model,
    });
  } catch (e) {
    if (e instanceof GeminiError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
