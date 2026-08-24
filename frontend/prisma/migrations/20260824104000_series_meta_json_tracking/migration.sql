-- Move series tracking fields into one JSONB column.
ALTER TABLE "Series"
ADD COLUMN "seriesMeta" JSONB;

-- Backfill existing progress fields into the new JSON structure.
UPDATE "Series"
SET "seriesMeta" = jsonb_strip_nulls(
  jsonb_build_object(
    'totalEpisodes', "totalEps",
    'progress', jsonb_strip_nulls(
      jsonb_build_object(
        'currentSeason', "currentSeason",
        'currentEpisode', "currentEp"
      )
    )
  )
)
WHERE "currentSeason" IS NOT NULL OR "currentEp" IS NOT NULL OR "totalEps" IS NOT NULL;

ALTER TABLE "Series"
DROP COLUMN "currentSeason",
DROP COLUMN "currentEp",
DROP COLUMN "totalEps";
