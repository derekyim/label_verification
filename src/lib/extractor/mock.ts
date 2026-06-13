import type { Extractor, ExtractionResult } from './types';
import { CANONICAL_GOVERNMENT_WARNING } from '@/lib/comparator/warning';

const FIXTURE = {
  brand: 'OLD TOM DISTILLERY',
  classType: 'Kentucky Straight Bourbon Whiskey',
  alcoholContent: '45% Alc./Vol. (90 Proof)',
  netContents: '750 mL',
  bottlerProducer: 'Old Tom Distilling Co.',
  countryOfOrigin: 'Bardstown, Kentucky',
  governmentWarning: CANONICAL_GOVERNMENT_WARNING,
};

export class MockExtractor implements Extractor {
  async extract(_images: unknown[]): Promise<ExtractionResult> {
    void _images;
    await new Promise((r) => setTimeout(r, 250));
    return { fields: { ...FIXTURE }, latencyMs: 250, model: 'mock' };
  }
}
