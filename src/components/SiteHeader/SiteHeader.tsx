'use client';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import Link from 'next/link';
import VerifiedIcon from '@mui/icons-material/Verified';
import './SiteHeader.css';

export default function SiteHeader() {
  return (
    <AppBar position="sticky" color="default" elevation={0} className="site-header">
      <Toolbar className="site-header-toolbar">
        <Box component={Link} href="/" className="site-header-logo">
          <VerifiedIcon color="primary" />
          <Typography variant="h6" component="div" className="site-header-logo-text">
            Alcohol Label Verification (Demo)
          </Typography>
        </Box>
        <Box className="site-header-spacer" />
        <Button component={Link} href="/verify" color="inherit">Single</Button>
        <Button component={Link} href="/batch" color="inherit">Batch</Button>
      </Toolbar>
    </AppBar>
  );
}
