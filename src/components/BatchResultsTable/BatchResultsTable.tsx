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
} from '@mui/material';
import type { LabelFields } from '@/lib/extractor/types';
import type { ComparisonResult } from '@/lib/comparator/compare';
import './BatchResultsTable.css';

export interface BatchRowResult {
  imageFilename: string;
  ok: boolean;
  error?: string;
  fields?: LabelFields;
  comparison?: ComparisonResult;
  latencyMs?: number;
}

export interface BatchSummary {
  total: number;
  passed: number;
  failed: number;
  errored: number;
}

interface BatchResultsTableProps {
  results: BatchRowResult[];
  summary: BatchSummary;
}

export default function BatchResultsTable({ results, summary }: BatchResultsTableProps) {
  return (
    <Paper variant="outlined" className="batch-results-table">
      <Box className="batch-results-table-summary">
        <Stack direction="row" spacing={1}>
          <Chip color="success" label={`${summary.passed} passed`} />
          <Chip color="error" label={`${summary.failed} need review`} />
          <Chip label={`${summary.errored} errored`} />
          <Box className="batch-results-table-summary-spacer" />
          <Typography variant="body2" color="text.secondary">
            Total {summary.total}
          </Typography>
        </Stack>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Image</TableCell>
            <TableCell>Result</TableCell>
            <TableCell>Latency</TableCell>
            <TableCell>Failed fields</TableCell>
            <TableCell>Detail</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r) => {
            if (!r.ok) {
              return (
                <TableRow key={r.imageFilename}>
                  <TableCell>{r.imageFilename}</TableCell>
                  <TableCell><Chip size="small" label="Error" /></TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell><Typography variant="body2" color="error">{r.error}</Typography></TableCell>
                </TableRow>
              );
            }
            const pass = r.comparison?.overallPass;
            const failed = r.comparison?.fields.filter((f) => f.status === 'fail').map((f) => f.field) ?? [];
            return (
              <TableRow key={r.imageFilename}>
                <TableCell>{r.imageFilename}</TableCell>
                <TableCell>
                  <Chip size="small" color={pass ? 'success' : 'error'} label={pass ? 'Pass' : 'Review'} />
                </TableCell>
                <TableCell>{r.latencyMs ?? '\u2014'} ms</TableCell>
                <TableCell>
                  {failed.length === 0 ? <em>{'\u2014'}</em> : failed.join(', ')}
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {r.comparison ? `${r.comparison.fields.filter(f => f.status === 'pass').length} pass \u00b7 ${r.comparison.fields.filter(f => f.status === 'fuzzy').length} fuzzy \u00b7 ${r.comparison.fields.filter(f => f.status === 'skipped').length} skipped` : ''}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}
