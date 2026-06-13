/**
 * Government warning check. This field is the highest-stakes one — Jenny
 * specifically called out that importers try to soften it by changing case
 * (Title case instead of all caps) or by burying it in tiny text. So this
 * check is byte-exact for the text and case-strict for the prefix.
 */

export const CANONICAL_GOVERNMENT_WARNING =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.';

export const REQUIRED_PREFIX = 'GOVERNMENT WARNING:';

export type WarningStatus = 'pass' | 'fail_prefix_case' | 'fail_missing_prefix' | 'fail_text';

export interface WarningCheck {
  status: WarningStatus;
  reason: string;
  expected: string;
  actual: string;
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export function checkGovernmentWarning(actualRaw: string): WarningCheck {
  const actual = collapseWhitespace(actualRaw);
  const expected = CANONICAL_GOVERNMENT_WARNING;

  if (!actual) {
    return {
      status: 'fail_missing_prefix',
      reason: 'Government warning is missing from the label.',
      expected,
      actual: actualRaw,
    };
  }

  const lowerPrefixMatch = actual.toLowerCase().startsWith(REQUIRED_PREFIX.toLowerCase());
  if (!lowerPrefixMatch) {
    return {
      status: 'fail_missing_prefix',
      reason: 'The label does not begin with "GOVERNMENT WARNING:".',
      expected,
      actual: actualRaw,
    };
  }

  const exactPrefixMatch = actual.startsWith(REQUIRED_PREFIX);
  if (!exactPrefixMatch) {
    return {
      status: 'fail_prefix_case',
      reason: 'The "GOVERNMENT WARNING:" prefix must be in all caps.',
      expected,
      actual: actualRaw,
    };
  }

  if (actual !== expected) {
    return {
      status: 'fail_text',
      reason: 'Warning text does not match the canonical TTB wording exactly.',
      expected,
      actual: actualRaw,
    };
  }

  return {
    status: 'pass',
    reason: 'Warning matches the canonical TTB wording.',
    expected,
    actual: actualRaw,
  };
}
