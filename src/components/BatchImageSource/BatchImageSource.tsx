'use client';
import { useRef } from 'react';
import {
  Paper,
  Stack,
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { BatchRow } from '@/lib/parsers/manifest';
import './BatchImageSource.css';

interface BatchImageSourceProps {
  tab: 'paste' | 'upload-images';
  onTabChange: (tab: 'paste' | 'upload-images') => void;
  rows: BatchRow[];
  uploadedImages: Record<string, File>;
  onUploadedImagesChange: (images: Record<string, File>) => void;
}

export default function BatchImageSource({
  tab,
  onTabChange,
  rows,
  uploadedImages,
  onUploadedImagesChange,
}: BatchImageSourceProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageNames = Object.keys(uploadedImages);

  return (
    <Paper variant="outlined" className="batch-image-source">
      <Tabs value={tab} onChange={(_, v) => onTabChange(v)}>
        <Tab value="paste" label="Use bundled images" />
        <Tab value="upload-images" label="Upload images" />
      </Tabs>
      <Box className="batch-image-source-tab-content">
        {tab === 'paste' ? (
          <Typography variant="body2" color="text.secondary">
            The manifest&apos;s <code>image_filename</code> column will resolve against bundled
            labels under <code>/public/labels/synthetic/</code> and <code>/public/labels/actual/</code>.
            No image upload required.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
                Select image files
                <input
                  ref={imageInputRef}
                  type="file"
                  hidden
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    const map: Record<string, File> = { ...uploadedImages };
                    for (const f of files) map[f.name] = f;
                    onUploadedImagesChange(map);
                    if (imageInputRef.current) imageInputRef.current.value = '';
                  }}
                />
              </Button>
              {imageNames.length > 0 && (
                <Chip
                  label={`${imageNames.length} image${imageNames.length === 1 ? '' : 's'} loaded`}
                  color="primary"
                  onDelete={() => onUploadedImagesChange({})}
                />
              )}
              {rows.length > 0 && imageNames.length > 0 && (
                <Chip
                  label={`${rows.filter((r) => uploadedImages[r.imageFilename]).length}/${rows.length} matched to manifest`}
                  color={rows.every((r) => uploadedImages[r.imageFilename]) ? 'success' : 'warning'}
                  variant="outlined"
                />
              )}
            </Stack>
            {imageNames.length > 0 && (
              <Box className="batch-image-source-chip-grid">
                {imageNames.map((name) => {
                  const matched = rows.length > 0 && rows.some(
                    (r) => r.imageFilename === name || r.backImageFilename === name,
                  );
                  return (
                    <Chip
                      key={name}
                      label={name}
                      size="small"
                      variant="outlined"
                      color={rows.length === 0 ? 'default' : matched ? 'success' : 'warning'}
                      onDelete={() => {
                        const next = { ...uploadedImages };
                        delete next[name];
                        onUploadedImagesChange(next);
                      }}
                    />
                  );
                })}
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              {imageNames.length === 0
                ? 'Select the label images referenced in your manifest. Files are matched to rows by filename.'
                : rows.length === 0
                  ? 'Images loaded. Now paste or upload a manifest above so filenames can be matched.'
                  : 'Green chips are matched to a manifest row. Remove unneeded images with the x button.'}
            </Typography>
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
