import type { Metadata } from 'next';
import ThemeRegistry from './ThemeRegistry';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Alcohol Label Verification (Demo) — TTB Alcohol Label Verification',
  description:
    'Verify alcohol label fields against application data in under five seconds.  This is a demo of the TTB Alcohol Label Verification tool.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <SiteHeader />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
