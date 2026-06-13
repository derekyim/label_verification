import { GeminiExtractor, GeminiError } from './gemini';
import { MockExtractor } from './mock';
import type { Extractor } from './types';

export { GeminiError };

export type ExtractorName = 'gemini' | 'mock';

export function getExtractor(): Extractor {
  const name = (process.env.EXTRACTOR ?? 'gemini').toLowerCase() as ExtractorName;
  switch (name) {
    case 'mock':
      return new MockExtractor();
    case 'gemini':
    default: {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error(
          'GEMINI_API_KEY is not set. Set it in .env.local or set EXTRACTOR=mock for offline development.',
        );
      }
      return new GeminiExtractor(key);
    }
  }
}

export type { Extractor, ExtractionResult, LabelFields } from './types';
