'use client';
import { Box, Chip, Typography } from '@mui/material';
import './HeroBanner.css';

export default function HeroBanner() {
  return (
    <Box className="hero-banner">
      <Chip
        label="Prototype"
        color="primary"
        variant="outlined"
        className="hero-banner-chip"
      />
      <Typography variant="h1" className="hero-banner-title">
        Verify alcohol label fields against application data — in about five seconds.
      </Typography>
      <Typography variant="h3" component="p" color="text.secondary" className="hero-banner-subtitle">
        A faster path through TTB&apos;s 150,000 yearly label reviews.
      </Typography>
    </Box>
  );
}
