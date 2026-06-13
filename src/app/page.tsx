'use client';
import {
  Container,
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Chip,
  Button,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import Link from 'next/link';
import ScienceIcon from '@mui/icons-material/Science';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LayersIcon from '@mui/icons-material/Layers';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';

const STEPS = [
  { n: 1, title: 'Upload a label', body: 'Drop a photo of the bottle label, or pick from the ten bundled samples.' },
  { n: 2, title: 'Enter the application values', body: 'The form has the six TTB-required fields. Bundled samples auto-fill it.' },
  { n: 3, title: 'See per-field results', body: 'A Green mark indicates a match, An Amber mark indicatess a fuzzy match (thie requires review), A red mark indicates a mismatch, this should be rejected. Results in about five seconds.' },
];

export default function ExplainerPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box textAlign="center" sx={{ mb: 6 }}>
        <Chip label="Prototype" color="primary" variant="outlined" sx={{ mb: 2 }} />
        <Typography variant="h1" sx={{ mb: 2 }}>
          Verify alcohol label fields against application data — in about five seconds.
        </Typography>
        <Typography variant="h3" component="p" color="text.secondary" sx={{ fontWeight: 400 }}>
          A faster path through TTB&apos;s 150,000 yearly label reviews.
        </Typography>
      </Box>


      <Accordion
        variant="outlined"
        sx={{
          mb: 6,
          '&::before': { display: 'none' },
          borderRadius: 1,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h3">Quick Start Guide</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography sx={{ mb: 2 }}>
            This landing page showcases the proposed solution for label verification.  There are two verification modes available in the application.
            The Start Here section below enter you into the actual application with one of three modes: 
            * Single Mode: Upload one label image and fill in (or auto-fill from a sample) the six TTB-required fields.
            * Batch Mode: Paste or upload a CSV / JSON manifest referencing up to 25 labels at once. The system processes every row and produces a results table you can export as CSV. Ideal for clearing a queue of pending applications in one pass.
            * Sample Mode: Try a sample label. One click. Loads a bundled label and its expected values, then runs the verification.
          </Typography>

          <Typography variant="h4" sx={{ mb: 1 }}>Single Mode</Typography>
          <Typography sx={{ mb: 2 }}>
            Upload one label image and fill in (or auto-fill from a sample) the six TTB-required
            fields. The system extracts text from the image and compares each field, returning a
            green / amber / red result in about five seconds. Best for spot-checking individual
            labels during the review process.
          </Typography>

          <Typography variant="h4" sx={{ mb: 1 }}>Batch Mode</Typography>
          <Typography sx={{ mb: 3 }}>
            Paste or upload a CSV / JSON manifest referencing up to 25 labels at once. The system
            processes every row and produces a results table you can export as CSV. Ideal for
            clearing a queue of pending applications in one pass.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <OndemandVideoIcon color="primary" />
            <Typography variant="h4">Video Walkthrough</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Watch a short Loom walkthrough showing how to use both modes end-to-end.
          </Typography>
          <Box
            sx={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              overflow: 'hidden',
              borderRadius: 1,
              border: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Replace the src below with your Loom embed URL */}
            <Typography
              color="text.secondary"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                px: 2,
              }}
            >
              Loom video embed goes here &mdash; replace this placeholder with an
              {' '}<code>&lt;iframe&gt;</code> from Loom&apos;s share dialog.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Typography variant="h2" sx={{ mb: 3 }}>How it works</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 6 }}>
        {STEPS.map((s) => (
          <Paper key={s.n} variant="outlined" sx={{ p: 3, flex: 1 }}>
            <Typography variant="overline" color="primary">Step {s.n}</Typography>
            <Typography variant="h3" sx={{ mb: 1 }}>{s.title}</Typography>
            <Typography color="text.secondary">{s.body}</Typography>
          </Paper>
        ))}
      </Stack>

      <Typography variant="h2" sx={{ mb: 3 }}>Start Here  </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 6 }}>
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

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>Sample manifests for batch mode</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
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
    </Container>
  );
}

function PathCard(props: { href: string; icon: React.ReactNode; title: string; body: string; cta: string }) {
  return (
    <Card variant="outlined" sx={{ flex: 1, display: 'flex' }}>
      <CardActionArea component={Link} href={props.href} sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
          {props.icon}
          <Typography variant="h3">{props.title}</Typography>
          <Typography color="text.secondary" sx={{ flex: 1 }}>{props.body}</Typography>
          <Button variant="contained" color="primary" sx={{ alignSelf: 'flex-start', mt: 1 }}>
            {props.cta}
          </Button>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
