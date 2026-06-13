'use client';
import {
  Paper,
  Stack,
  Box,
  Typography,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import type { ComparisonResult, FieldStatus } from '@/lib/comparator/compare';
import { humanFieldName } from '@/lib/comparator/compare';
import { CANONICAL_GOVERNMENT_WARNING } from '@/lib/comparator/warning';
import type { LabelFields } from '@/lib/extractor/types';

export interface ResultsProps {
  fields: LabelFields;
  comparison: ComparisonResult;
  latencyMs: number;
  totalMs: number;
  model: string;
}

const STATUS_META: Record<FieldStatus, { color: 'success' | 'error' | 'warning' | 'default'; label: string; icon: React.ReactNode }> = {
  pass: { color: 'success', label: 'Pass', icon: <CheckCircleIcon fontSize="small" /> },
  fuzzy: { color: 'warning', label: 'Fuzzy match', icon: <WarningAmberIcon fontSize="small" /> },
  fail: { color: 'error', label: 'Mismatch', icon: <CancelIcon fontSize="small" /> },
  skipped: { color: 'default', label: 'Not checked', icon: <RemoveCircleOutlineIcon fontSize="small" /> },
};

export default function ResultsPanel(props: ResultsProps) {
  const { comparison, latencyMs, totalMs, model } = props;
  const verdict = comparison.overallPass
    ? { color: 'success' as const, text: 'PASS', detail: 'All fields match.' }
    : { color: 'error' as const, text: 'REVIEW NEEDED', detail: `${comparison.failureCount} field(s) need review.` };

  const warningRow = comparison.fields.find((f) => f.field === 'governmentWarning')!;
  const otherRows = comparison.fields.filter((f) => f.field !== 'governmentWarning');

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Chip
            label={verdict.text}
            color={verdict.color}
            sx={{ fontWeight: 700, fontSize: '1rem', px: 2, py: 2.5 }}
          />
          <Typography variant="h3" sx={{ flex: 1 }}>{verdict.detail}</Typography>
          <Stack direction="row" spacing={1}>
            <Chip size="small" label={`Model ${latencyMs} ms`} />
            <Chip size="small" label={`End-to-end ${totalMs} ms`} color={totalMs <= 5000 ? 'success' : 'warning'} />
            <Chip size="small" variant="outlined" label={model} />
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '18%' }}>Field</TableCell>
              <TableCell sx={{ width: '32%' }}>On the label</TableCell>
              <TableCell sx={{ width: '32%' }}>From the application</TableCell>
              <TableCell sx={{ width: '18%' }}>Verdict</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {otherRows.map((row) => {
              const meta = STATUS_META[row.status];
              return (
                <TableRow key={row.field}>
                  <TableCell>{humanFieldName(row.field)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{row.label || <em>—</em>}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{row.application || <em>—</em>}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={meta.color} icon={meta.icon as React.ReactElement} label={meta.label} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {row.reason}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h3">Government Warning</Typography>
          <Chip
            size="small"
            color={STATUS_META[warningRow.status].color}
            icon={STATUS_META[warningRow.status].icon as React.ReactElement}
            label={STATUS_META[warningRow.status].label}
          />
        </Stack>
        <Alert severity={warningRow.status === 'pass' ? 'success' : warningRow.status === 'skipped' ? 'info' : 'error'} sx={{ mb: 2 }}>
          {warningRow.reason}
        </Alert>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" color="text.secondary">As extracted from the label</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#fafafa', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
              {warningRow.label || <em>(missing)</em>}
            </Paper>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" color="text.secondary">Canonical TTB warning</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#fafafa', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
              {CANONICAL_GOVERNMENT_WARNING}
            </Paper>
          </Box>
        </Stack>
      </Paper>

      <Divider />
      <Typography variant="caption" color="text.secondary">
        Extraction is performed by a vision-language model. The pass/fail decision is made by
        deterministic TypeScript in <code>src/lib/comparator/</code>, not by the model.
      </Typography>
    </Stack>
  );
}
