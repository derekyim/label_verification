import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Extractor, ExtractionResult, LabelFields, LabelImage } from './types';

const DEFAULT_MODEL = 'gemini-2.0-flash';

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    brand: { type: SchemaType.STRING, description: 'Brand name exactly as printed' },
    classType: { type: SchemaType.STRING, description: 'Class/type designation (e.g. Kentucky Straight Bourbon Whiskey)' },
    alcoholContent: { type: SchemaType.STRING, description: 'Alcohol content exactly as printed (e.g. 45% Alc./Vol. (90 Proof))' },
    netContents: { type: SchemaType.STRING, description: 'Net contents (e.g. 750 mL)' },
    bottlerProducer: { type: SchemaType.STRING, description: 'Name of the bottler/producer/distiller' },
    countryOfOrigin: { type: SchemaType.STRING, description: 'Country or region of origin, empty if not present' },
    governmentWarning: { type: SchemaType.STRING, description: 'Full government warning text as printed, including the GOVERNMENT WARNING: prefix in whatever case it appears' },
  },
  required: [
    'brand',
    'classType',
    'alcoholContent',
    'netContents',
    'bottlerProducer',
    'countryOfOrigin',
    'governmentWarning',
  ],
};

const PROMPT_SINGLE = `You are extracting fields from a U.S. TTB alcohol-beverage label.

Return ONLY the JSON object matching the provided schema. For every field, return the text VERBATIM as it appears on the label — do not normalize case, do not paraphrase, do not expand abbreviations. If a field is not visible, return an empty string for that field.

For governmentWarning, return the complete warning text including the leading prefix in whatever case it appears (e.g. "GOVERNMENT WARNING:" or "Government Warning:"). Preserve capitalization exactly.`;

const PROMPT_MULTI = `You are extracting fields from a U.S. TTB alcohol-beverage label. You are given multiple images of the same bottle (front, back, sometimes a side). The brand, class, ABV, and net contents are typically on the front; the government warning and producer info are often on the back.

Combine information across the images. Return ONLY the JSON object matching the provided schema. For every field, return the text VERBATIM as it appears on whichever image shows it — do not normalize case, do not paraphrase, do not expand abbreviations. If a field is not visible on any image, return an empty string for that field.

For governmentWarning, return the complete warning text including the leading prefix in whatever case it appears (e.g. "GOVERNMENT WARNING:" or "Government Warning:"). Preserve capitalization exactly.`;

export class GeminiExtractor implements Extractor {
  private apiKey: string;
  private modelName: string;

  constructor(apiKey: string, modelName?: string) {
    if (!apiKey) throw new Error('GeminiExtractor: missing API key');
    this.apiKey = apiKey;
    this.modelName = modelName ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  }

  async extract(images: LabelImage[]): Promise<ExtractionResult> {
    if (images.length === 0) throw new Error('GeminiExtractor: no images provided');
    const client = new GoogleGenerativeAI(this.apiKey);
    const model = client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema as never,
        temperature: 0,
      },
    });

    const prompt = images.length > 1 ? PROMPT_MULTI : PROMPT_SINGLE;
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: prompt },
    ];
    for (const img of images) {
      if (img.kind) parts.push({ text: `Image: ${img.kind} of bottle` });
      parts.push({
        inlineData: {
          data: Buffer.from(img.bytes).toString('base64'),
          mimeType: img.mimeType,
        },
      });
    }

    const started = Date.now();
    let result;
    try {
      result = await model.generateContent(parts);
    } catch (e) {
      throw normalizeGeminiError(e, this.modelName);
    }
    const latencyMs = Date.now() - started;
    const text = result.response.text();
    const parsed = JSON.parse(text) as LabelFields;
    return { fields: parsed, latencyMs, model: this.modelName };
  }
}

/**
 * The @google/generative-ai SDK throws strings like
 *   "[GoogleGenerativeAI Error]: Error fetching from ... [429 Too Many Requests] ..."
 * Translate the most common cases into something the UI can act on. We attach
 * a `status` so the API route can return a matching HTTP code.
 */
export class GeminiError extends Error {
  status: number;
  code: 'RATE_LIMITED' | 'NO_QUOTA' | 'AUTH' | 'OTHER';
  constructor(message: string, status: number, code: GeminiError['code']) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function normalizeGeminiError(e: unknown, modelName: string): GeminiError {
  const raw = e instanceof Error ? e.message : String(e);
  if (raw.includes('429')) {
    if (/limit:\s*0/i.test(raw) || /free_tier/i.test(raw)) {
      return new GeminiError(
        `No Gemini free-tier quota is allocated to this API key's project (model: ${modelName}). ` +
          `Create a new API key on a fresh AI Studio project (https://aistudio.google.com/app/apikey), ` +
          `enable billing on the existing project, or set EXTRACTOR=mock for offline development.`,
        429,
        'NO_QUOTA',
      );
    }
    return new GeminiError(
      `Gemini rate limit hit (model: ${modelName}). Wait a minute and retry, or switch models via GEMINI_MODEL.`,
      429,
      'RATE_LIMITED',
    );
  }
  if (raw.includes('401') || raw.includes('403') || /api key/i.test(raw)) {
    return new GeminiError(
      `Gemini auth failed. Check GEMINI_API_KEY in .env.local. Original: ${raw}`,
      401,
      'AUTH',
    );
  }
  return new GeminiError(`Gemini call failed: ${raw}`, 502, 'OTHER');
}
