import type { LabelFields } from '@/lib/extractor/types';
import { normalizeFuzzy, extractAbvPercent, extractNetContents } from './normalize';
import { checkGovernmentWarning } from './warning';

export type FieldStatus = 'pass' | 'fuzzy' | 'fail' | 'skipped';

export interface FieldComparison {
  field: keyof LabelFields;
  label: string; // value found on the label
  application: string; // value from the application form
  status: FieldStatus;
  reason: string;
}

export interface ComparisonResult {
  fields: FieldComparison[];
  /** True if every field is pass or fuzzy. */
  overallPass: boolean;
  /** Number of fields that failed (status === 'fail'). */
  failureCount: number;
}

const HUMAN_FIELD_NAMES: Record<keyof LabelFields, string> = {
  brand: 'Brand Name',
  classType: 'Class / Type',
  alcoholContent: 'Alcohol Content',
  netContents: 'Net Contents',
  bottlerProducer: 'Bottler / Producer',
  countryOfOrigin: 'Country of Origin',
  governmentWarning: 'Government Warning',
};

export function humanFieldName(field: keyof LabelFields): string {
  return HUMAN_FIELD_NAMES[field];
}

function compareFuzzy(field: keyof LabelFields, label: string, application: string): FieldComparison {
  if (!application.trim()) {
    return {
      field,
      label,
      application,
      status: 'skipped',
      reason: 'No expected value provided for this field.',
    };
  }
  if (!label.trim()) {
    return {
      field,
      label,
      application,
      status: 'fail',
      reason: 'Field was not found on the label.',
    };
  }
  const a = normalizeFuzzy(label);
  const b = normalizeFuzzy(application);
  if (label === application) {
    return { field, label, application, status: 'pass', reason: 'Exact match.' };
  }
  if (a === b) {
    return {
      field,
      label,
      application,
      status: 'fuzzy',
      reason: 'Match after case / whitespace / punctuation normalization.',
    };
  }
  return {
    field,
    label,
    application,
    status: 'fail',
    reason: 'Label and application values do not match.',
  };
}

function compareAbv(label: string, application: string): FieldComparison {
  const field: keyof LabelFields = 'alcoholContent';
  if (!application.trim()) {
    return { field, label, application, status: 'skipped', reason: 'No expected ABV provided.' };
  }
  if (!label.trim()) {
    return { field, label, application, status: 'fail', reason: 'ABV not found on the label.' };
  }
  const aPct = extractAbvPercent(label);
  const bPct = extractAbvPercent(application);
  if (aPct !== null && bPct !== null && aPct === bPct) {
    if (label === application) {
      return { field, label, application, status: 'pass', reason: 'Exact match.' };
    }
    return {
      field,
      label,
      application,
      status: 'fuzzy',
      reason: `Both resolve to ${aPct}% ABV.`,
    };
  }
  return compareFuzzy('alcoholContent', label, application);
}

function compareNet(label: string, application: string): FieldComparison {
  const field: keyof LabelFields = 'netContents';
  if (!application.trim()) {
    return { field, label, application, status: 'skipped', reason: 'No expected net contents provided.' };
  }
  if (!label.trim()) {
    return { field, label, application, status: 'fail', reason: 'Net contents not found on the label.' };
  }
  const a = extractNetContents(label);
  const b = extractNetContents(application);
  if (a && b && a.milliliters === b.milliliters) {
    if (label === application) {
      return { field, label, application, status: 'pass', reason: 'Exact match.' };
    }
    return {
      field,
      label,
      application,
      status: 'fuzzy',
      reason: `Both resolve to ${a.milliliters} mL.`,
    };
  }
  return compareFuzzy('netContents', label, application);
}

function compareWarning(label: string, application: string): FieldComparison {
  const field: keyof LabelFields = 'governmentWarning';
  const check = checkGovernmentWarning(label);
  if (check.status === 'pass') {
    return { field, label, application, status: 'pass', reason: check.reason };
  }
  const status: FieldStatus = check.status === 'fail_prefix_case' ? 'fail' : 'fail';
  return { field, label, application, status, reason: check.reason };
}

export function compareLabelToApplication(
  label: LabelFields,
  application: Partial<LabelFields>,
): ComparisonResult {
  const fields: FieldComparison[] = [
    compareFuzzy('brand', label.brand, application.brand ?? ''),
    compareFuzzy('classType', label.classType, application.classType ?? ''),
    compareAbv(label.alcoholContent, application.alcoholContent ?? ''),
    compareNet(label.netContents, application.netContents ?? ''),
    compareFuzzy('bottlerProducer', label.bottlerProducer, application.bottlerProducer ?? ''),
    compareFuzzy('countryOfOrigin', label.countryOfOrigin, application.countryOfOrigin ?? ''),
    compareWarning(label.governmentWarning, application.governmentWarning ?? ''),
  ];
  const failureCount = fields.filter((f) => f.status === 'fail').length;
  const overallPass = failureCount === 0;
  return { fields, overallPass, failureCount };
}
