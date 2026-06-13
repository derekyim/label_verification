'use client';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1f3b6e' },
    secondary: { main: '#7a3b16' },
    success: { main: '#2e7d32' },
    warning: { main: '#ed6c02' },
    error: { main: '#c62828' },
    background: { default: '#f7f5f0', paper: '#ffffff' },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 600 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.35rem', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
});
