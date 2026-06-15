import { promises as fs } from 'node:fs';
import path from 'node:path';
import { headers } from 'next/headers';

/**
 * Load an image from the public/ directory. Tries the local filesystem first
 * (works in dev and self-hosted), then falls back to an HTTP fetch against the
 * app's own origin (works on Vercel where public/ is CDN-only).
 */
export async function loadPublicImage(
  publicPath: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const rel = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  if (rel.includes('..')) throw new Error('Invalid image path.');

  const mimeType = rel.endsWith('.png')
    ? 'image/png'
    : rel.endsWith('.jpg') || rel.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'application/octet-stream';

  const abs = path.join(process.cwd(), 'public', rel);
  try {
    const bytes = await fs.readFile(abs);
    return { bytes: new Uint8Array(bytes), mimeType };
  } catch {
    // Filesystem read failed (e.g. Vercel serverless) -- fetch via HTTP
  }

  const hdrs = await headers();
  const host = hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;
  const url = `${origin}/${rel}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image not found: ${publicPath} (HTTP ${res.status})`);
  const buf = await res.arrayBuffer();
  return { bytes: new Uint8Array(buf), mimeType };
}
