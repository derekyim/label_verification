import { describe, it, expect } from 'vitest';
import { normalizeFuzzy, extractAbvPercent, extractNetContents } from '@/lib/comparator/normalize';
import {
  checkGovernmentWarning,
  CANONICAL_GOVERNMENT_WARNING,
} from '@/lib/comparator/warning';
import { compareLabelToApplication } from '@/lib/comparator/compare';
import type { LabelFields } from '@/lib/extractor/types';

const goodLabel: LabelFields = {
  brand: 'OLD TOM DISTILLERY',
  classType: 'Kentucky Straight Bourbon Whiskey',
  alcoholContent: '45% Alc./Vol. (90 Proof)',
  netContents: '750 mL',
  bottlerProducer: 'Old Tom Distilling Co.',
  countryOfOrigin: 'Bardstown, Kentucky',
  governmentWarning: CANONICAL_GOVERNMENT_WARNING,
};

describe('normalizeFuzzy', () => {
  it("treats STONE'S THROW and Stone's Throw as the same (Dave's case)", () => {
    expect(normalizeFuzzy("STONE'S THROW")).toBe(normalizeFuzzy("Stone's Throw"));
  });

  it('normalizes smart quotes to straight quotes', () => {
    expect(normalizeFuzzy('Stone’s Throw')).toBe(normalizeFuzzy("Stone's Throw"));
  });

  it('collapses repeated whitespace and non-breaking spaces', () => {
    expect(normalizeFuzzy('OLD  TOM DISTILLERY ')).toBe('old tom distillery');
  });

  it('strips accent marks so MAISON LUMIÈRE matches Maison Lumiere', () => {
    expect(normalizeFuzzy('MAISON LUMIÈRE')).toBe(normalizeFuzzy('Maison Lumiere'));
  });
});

describe('extractAbvPercent', () => {
  it('extracts the percentage from a labeled ABV string', () => {
    expect(extractAbvPercent('45% Alc./Vol. (90 Proof)')).toBe(45);
  });

  it('returns null when no percentage is present', () => {
    expect(extractAbvPercent('Alc. by volume')).toBeNull();
  });
});

describe('extractNetContents', () => {
  it('parses milliliters', () => {
    expect(extractNetContents('750 mL')?.milliliters).toBe(750);
  });

  it('converts liters to milliliters', () => {
    expect(extractNetContents('1 L')?.milliliters).toBe(1000);
  });

  it('handles 375 mL half-bottle', () => {
    expect(extractNetContents('375 mL')?.milliliters).toBe(375);
  });
});

describe('checkGovernmentWarning', () => {
  it('passes when text matches canonical exactly', () => {
    expect(checkGovernmentWarning(CANONICAL_GOVERNMENT_WARNING).status).toBe('pass');
  });

  it("flags title-cased 'Government Warning:' prefix as fail (Jenny's case)", () => {
    const titleCased = CANONICAL_GOVERNMENT_WARNING.replace(
      'GOVERNMENT WARNING:',
      'Government Warning:',
    );
    expect(checkGovernmentWarning(titleCased).status).toBe('fail_prefix_case');
  });

  it('flags missing warning as fail_missing_prefix', () => {
    expect(checkGovernmentWarning('').status).toBe('fail_missing_prefix');
  });

  it('flags reworded warning as fail_text', () => {
    const reworded = CANONICAL_GOVERNMENT_WARNING.replace(
      'birth defects',
      'birth complications',
    );
    expect(checkGovernmentWarning(reworded).status).toBe('fail_text');
  });
});

describe('compareLabelToApplication', () => {
  it('passes a well-formed label/application pair', () => {
    const result = compareLabelToApplication(goodLabel, goodLabel);
    expect(result.overallPass).toBe(true);
    expect(result.failureCount).toBe(0);
  });

  it('uses fuzzy status for case-different brand', () => {
    const result = compareLabelToApplication(goodLabel, {
      ...goodLabel,
      brand: 'Old Tom Distillery',
    });
    const brand = result.fields.find((f) => f.field === 'brand')!;
    expect(brand.status).toBe('fuzzy');
    expect(result.overallPass).toBe(true);
  });

  it('uses fuzzy status when net contents are equivalent (1 L vs 1000 mL)', () => {
    const result = compareLabelToApplication(
      { ...goodLabel, netContents: '1 L' },
      { ...goodLabel, netContents: '1000 mL' },
    );
    const net = result.fields.find((f) => f.field === 'netContents')!;
    expect(net.status).toBe('fuzzy');
  });

  it('fails when ABV percent differs', () => {
    const result = compareLabelToApplication(goodLabel, { ...goodLabel, alcoholContent: '40% Alc./Vol.' });
    const abv = result.fields.find((f) => f.field === 'alcoholContent')!;
    expect(abv.status).toBe('fail');
    expect(result.overallPass).toBe(false);
  });

  it('skips a field the application did not provide', () => {
    const result = compareLabelToApplication(goodLabel, {
      ...goodLabel,
      countryOfOrigin: '',
    });
    const country = result.fields.find((f) => f.field === 'countryOfOrigin')!;
    expect(country.status).toBe('skipped');
  });
});
