import { CANONICAL_GOVERNMENT_WARNING } from '@/lib/comparator/warning';
import type { LabelFields } from '@/lib/extractor/types';

/**
 * Ground-truth expected values for the 10 bundled synthetic labels.
 * Sourced from labels/synthetic/labels_manifest.json plus the
 * producer/origin metadata in generate_labels.py.
 */
export interface SampleLabel {
  id: string;
  title: string;
  imagePath: string; // served from /public — front of bottle
  backImagePath?: string; // optional back image; usually carries the government warning
  expected: LabelFields;
  /**
   * Real-photo labels have inherent extraction noise (angle, glare, partial
   * occlusion of the warning text). When true, the UI shows a small caveat
   * so an evaluator isn't surprised by a "review needed" verdict.
   */
  realPhoto?: boolean;
}

export const SAMPLE_LABELS: SampleLabel[] = [
  {
    id: '01_old_tom_bourbon',
    title: 'Old Tom Distillery — Kentucky Straight Bourbon',
    imagePath: '/labels/synthetic/01_old_tom_bourbon.png',
    expected: {
      brand: 'OLD TOM DISTILLERY',
      classType: 'Kentucky Straight Bourbon Whiskey',
      alcoholContent: '45% Alc./Vol. (90 Proof)',
      netContents: '750 mL',
      bottlerProducer: 'Old Tom Distilling Co.',
      countryOfOrigin: 'Bardstown, Kentucky',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: '02_northwind_gin',
    title: 'Northwind — London Dry Gin',
    imagePath: '/labels/synthetic/02_northwind_gin.png',
    expected: {
      brand: 'NORTHWIND',
      classType: 'London Dry Gin',
      alcoholContent: '47% Alc./Vol. (94 Proof)',
      netContents: '700 mL',
      bottlerProducer: 'The Northwind Gin Works',
      countryOfOrigin: 'Portland, Oregon',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: '03_crystal_meridian_vodka',
    title: 'Crystal Meridian — Premium Vodka',
    imagePath: '/labels/synthetic/03_crystal_meridian_vodka.png',
    expected: {
      brand: 'CRYSTAL MERIDIAN',
      classType: 'Premium Vodka',
      alcoholContent: '40% Alc./Vol. (80 Proof)',
      netContents: '1 L',
      bottlerProducer: '',
      countryOfOrigin: 'Distilled in the U.S.A.',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: '04_isla_vieja_tequila',
    title: 'Isla Vieja — Tequila Añejo',
    imagePath: '/labels/synthetic/04_isla_vieja_tequila.png',
    expected: {
      brand: 'ISLA VIEJA',
      classType: 'Tequila Añejo',
      alcoholContent: '38% Alc./Vol. (76 Proof)',
      netContents: '750 mL',
      bottlerProducer: '',
      countryOfOrigin: 'Jalisco, México',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: '05_barrel_oak_rye',
    title: 'Barrel & Oak — Straight Rye Whiskey',
    imagePath: '/labels/synthetic/05_barrel_oak_rye.png',
    expected: {
      brand: 'BARREL & OAK',
      classType: 'Straight Rye Whiskey',
      alcoholContent: '50% Alc./Vol. (100 Proof)',
      netContents: '750 mL',
      bottlerProducer: 'Barrel & Oak Co.',
      countryOfOrigin: 'Hudson Valley, New York',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: '06_glen_carrick_scotch',
    title: 'Glen Carrick — Single Malt Scotch Whisky',
    imagePath: '/labels/synthetic/06_glen_carrick_scotch.png',
    expected: {
      brand: 'GLEN CARRICK',
      classType: 'Single Malt Scotch Whisky',
      alcoholContent: '43% Alc./Vol. (86 Proof)',
      netContents: '700 mL',
      bottlerProducer: '',
      countryOfOrigin: 'Speyside, Scotland',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: '07_cane_compass_rum',
    title: 'Cane & Compass — Aged Caribbean Rum',
    imagePath: '/labels/synthetic/07_cane_compass_rum.png',
    expected: {
      brand: 'CANE & COMPASS',
      classType: 'Aged Caribbean Rum',
      alcoholContent: '40% Alc./Vol. (80 Proof)',
      netContents: '750 mL',
      bottlerProducer: '',
      countryOfOrigin: 'Bridgetown, Barbados',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: '08_maison_lumiere_cognac',
    title: 'Maison Lumière — Cognac V.S.O.P.',
    imagePath: '/labels/synthetic/08_maison_lumiere_cognac.png',
    expected: {
      brand: 'MAISON LUMIÈRE',
      classType: 'Cognac V.S.O.P.',
      alcoholContent: '40% Alc./Vol. (80 Proof)',
      netContents: '700 mL',
      bottlerProducer: '',
      countryOfOrigin: 'Cognac, France',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: '09_hollow_creek_brandy',
    title: 'Hollow Creek — Small Batch Apple Brandy',
    imagePath: '/labels/synthetic/09_hollow_creek_brandy.png',
    expected: {
      brand: 'HOLLOW CREEK',
      classType: 'Small Batch Apple Brandy',
      alcoholContent: '42% Alc./Vol. (84 Proof)',
      netContents: '375 mL',
      bottlerProducer: 'Hollow Creek Orchards',
      countryOfOrigin: 'Sonoma County, California',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: 'real_leyenda_del_milagro',
    title: 'Real photo — Leyenda del Milagro Silver Tequila (front + back)',
    imagePath: '/labels/actual/IMG_1373.jpeg',
    backImagePath: '/labels/actual/IMG_1370.jpeg',
    realPhoto: true,
    expected: {
      brand: 'Leyenda del Milagro',
      classType: 'Silver Tequila',
      alcoholContent: '40% Alc./Vol. (80 Proof)',
      netContents: '750 mL',
      bottlerProducer: '',
      countryOfOrigin: '',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: 'real_campari',
    title: 'Real photo — Campari Bitter Liqueur (front + back)',
    imagePath: '/labels/actual/IMG_1374.jpeg',
    backImagePath: '/labels/actual/IMG_1375.jpeg',
    realPhoto: true,
    expected: {
      brand: 'Campari',
      classType: 'Bitter Liqueur',
      alcoholContent: '24% Alc./Vol. (48 Proof)',
      netContents: '750 mL',
      bottlerProducer: '',
      countryOfOrigin: '',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: 'real_goslings',
    title: 'Real photo — Goslings Black Seal Bermuda Black Rum (front + back)',
    imagePath: '/labels/actual/IMG_1378.jpeg',
    backImagePath: '/labels/actual/IMG_1379.jpeg',
    realPhoto: true,
    expected: {
      brand: 'Goslings',
      classType: 'Bermuda Black Rum (Black Seal)',
      alcoholContent: '40% Alc./Vol. (80 Proof)',
      netContents: '750 mL',
      bottlerProducer: '',
      countryOfOrigin: '',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
  {
    id: '10_velvet_thorn_liqueur',
    title: 'Velvet Thorn — Blackberry Liqueur',
    imagePath: '/labels/synthetic/10_velvet_thorn_liqueur.png',
    expected: {
      brand: 'VELVET THORN',
      classType: 'Blackberry Liqueur',
      alcoholContent: '20% Alc./Vol. (40 Proof)',
      netContents: '500 mL',
      bottlerProducer: 'Velvet Thorn Cordials',
      countryOfOrigin: 'Asheville, North Carolina',
      governmentWarning: CANONICAL_GOVERNMENT_WARNING,
    },
  },
];

export function findSample(id: string): SampleLabel | undefined {
  return SAMPLE_LABELS.find((s) => s.id === id);
}
