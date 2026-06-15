'use client';
import { useRef } from 'react';
import {
  Paper,
  Stack,
  Box,
  Button,
  TextField,
  Chip,
  Alert,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { parseManifest, type BatchRow } from '@/lib/parsers/manifest';
import './BatchManifestInput.css';

interface BatchManifestInputProps {
  pasted: string;
  onPastedChange: (value: string) => void;
  rows: BatchRow[];
  onRowsChange: (rows: BatchRow[]) => void;
  parseErrors: string[];
  onParseErrorsChange: (errors: string[]) => void;
  onResponseClear: () => void;
}

export default function BatchManifestInput({
  pasted,
  onPastedChange,
  rows,
  onRowsChange,
  parseErrors,
  onParseErrorsChange,
  onResponseClear,
}: BatchManifestInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleManifestFile(file: File) {
    file.text().then((text) => {
      onPastedChange(text);
      const parsed = parseManifest(text);
      onRowsChange(parsed.rows);
      onParseErrorsChange(parsed.errors);
    });
  }

  function handleParse() {
    const parsed = parseManifest(pasted);
    onRowsChange(parsed.rows);
    onParseErrorsChange(parsed.errors);
    onResponseClear();
  }

  return (
    <Paper variant="outlined" className="batch-manifest-input">
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
          <Box className="batch-manifest-input-spacer" />
          <MuiLink href="/samples/sample-batch.csv" download>sample CSV</MuiLink>
          <MuiLink href="/samples/sample-batch.json" download>sample JSON</MuiLink>
          <MuiLink href="/samples/sample-images.zip" download>sample Images</MuiLink>
        </Stack>
        <TextField
          multiline
          minRows={6}
          maxRows={14}
          fullWidth
          placeholder="Paste CSV or JSON here..."
          value={pasted}
          onChange={(e) => onPastedChange(e.target.value)}
          className="batch-manifest-input-textarea"
        />
        <Stack direction="row" spacing={1}>
          <Button onClick={handleParse} variant="outlined">Parse manifest</Button>
          <Box className="batch-manifest-input-footer-spacer" />
          <Chip label={`${rows.length} row${rows.length === 1 ? '' : 's'} parsed`} color={rows.length ? 'primary' : 'default'} />
        </Stack>
        {parseErrors.length > 0 && (
          <Alert severity="warning">
            {parseErrors.map((e, i) => <div key={i}>{e}</div>)}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
