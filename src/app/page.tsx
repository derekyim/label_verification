'use client';
import { Container } from '@mui/material';
import HeroBanner from '@/components/HeroBanner/HeroBanner';
import QuickStartGuide from '@/components/QuickStartGuide/QuickStartGuide';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import StartHere from '@/components/StartHere/StartHere';
import SampleManifests from '@/components/SampleManifests/SampleManifests';
import './page.css';

export default function ExplainerPage() {
  return (
    <Container maxWidth="lg" className="explainer-page">
      <HeroBanner />
      <QuickStartGuide />
      <HowItWorks />
      <StartHere />
      <SampleManifests />
    </Container>
  );
}
