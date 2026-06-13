export interface LabelFields {
  brand: string;
  classType: string;
  alcoholContent: string;
  netContents: string;
  bottlerProducer: string;
  countryOfOrigin: string;
  governmentWarning: string;
}

export interface ExtractionResult {
  fields: LabelFields;
  /** Milliseconds spent in the extractor, measured server-side. */
  latencyMs: number;
  /** Model identifier, for traceability in the UI. */
  model: string;
}

export interface LabelImage {
  bytes: Uint8Array;
  mimeType: string;
  /** Optional hint passed to the model to clarify multi-image extraction. */
  kind?: 'front' | 'back' | 'side';
}

export interface Extractor {
  /**
   * Extract label fields. Pass an array — typically one image, but real
   * bottles often have the brand fields on the front and the government
   * warning on the back, so both sides can be passed together.
   */
  extract(images: LabelImage[]): Promise<ExtractionResult>;
}

export const EMPTY_FIELDS: LabelFields = {
  brand: '',
  classType: '',
  alcoholContent: '',
  netContents: '',
  bottlerProducer: '',
  countryOfOrigin: '',
  governmentWarning: '',
};
