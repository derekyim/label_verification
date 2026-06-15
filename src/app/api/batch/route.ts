import { NextRequest, NextResponse } from 'next/server';
import { getExtractor, GeminiError } from '@/lib/extractor';
import { compareLabelToApplication, type ComparisonResult } from '@/lib/comparator/compare';
import type { LabelFields, LabelImage } from '@/lib/extractor/types';
import { loadPublicImage } from '@/lib/images/loadPublicImage';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_ROWS = 25;
const CONCURRENCY = 5;

interface BatchRequestRow {
  imageFilename: string;
  expected: Partial<LabelFields>;
  /** base64-encoded bytes when the image was uploaded by the client */
  imageBase64?: string;
  imageMime?: string;
  /** optional back-of-bottle image (where the government warning usually lives) */
  backImageFilename?: string;
  backImageBase64?: string;
  backImageMime?: string;
}

interface BatchRequest {
  rows: BatchRequestRow[];
}

interface BatchRowResult {
  imageFilename: string;
  ok: boolean;
  error?: string;
  fields?: LabelFields;
  comparison?: ComparisonResult;
  latencyMs?: number;
}

interface BatchResponse {
  results: BatchRowResult[];
  summary: { total: number; passed: number; failed: number; errored: number };
}

async function loadOne(
  filename: string,
  base64: string | undefined,
  mime: string | undefined,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  if (base64) {
    return {
      bytes: new Uint8Array(Buffer.from(base64, 'base64')),
      mimeType: mime ?? 'image/png',
    };
  }
  const rel = filename.startsWith('/') ? filename.slice(1) : filename;
  if (rel.includes('..')) throw new Error('Invalid image path.');
  const candidates = rel.startsWith('labels/')
    ? [rel]
    : [`labels/synthetic/${rel}`, `labels/actual/${rel}`];
  for (const candidate of candidates) {
    try {
      return await loadPublicImage(candidate);
    } catch {
      continue;
    }
  }
  throw new Error(`Image not found: ${filename}`);
}

async function loadImages(row: BatchRequestRow): Promise<LabelImage[]> {
  const front = await loadOne(row.imageFilename, row.imageBase64, row.imageMime);
  const images: LabelImage[] = [{ ...front, kind: 'front' }];
  if (row.backImageFilename || row.backImageBase64) {
    const back = await loadOne(
      row.backImageFilename ?? row.imageFilename,
      row.backImageBase64,
      row.backImageMime,
    );
    images.push({ ...back, kind: 'back' });
  }
  return images;
}

async function runOne(row: BatchRequestRow): Promise<BatchRowResult> {
  try {
    const images = await loadImages(row);
    const extractor = getExtractor();
    const extraction = await extractor.extract(images);
    const comparison = compareLabelToApplication(extraction.fields, row.expected);
    return {
      imageFilename: row.imageFilename,
      ok: true,
      fields: extraction.fields,
      comparison,
      latencyMs: extraction.latencyMs,
    };
  } catch (e) {
    return {
      imageFilename: row.imageFilename,
      ok: false,
      error: e instanceof GeminiError ? e.message : e instanceof Error ? e.message : String(e),
    };
  }
}

async function runWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest): Promise<NextResponse<BatchResponse | { error: string }>> {
  try {
    const body = (await req.json()) as BatchRequest;
    if (!body?.rows || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: 'Body must include a "rows" array.' }, { status: 400 });
    }
    if (body.rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided.' }, { status: 400 });
    }
    if (body.rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Batch size limit is ${MAX_ROWS}. Got ${body.rows.length}.` },
        { status: 400 },
      );
    }
    const results = await runWithConcurrency(body.rows, CONCURRENCY, runOne);
    const summary = {
      total: results.length,
      passed: results.filter((r) => r.ok && r.comparison?.overallPass).length,
      failed: results.filter((r) => r.ok && r.comparison && !r.comparison.overallPass).length,
      errored: results.filter((r) => !r.ok).length,
    };
    return NextResponse.json({ results, summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
