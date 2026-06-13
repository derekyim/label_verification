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
import './ResultsPanel.css';

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
    <Stack spacing={3} className="results-panel">
      <Paper variant="outlined" className="results-panel-verdict">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Chip
            label={verdict.text}
            color={verdict.color}
            className="results-panel-verdict-chip"
          />
          <Typography variant="h3" className="results-panel-verdict-detail">{verdict.detail}</Typography>
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
              <TableCell className="results-panel-field-col">Field</TableCell>
              <TableCell className="results-panel-value-col">On the label</TableCell>
              <TableCell className="results-panel-value-col">From the application</TableCell>
              <TableCell className="results-panel-verdict-col">Verdict</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {otherRows.map((row) => {
              const meta = STATUS_META[row.status];
              return (
                <TableRow key={row.field}>
                  <TableCell>{humanFieldName(row.field)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" className="results-panel-cell-text">{row.label || <em>—</em>}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" className="results-panel-cell-text">{row.application || <em>—</em>}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={meta.color} icon={meta.icon as React.ReactElement} label={meta.label} />
                    <Typography variant="caption" color="text.secondary" className="results-panel-verdict-reason">
                      {row.reason}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Paper variant="outlined" className="results-panel-warning">
        <Stack direction="row" spacing={2} alignItems="center" className="results-panel-warning-header">
          <Typography variant="h3">Government Warning</Typography>
          <Chip
            size="small"
            color={STATUS_META[warningRow.status].color}
            icon={STATUS_META[warningRow.status].icon as React.ReactElement}
            label={STATUS_META[warningRow.status].label}
          />
        </Stack>
        <Alert severity={warningRow.status === 'pass' ? 'success' : warningRow.status === 'skipped' ? 'info' : 'error'} className="results-panel-warning-alert">
          {warningRow.reason}
        </Alert>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box className="results-panel-warning-box">
            <Typography variant="overline" color="text.secondary">As extracted from the label</Typography>
            <Paper variant="outlined" className="results-panel-warning-text">
              {warningRow.label || <em>(missing)</em>}
            </Paper>
          </Box>
          <Box className="results-panel-warning-box">
            <Typography variant="overline" color="text.secondary">Canonical TTB warning</Typography>
            <Paper variant="outlined" className="results-panel-warning-text">
              {CANONICAL_GOVERNMENT_WARNING}
            </Paper>
          </Box>
        </Stack>
      </Paper>

      <Divider />
      <Typography variant="caption" color="text.secondary" className="results-panel-footer">
        Extraction is performed by a vision-language model. The pass/fail decision is made by
        deterministic TypeScript in <code>src/lib/comparator/</code>, not by the model.
      </Typography>
    </Stack>
  );
}
