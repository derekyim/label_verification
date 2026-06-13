/**
 * Normalize for fuzzy equality. Removes the kinds of differences that humans
 * would call "obviously the same thing":
 *   - case differences
 *   - smart quotes vs straight quotes
 *   - en/em dashes vs hyphens
 *   - non-breaking spaces and repeated whitespace
 *   - accent marks
 *   - leading/trailing punctuation noise
 *
 * The goal is to make "STONE'S THROW" === "Stone's Throw" return true
 * (Dave's case), without collapsing things that meaningfully differ.
 */
export function normalizeFuzzy(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Extract the ABV percentage from a string. Returns null if no
 * percentage is found. Used so that "45% Alc./Vol. (90 Proof)" matches
 * "45% ABV" or "45.0%" — all three resolve to 45.
 */
export function extractAbvPercent(input: string): number | null {
  const m = input.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * Extract net contents as a normalized {value, unit} pair. Treats "ml",
 * "mL", "ML" as the same unit; "1 L" and "1000 mL" both resolve to
 * 1000 mL so the comparator can match equivalent declarations.
 */
export function extractNetContents(input: string): { milliliters: number; raw: string } | null {
  const s = input.toLowerCase().replace(/,/g, '.');
  const m = s.match(/(\d+(?:\.\d+)?)\s*(ml|l|cl|fl\s*oz)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const unit = m[2].replace(/\s+/g, '');
  let ml: number;
  switch (unit) {
    case 'ml': ml = n; break;
    case 'l': ml = n * 1000; break;
    case 'cl': ml = n * 10; break;
    case 'floz': ml = n * 29.5735; break;
    default: return null;
  }
  return { milliliters: Math.round(ml * 10) / 10, raw: input };
}
