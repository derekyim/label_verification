'use client';
import { useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Stack,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import type { BatchRow } from '@/lib/parsers/manifest';
import BatchManifestInput from '@/components/BatchManifestInput/BatchManifestInput';
import BatchImageSource from '@/components/BatchImageSource/BatchImageSource';
import BatchResultsTable from '@/components/BatchResultsTable/BatchResultsTable';
import type { BatchRowResult, BatchSummary } from '@/components/BatchResultsTable/BatchResultsTable';
import './page.css';

interface BatchResponse {
  results: BatchRowResult[];
  summary: BatchSummary;
}

const MAX_ROWS = 25;

export default function BatchPage() {
  const [tab, setTab] = useState<'paste' | 'upload-images'>('paste');
  const [pasted, setPasted] = useState<string>('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [uploadedImages, setUploadedImages] = useState<Record<string, File>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>('');
  const [response, setResponse] = useState<BatchResponse | null>(null);

  const allFilenamesResolvable = useMemo(() => {
    if (tab !== 'upload-images') return true;
    return rows.every((r) => {
      const front = !!uploadedImages[r.imageFilename];
      const back = !r.backImageFilename || !!uploadedImages[r.backImageFilename];
      return front && back;
    });
  }, [rows, uploadedImages, tab]);

  async function fileToBase64(file: File): Promise<string> {
    const ab = await file.arrayBuffer();
    return Buffer.from(ab).toString('base64');
  }

  async function onRun() {
    setBusy(true);
    setError('');
    setResponse(null);
    try {
      if (rows.length === 0) throw new Error('No rows to process. Paste or upload a manifest first.');
      if (rows.length > MAX_ROWS) throw new Error(`Batch size limit is ${MAX_ROWS}. Got ${rows.length}.`);
      const payloadRows = await Promise.all(rows.map(async (r) => {
        const out: Record<string, unknown> = { ...r };
        const front = uploadedImages[r.imageFilename];
        if (front) {
          out.imageBase64 = await fileToBase64(front);
          out.imageMime = front.type || 'image/png';
        }
        if (r.backImageFilename) {
          const back = uploadedImages[r.backImageFilename];
          if (back) {
            out.backImageBase64 = await fileToBase64(back);
            out.backImageMime = back.type || 'image/png';
          }
        }
        return out;
      }));
      const res = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows: payloadRows }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Batch failed');
      setResponse(body as BatchResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  function downloadResultsCsv() {
    if (!response) return;
    const header = ['image_filename', 'overall', 'latency_ms', 'failed_fields', 'error'];
    const lines = [header.join(',')];
    for (const r of response.results) {
      const overall = r.ok ? (r.comparison?.overallPass ? 'pass' : 'review') : 'error';
      const failedFields = r.comparison
        ? r.comparison.fields.filter((f) => f.status === 'fail').map((f) => f.field).join('|')
        : '';
      const cells = [
        csvCell(r.imageFilename),
        overall,
        String(r.latencyMs ?? ''),
        csvCell(failedFields),
        csvCell(r.error ?? ''),
      ];
      lines.push(cells.join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Container maxWidth="lg" className="batch-page">
      <Typography variant="h2" className="batch-page-title">Batch verification</Typography>
      <Typography color="text.secondary" className="batch-page-subtitle">
        Paste or upload a CSV / JSON manifest. Each row references an image by filename.
        Up to {MAX_ROWS} labels per batch.
      </Typography>

      <BatchManifestInput
        pasted={pasted}
        onPastedChange={setPasted}
        rows={rows}
        onRowsChange={setRows}
        parseErrors={parseErrors}
        onParseErrorsChange={setParseErrors}
        onResponseClear={() => setResponse(null)}
      />

      <BatchImageSource
        tab={tab}
        onTabChange={setTab}
        rows={rows}
        uploadedImages={uploadedImages}
        onUploadedImagesChange={setUploadedImages}
      />

      <Stack direction="row" spacing={2} className="batch-page-actions">
        <Button
          variant="contained"
          size="large"
          startIcon={busy ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
          onClick={onRun}
          disabled={busy || rows.length === 0 || !allFilenamesResolvable}
        >
          {busy ? 'Verifying\u2026' : `Verify ${rows.length} label${rows.length === 1 ? '' : 's'}`}
        </Button>
        {response && (
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadResultsCsv}>
            Download results CSV
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" className="batch-page-error">{error}</Alert>}

      {response && (
        <BatchResultsTable results={response.results} summary={response.summary} />
      )}
    </Container>
  );
}

function csvCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
