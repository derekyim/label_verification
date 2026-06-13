'use client';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import './QuickStartGuide.css';

export default function QuickStartGuide() {
  return (
    <Accordion variant="outlined" className="quick-start-guide">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h3">Quick Start Guide</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography className="quick-start-guide-intro">
          This landing page showcases the proposed solution for label verification.
          There are two verification modes available in the application.
          The Start Here section below enters you into the actual application with one of three modes:
        </Typography>

        <List dense className="quick-start-guide-list">
          <ListItem className="quick-start-guide-list-item">
            <ListItemText
              primary="Try a Sample Label"
              secondary="Try a sample label. One click. Loads a bundled label and its expected values, then runs the verification."
            />
          </ListItem>
          <ListItem className="quick-start-guide-list-item">
            <ListItemText
              primary="Verify Your Own Label"
              secondary="Upload one label image and fill in (or auto-fill from a sample) the six TTB-required fields."
            />
          </ListItem>
          <ListItem className="quick-start-guide-list-item">
            <ListItemText
              primary="Batch Mode"
              secondary="Paste or upload a CSV / JSON manifest referencing up to 25 labels at once. The system processes every row and produces a results table you can export as CSV. Ideal for clearing a queue of pending applications in one pass."
            />
          </ListItem>
        </List>

        <Typography variant="h4" className="quick-start-guide-section-title">Single Mode</Typography>
        <Typography className="quick-start-guide-section-body">
          Upload one label image and fill in (or auto-fill from a sample) the six TTB-required
          fields. The system extracts text from the image and compares each field, returning a
          green / amber / red result in about five seconds. Best for spot-checking individual
          labels during the review process.
        </Typography>

        <Typography variant="h4" className="quick-start-guide-section-title">Batch Mode</Typography>
        <Typography className="quick-start-guide-section-body-last">
          Paste or upload a CSV / JSON manifest referencing up to 25 labels at once. The system
          processes every row and produces a results table you can export as CSV. Ideal for
          clearing a queue of pending applications in one pass.
        </Typography>

        <Divider className="quick-start-guide-divider" />

        <Stack direction="row" alignItems="center" spacing={1} className="quick-start-guide-video-header">
          <OndemandVideoIcon color="primary" />
          <Typography variant="h4">Video Walkthrough</Typography>
        </Stack>
        <Typography color="text.secondary" className="quick-start-guide-video-description">
          Watch a short Loom walkthrough showing how to use both modes end-to-end.
        </Typography>
        <Box className="quick-start-guide-video-container">
          <Typography color="text.secondary" className="quick-start-guide-video-placeholder">
            Loom video embed goes here &mdash; replace this placeholder with an
            {' '}<code>&lt;iframe&gt;</code> from Loom&apos;s share dialog.
          </Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
