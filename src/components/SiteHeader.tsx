'use client';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import Link from 'next/link';
import VerifiedIcon from '@mui/icons-material/Verified';

export default function SiteHeader() {
  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: '1px solid #e0dcd2' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'inherit' }}>
          <VerifiedIcon color="primary" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            Alcohol Label Verification (Demo)
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button component={Link} href="/verify" color="inherit">Single</Button>
        <Button component={Link} href="/batch" color="inherit">Batch</Button>
      </Toolbar>
    </AppBar>
  );
}
