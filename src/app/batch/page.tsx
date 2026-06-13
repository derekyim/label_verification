'use client';
import { useMemo, useRef, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Stack,
  Tabs,
  Tab,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Link as MuiLink,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import { parseManifest, type BatchRow } from '@/lib/parsers/manifest';
import type { LabelFields } from '@/lib/extractor/types';
import type { ComparisonResult } from '@/lib/comparator/compare';

interface BatchRowResult {
  imageFilename: string;
  ok: boolean;
  error?: string;
  fields?: LabelFields;
  comparison?: ComparisonResult;
  latencyMs?: number;
}

interface BatchResponse {
  results: BatchRowResult[];
  summary: { total: number; passed: number; failed: number; errored: number };
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const allFilenamesResolvable = useMemo(() => {
    if (tab !== 'upload-images') return true;
    return rows.every((r) => {
      const front = !!uploadedImages[r.imageFilename];
      const back = !r.backImageFilename || !!uploadedImages[r.backImageFilename];
      return front && back;
    });
  }, [rows, uploadedImages, tab]);

  function handleManifestFile(file: File) {
    file.text().then((text) => {
      setPasted(text);
      const parsed = parseManifest(text);
      setRows(parsed.rows);
      setParseErrors(parsed.errors);
    });
  }

  function handleParse() {
    const parsed = parseManifest(pasted);
    setRows(parsed.rows);
    setParseErrors(parsed.errors);
    setResponse(null);
  }

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>Batch verification</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Paste or upload a CSV / JSON manifest. Each row references an image by filename.
        Up to {MAX_ROWS} labels per batch.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
              Upload manifest (.csv or .json)
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".csv,.json,text/csv,application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleManifestFile(f);
                }}
              />
            </Button>
            <Typography variant="body2" color="text.secondary">or paste below.</Typography>
            <Box sx={{ flex: 1 }} />
            <MuiLink href="/samples/sample-batch.csv" download>sample CSV</MuiLink>
            <MuiLink href="/samples/sample-batch.json" download>sample JSON</MuiLink>
          </Stack>
          <TextField
            multiline
            minRows={6}
            maxRows={14}
            fullWidth
            placeholder="Paste CSV or JSON here…"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            sx={{ fontFamily: 'monospace' }}
          />
          <Stack direction="row" spacing={1}>
            <Button onClick={handleParse} variant="outlined">Parse manifest</Button>
            <Box sx={{ flex: 1 }} />
            <Chip label={`${rows.length} row${rows.length === 1 ? '' : 's'} parsed`} color={rows.length ? 'primary' : 'default'} />
          </Stack>
          {parseErrors.length > 0 && (
            <Alert severity="warning">
              {parseErrors.map((e, i) => <div key={i}>{e}</div>)}
            </Alert>
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="paste" label="Use bundled images" />
          <Tab value="upload-images" label="Upload images" />
        </Tabs>
        <Box sx={{ pt: 2 }}>
          {tab === 'paste' ? (
            <Typography variant="body2" color="text.secondary">
              The manifest&apos;s <code>image_filename</code> column will resolve against bundled
              labels under <code>/public/labels/synthetic/</code> and <code>/public/labels/actual/</code>.
              No image upload required.
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
                  Select image files
                  <input
                    ref={imageInputRef}
                    type="file"
                    hidden
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      const map: Record<string, File> = { ...uploadedImages };
                      for (const f of files) map[f.name] = f;
                      setUploadedImages(map);
                      if (imageInputRef.current) imageInputRef.current.value = '';
                    }}
                  />
                </Button>
                {Object.keys(uploadedImages).length > 0 && (
                  <Chip
                    label={`${Object.keys(uploadedImages).length} image${Object.keys(uploadedImages).length === 1 ? '' : 's'} loaded`}
                    color="primary"
                    onDelete={() => setUploadedImages({})}
                  />
                )}
                {rows.length > 0 && Object.keys(uploadedImages).length > 0 && (
                  <Chip
                    label={`${rows.filter((r) => uploadedImages[r.imageFilename]).length}/${rows.length} matched to manifest`}
                    color={rows.every((r) => uploadedImages[r.imageFilename]) ? 'success' : 'warning'}
                    variant="outlined"
                  />
                )}
              </Stack>
              {Object.keys(uploadedImages).length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.keys(uploadedImages).map((name) => {
                    const matched = rows.length > 0 && rows.some(
                      (r) => r.imageFilename === name || r.backImageFilename === name,
                    );
                    return (
                      <Chip
                        key={name}
                        label={name}
                        size="small"
                        variant="outlined"
                        color={rows.length === 0 ? 'default' : matched ? 'success' : 'warning'}
                        onDelete={() => {
                          const next = { ...uploadedImages };
                          delete next[name];
                          setUploadedImages(next);
                        }}
                      />
                    );
                  })}
                </Box>
              )}
              <Typography variant="body2" color="text.secondary">
                {Object.keys(uploadedImages).length === 0
                  ? 'Select the label images referenced in your manifest. Files are matched to rows by filename.'
                  : rows.length === 0
                    ? 'Images loaded. Now paste or upload a manifest above so filenames can be matched.'
                    : 'Green chips are matched to a manifest row. Remove unneeded images with the × button.'}
              </Typography>
            </Stack>
          )}
        </Box>
      </Paper>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={busy ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
          onClick={onRun}
          disabled={busy || rows.length === 0 || !allFilenamesResolvable}
        >
          {busy ? 'Verifying…' : `Verify ${rows.length} label${rows.length === 1 ? '' : 's'}`}
        </Button>
        {response && (
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadResultsCsv}>
            Download results CSV
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {response && (
        <Paper variant="outlined">
          <Box sx={{ p: 2, borderBottom: '1px solid #e0dcd2' }}>
            <Stack direction="row" spacing={1}>
              <Chip color="success" label={`${response.summary.passed} passed`} />
              <Chip color="error" label={`${response.summary.failed} need review`} />
              <Chip label={`${response.summary.errored} errored`} />
              <Box sx={{ flex: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Total {response.summary.total}
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
              {response.results.map((r) => {
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
                    <TableCell>{r.latencyMs ?? '—'} ms</TableCell>
                    <TableCell>
                      {failed.length === 0 ? <em>—</em> : failed.join(', ')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {r.comparison ? `${r.comparison.fields.filter(f => f.status === 'pass').length} pass · ${r.comparison.fields.filter(f => f.status === 'fuzzy').length} fuzzy · ${r.comparison.fields.filter(f => f.status === 'skipped').length} skipped` : ''}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}

function csvCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
