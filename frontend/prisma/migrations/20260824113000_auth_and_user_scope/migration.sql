-- Add auth user table
CREATE TABLE IF NOT EXISTS "User" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add nullable user foreign keys to content tables for gradual rollout
ALTER TABLE "Movie" ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "Series" ADD COLUMN IF NOT EXISTS "userId" INTEGER;
ALTER TABLE "WatchHistory" ADD COLUMN IF NOT EXISTS "userId" INTEGER;

-- Drop old global tmdb uniques (we now scope uniqueness by userId)
DROP INDEX IF EXISTS "Movie_tmdbId_key";
DROP INDEX IF EXISTS "Series_tmdbId_key";

-- Per-user uniques and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Movie_userId_tmdbId_key" ON "Movie"("userId", "tmdbId");
CREATE UNIQUE INDEX IF NOT EXISTS "Series_userId_tmdbId_key" ON "Series"("userId", "tmdbId");
CREATE INDEX IF NOT EXISTS "Movie_userId_idx" ON "Movie"("userId");
CREATE INDEX IF NOT EXISTS "Series_userId_idx" ON "Series"("userId");
CREATE INDEX IF NOT EXISTS "WatchHistory_userId_idx" ON "WatchHistory"("userId");

-- Foreign keys
ALTER TABLE "Movie"
  ADD CONSTRAINT "Movie_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Series"
  ADD CONSTRAINT "Series_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WatchHistory"
  ADD CONSTRAINT "WatchHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
