'use client';
import { Box, Typography, Paper, Stack } from '@mui/material';
import './HowItWorks.css';

interface Step {
  n: number;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  { n: 1, title: 'Upload a label', body: 'Drop a photo of the bottle label, or pick from the ten bundled samples.' },
  { n: 2, title: 'Enter the application values', body: 'The form has the six TTB-required fields. Bundled samples auto-fill it.' },
  { n: 3, title: 'See per-field results', body: 'A Green mark indicates a match, An Amber mark indicatess a fuzzy match (thie requires review), A red mark indicates a mismatch, this should be rejected. Results in about five seconds.' },
];

export default function HowItWorks() {
  return (
    <Box className="how-it-works">
      <Typography variant="h2" className="how-it-works-title">How it works</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {STEPS.map((s) => (
          <Paper key={s.n} variant="outlined" className="how-it-works-card">
            <Typography variant="overline" color="primary">Step {s.n}</Typography>
            <Typography variant="h3" className="how-it-works-card-title">{s.title}</Typography>
            <Typography color="text.secondary">{s.body}</Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
