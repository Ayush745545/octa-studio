-- PublishingChannel and Publication already exist in the development
-- database. This migration records their expected structure and adds
-- the new publishing credential fields.

ALTER TABLE "PublishingChannel"
ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "externalId" TEXT;
