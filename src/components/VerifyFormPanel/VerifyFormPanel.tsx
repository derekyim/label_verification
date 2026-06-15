'use client';
import { Paper, Typography, Stack, TextField } from '@mui/material';
import type { LabelFields } from '@/lib/extractor/types';
import './VerifyFormPanel.css';

interface FieldDef {
  key: keyof LabelFields;
  label: string;
  multiline?: boolean;
  rows?: number;
}

const FIELD_LABELS: FieldDef[] = [
  { key: 'brand', label: 'Brand Name' },
  { key: 'classType', label: 'Class / Type' },
  { key: 'alcoholContent', label: 'Alcohol Content' },
  { key: 'netContents', label: 'Net Contents' },
  { key: 'bottlerProducer', label: 'Bottler / Producer' },
  { key: 'countryOfOrigin', label: 'Country of Origin' },
  { key: 'governmentWarning', label: 'Government Warning', multiline: true, rows: 5 },
];

interface VerifyFormPanelProps {
  expected: LabelFields;
  onExpectedChange: (fields: LabelFields) => void;
}

export default function VerifyFormPanel({ expected, onExpectedChange }: VerifyFormPanelProps) {
  return (
    <Paper variant="outlined" className="verify-form-panel">
      <Typography variant="h3" className="verify-form-panel-title">Application values</Typography>
      <Typography variant="body2" color="text.secondary" className="verify-form-panel-hint">
        Leave a field blank to skip it. The Government Warning field is checked exactly &mdash; including all-caps prefix.
      </Typography>
      <Stack spacing={2}>
        {FIELD_LABELS.map((f) => (
          <TextField
            key={f.key}
            label={f.label}
            value={expected[f.key]}
            onChange={(e) => onExpectedChange({ ...expected, [f.key]: e.target.value })}
            multiline={f.multiline}
            rows={f.rows}
            fullWidth
            size="small"
          />
        ))}
      </Stack>
    </Paper>
  );
}
