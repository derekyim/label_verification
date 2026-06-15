'use client';
import { useRef } from 'react';
import {
  Paper,
  Stack,
  Button,
  TextField,
  MenuItem,
  Alert,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { SAMPLE_LABELS } from '@/lib/samples/expected';
import './VerifyImagePanel.css';

interface VerifyImagePanelProps {
  selectedSample: string;
  onSampleChange: (id: string) => void;
  imageUrl: string;
  backImageUrl: string;
  uploadedFile: File | null;
  realPhotoNote: boolean;
  onFileSelected: (file: File) => void;
  onBackFileSelected: (file: File) => void;
}

export default function VerifyImagePanel({
  selectedSample,
  onSampleChange,
  imageUrl,
  backImageUrl,
  uploadedFile,
  realPhotoNote,
  onFileSelected,
  onBackFileSelected,
}: VerifyImagePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Stack spacing={2} className="verify-image-panel">
      <Paper variant="outlined" className="verify-image-panel-controls">
        <Stack spacing={2}>
          <TextField
            select
            label="Bundled sample"
            value={selectedSample}
            onChange={(e) => onSampleChange(e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="">&mdash; None &mdash;</MenuItem>
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
                if (f) onFileSelected(f);
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
                if (f) onBackFileSelected(f);
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
          Real-world photos vary in angle, glare, and lighting. The extractor is robust but not perfect on imperfect photos &mdash; a &ldquo;review needed&rdquo; verdict here usually means the model misread one field, not that the label is non-compliant.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: backImageUrl ? 'row' : 'column' }} spacing={2}>
        <Paper variant="outlined" className="verify-image-panel-preview">
          {imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Front of bottle" />
              <Typography variant="caption" color="text.secondary" className="verify-image-panel-caption">Front</Typography>
            </>
          ) : (
            <Typography color="text.secondary">Image preview will appear here.</Typography>
          )}
        </Paper>
        {backImageUrl && (
          <Paper variant="outlined" className="verify-image-panel-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={backImageUrl} alt="Back of bottle" />
            <Typography variant="caption" color="text.secondary" className="verify-image-panel-caption">Back</Typography>
          </Paper>
        )}
      </Stack>
    </Stack>
  );
}
