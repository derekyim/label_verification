'use client';
import { Card, CardActionArea, CardContent, Typography, Button } from '@mui/material';
import Link from 'next/link';
import './PathCard.css';

interface PathCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
}

export default function PathCard({ href, icon, title, body, cta }: PathCardProps) {
  return (
    <Card variant="outlined" className="path-card">
      <CardActionArea component={Link} href={href} className="path-card-action-area">
        <CardContent className="path-card-content">
          {icon}
          <Typography variant="h3">{title}</Typography>
          <Typography color="text.secondary" className="path-card-body">{body}</Typography>
          <Button variant="contained" color="primary" className="path-card-cta">
            {cta}
          </Button>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
