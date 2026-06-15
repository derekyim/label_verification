'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Stack,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { findSample } from '@/lib/samples/expected';
import type { LabelFields } from '@/lib/extractor/types';
import { EMPTY_FIELDS } from '@/lib/extractor/types';
import type { ComparisonResult } from '@/lib/comparator/compare';
import ResultsPanel from '@/components/ResultsPanel/ResultsPanel';
import VerifyImagePanel from '@/components/VerifyImagePanel/VerifyImagePanel';
import VerifyFormPanel from '@/components/VerifyFormPanel/VerifyFormPanel';
import './VerifyClient.css';

interface VerifyResponse {
  fields: LabelFields;
  comparison: ComparisonResult;
  latencyMs: number;
  totalMs: number;
  model: string;
}

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
  }

  return (
    <Container maxWidth="lg" className="verify-client">
      <Typography variant="h2" className="verify-client-title">Single label verification</Typography>
      <Typography color="text.secondary" className="verify-client-subtitle">
        Upload a label, or pick a bundled sample. Fill in the application values, then verify.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} className="verify-client-columns">
        <Box className="verify-client-image-column">
          <VerifyImagePanel
            selectedSample={selectedSample}
            onSampleChange={setSelectedSample}
            imageUrl={imageUrl}
            backImageUrl={backImageUrl}
            uploadedFile={uploadedFile}
            realPhotoNote={realPhotoNote}
            onFileSelected={handleFile}
            onBackFileSelected={handleBackFile}
          />
        </Box>
        <VerifyFormPanel expected={expected} onExpectedChange={setExpected} />
      </Stack>

      <Stack direction="row" spacing={2} className="verify-client-actions">
        <Button
          variant="contained"
          size="large"
          startIcon={busy ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
          onClick={onVerify}
          disabled={busy || (!uploadedFile && !selectedSample)}
        >
          {busy ? 'Verifying\u2026' : 'Verify'}
        </Button>
        <Button variant="text" onClick={onClear} disabled={busy}>Clear</Button>
      </Stack>

      {error && <Alert severity="error" className="verify-client-error">{error}</Alert>}

      {result && (
        <Box>
          <Typography variant="h2" className="verify-client-results-title">Results</Typography>
          <ResultsPanel {...result} />
        </Box>
      )}
    </Container>
  );
}
