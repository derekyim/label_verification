'use client';
import { Box, Typography, Stack } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LayersIcon from '@mui/icons-material/Layers';
import PathCard from '@/components/PathCard/PathCard';
import './StartHere.css';

export default function StartHere() {
  return (
    <Box className="start-here">
      <Typography variant="h2" className="start-here-title">Start Here</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <PathCard
          href="/verify?sample=01_old_tom_bourbon"
          icon={<ScienceIcon fontSize="large" color="primary" />}
          title="Try a sample label"
          body="One click. Loads a bundled label and its expected values, then runs the verification."
          cta="Run sample"
        />
        <PathCard
          href="/verify"
          icon={<UploadFileIcon fontSize="large" color="primary" />}
          title="Verify your own label"
          body="Upload a JPEG or PNG and fill in the application values yourself."
          cta="Upload label"
        />
        <PathCard
          href="/batch"
          icon={<LayersIcon fontSize="large" color="primary" />}
          title="Batch mode"
          body="Paste or upload a CSV or JSON manifest. Results table with CSV export. Up to 25 labels per batch."
          cta="Open batch"
        />
      </Stack>
    </Box>
  );
}
