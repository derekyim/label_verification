'use client';
import { Paper, Typography, Stack, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import './SampleManifests.css';

export default function SampleManifests() {
  return (
    <Paper variant="outlined" className="sample-manifests">
      <Typography variant="h3" className="sample-manifests-title">
        Sample manifests for batch mode
      </Typography>
      <Typography color="text.secondary" className="sample-manifests-description">
        Download a starter manifest, edit it, then paste it back into the batch page.
        Each row references a bundled image filename so the demo works with no image uploads.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button
          component="a"
          href="/samples/sample-batch.csv"
          download
          startIcon={<DownloadIcon />}
          variant="outlined"
        >
          sample-batch.csv
        </Button>
        <Button
          component="a"
          href="/samples/sample-batch.json"
          download
          startIcon={<DownloadIcon />}
          variant="outlined"
        >
          sample-batch.json
        </Button>
      </Stack>
    </Paper>
  );
}
