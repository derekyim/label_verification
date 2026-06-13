import Papa from 'papaparse';
import type { LabelFields } from '@/lib/extractor/types';

export interface BatchRow {
  imageFilename: string;
  backImageFilename?: string;
  expected: Partial<LabelFields>;
}

export interface ParseResult {
  rows: BatchRow[];
  errors: string[];
}

const FIELD_KEYS: (keyof LabelFields)[] = [
  'brand',
  'classType',
  'alcoholContent',
  'netContents',
  'bottlerProducer',
  'countryOfOrigin',
  'governmentWarning',
];

const CSV_ALIASES: Record<string, keyof LabelFields | 'imageFilename' | 'backImageFilename'> = {
  image_filename: 'imageFilename',
  image: 'imageFilename',
  file: 'imageFilename',
  filename: 'imageFilename',
  front_image: 'imageFilename',
  front: 'imageFilename',
  back_image_filename: 'backImageFilename',
  back_image: 'backImageFilename',
  back: 'backImageFilename',
  brand: 'brand',
  brand_name: 'brand',
  class_type: 'classType',
  classtype: 'classType',
  class: 'classType',
  alcohol_content: 'alcoholContent',
  abv: 'alcoholContent',
  net_contents: 'netContents',
  net: 'netContents',
  bottler_producer: 'bottlerProducer',
  bottler: 'bottlerProducer',
  producer: 'bottlerProducer',
  country_of_origin: 'countryOfOrigin',
  origin: 'countryOfOrigin',
  country: 'countryOfOrigin',
  government_warning: 'governmentWarning',
  warning: 'governmentWarning',
};

function normalizeKey(k: string): string {
  return k.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function parseManifest(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { rows: [], errors: ['Input is empty.'] };

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return parseJson(trimmed);
  }
  return parseCsv(trimmed);
}

function parseJson(input: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    return { rows: [], errors: [`Invalid JSON: ${(e as Error).message}`] };
  }

  const arr = Array.isArray(data) ? data : [data];
  const rows: BatchRow[] = [];
  const errors: string[] = [];

  arr.forEach((entry, idx) => {
    if (typeof entry !== 'object' || entry === null) {
      errors.push(`Row ${idx + 1}: not an object.`);
      return;
    }
    const obj = entry as Record<string, unknown>;
    const imageFilename = pickString(obj, [
      'image_filename', 'imageFilename', 'image', 'file', 'filename', 'front', 'front_image',
    ]);
    if (!imageFilename) {
      errors.push(`Row ${idx + 1}: missing image_filename.`);
      return;
    }
    const backImageFilename = pickString(obj, [
      'back_image_filename', 'backImageFilename', 'back', 'back_image',
    ]);
    const expected: Partial<LabelFields> = {};
    for (const key of FIELD_KEYS) {
      const v = obj[key] ?? obj[snake(key)];
      if (typeof v === 'string') expected[key] = v;
    }
    rows.push({ imageFilename, backImageFilename, expected });
  });

  return { rows, errors };
}

function parseCsv(input: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(input, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => normalizeKey(h),
  });
  const errors: string[] = parsed.errors.map((e) => `CSV: ${e.message}`);
  const rows: BatchRow[] = [];
  parsed.data.forEach((raw, idx) => {
    const mapped: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      const target = CSV_ALIASES[k];
      if (target) mapped[target] = typeof v === 'string' ? v : '';
    }
    const imageFilename = mapped.imageFilename;
    if (!imageFilename) {
      errors.push(`Row ${idx + 1}: missing image_filename column.`);
      return;
    }
    const backImageFilename = mapped.backImageFilename || undefined;
    const expected: Partial<LabelFields> = {};
    for (const key of FIELD_KEYS) {
      if (mapped[key] != null) expected[key] = mapped[key];
    }
    rows.push({ imageFilename, backImageFilename, expected });
  });
  return { rows, errors };
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

function snake(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
}
