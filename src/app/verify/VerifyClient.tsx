'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { SAMPLE_LABELS, findSample } from '@/lib/samples/expected';
import type { LabelFields } from '@/lib/extractor/types';
import { EMPTY_FIELDS } from '@/lib/extractor/types';
import ResultsPanel from '@/components/ResultsPanel';
import type { ComparisonResult } from '@/lib/comparator/compare';

interface VerifyResponse {
  fields: LabelFields;
  comparison: ComparisonResult;
  latencyMs: number;
  totalMs: number;
  model: string;
}

const FIELD_LABELS: { key: keyof LabelFields; label: string; multiline?: boolean; rows?: number }[] = [
  { key: 'brand', label: 'Brand Name' },
  { key: 'classType', label: 'Class / Type' },
  { key: 'alcoholContent', label: 'Alcohol Content' },
  { key: 'netContents', label: 'Net Contents' },
  { key: 'bottlerProducer', label: 'Bottler / Producer' },
  { key: 'countryOfOrigin', label: 'Country of Origin' },
  { key: 'governmentWarning', label: 'Government Warning', multiline: true, rows: 5 },
];

export default function VerifyClient() {
  const search = useSearchParams();
  const initialSample = search.get('sample') ?? '';
  const [selectedSample, setSelectedSample] = useState<string>(initialSample);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [backImageUrl, setBackImageUrl] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedBackFile, setUploadedBackFile] = useState<File | null>(null);
  const [expected, setExpected] = useState<LabelFields>({ ...EMPTY_FIELDS });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [realPhotoNote, setRealPhotoNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-load sample when ?sample=... is in the URL or selector changes
  useEffect(() => {
    if (!selectedSample) return;
    const s = findSample(selectedSample);
    if (!s) return;
    setImageUrl(s.imagePath);
    setBackImageUrl(s.backImagePath ?? '');
    setExpected({ ...s.expected });
    setUploadedFile(null);
    setUploadedBackFile(null);
    setRealPhotoNote(Boolean(s.realPhoto));
    setResult(null);
    setError('');
  }, [selectedSample]);

  function handleFile(file: File) {
    setUploadedFile(file);
    setSelectedSample('');
    setImageUrl(URL.createObjectURL(file));
    setRealPhotoNote(false);
    setResult(null);
    setError('');
  }

  function handleBackFile(file: File) {
    setUploadedBackFile(file);
    setSelectedSample('');
    setBackImageUrl(URL.createObjectURL(file));
    setResult(null);
    setError('');
  }

  async function onVerify() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      let response: Response;
      if (uploadedFile) {
        const form = new FormData();
        form.append('image', uploadedFile);
        if (uploadedBackFile) form.append('imageBack', uploadedBackFile);
        form.append('expected', JSON.stringify(expected));
        response = await fetch('/api/verify', { method: 'POST', body: form });
      } else if (selectedSample) {
        const s = findSample(selectedSample);
        if (!s) throw new Error('Sample not found');
        response = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            samplePath: s.imagePath,
            sampleBackPath: s.backImagePath,
            expected,
          }),
        });
      } else {
        throw new Error('Pick a sample or upload an image first.');
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Verification failed');
      setResult(body as VerifyResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  function onClear() {
    setSelectedSample('');
    setUploadedFile(null);
    setUploadedBackFile(null);
    setImageUrl('');
    setBackImageUrl('');
    setExpected({ ...EMPTY_FIELDS });
    setRealPhotoNote(false);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (backFileInputRef.current) backFileInputRef.current.value = '';
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>Single label verification</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Upload a label, or pick a bundled sample. Fill in the application values, then verify.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 4 }}>
        {/* Image column */}
        <Stack spacing={2} sx={{ flex: 1 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <TextField
                select
                label="Bundled sample"
                value={selectedSample}
                onChange={(e) => setSelectedSample(e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="">— None —</MenuItem>
                {SAMPLE_LABELS.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>
                ))}
              </TextField>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
              >
                Upload front image
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </Button>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                disabled={!uploadedFile && !selectedSample}
              >
                Upload back image (optional)
                <input
                  ref={backFileInputRef}
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleBackFile(f);
                  }}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                Government warning text usually lives on the back of the bottle. Add a back image when it&apos;s missing from the front.
              </Typography>
            </Stack>
          </Paper>

          {realPhotoNote && (
            <Alert severity="info">
              Real-world photos vary in angle, glare, and lighting. The extractor is robust but not perfect on imperfect photos — a &ldquo;review needed&rdquo; verdict here usually means the model misread one field, not that the label is non-compliant.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: backImageUrl ? 'row' : 'column' }} spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, minHeight: 320, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa' }}>
              {imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Front of bottle" style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Front</Typography>
                </>
              ) : (
                <Typography color="text.secondary">Image preview will appear here.</Typography>
              )}
            </Paper>
            {backImageUrl && (
              <Paper variant="outlined" sx={{ p: 2, minHeight: 320, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={backImageUrl} alt="Back of bottle" style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Back</Typography>
              </Paper>
            )}
          </Stack>
        </Stack>

        {/* Application form column */}
        <Paper variant="outlined" sx={{ p: 3, flex: 1 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>Application values</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Leave a field blank to skip it. The Government Warning field is checked exactly — including all-caps prefix.
          </Typography>
          <Stack spacing={2}>
            {FIELD_LABELS.map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                value={expected[f.key]}
                onChange={(e) => setExpected({ ...expected, [f.key]: e.target.value })}
                multiline={f.multiline}
                rows={f.rows}
                fullWidth
                size="small"
              />
            ))}
          </Stack>
        </Paper>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={busy ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
          onClick={onVerify}
          disabled={busy || (!uploadedFile && !selectedSample)}
        >
          {busy ? 'Verifying…' : 'Verify'}
        </Button>
        <Button variant="text" onClick={onClear} disabled={busy}>Clear</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {result && (
        <Box>
          <Typography variant="h2" sx={{ mb: 3 }}>Results</Typography>
          <ResultsPanel {...result} />
        </Box>
      )}
    </Container>
  );
}
