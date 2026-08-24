-- Add optional notes fields for user annotations on movies and series
ALTER TABLE "Movie"
ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "Series"
ADD COLUMN IF NOT EXISTS "notes" TEXT;
