-- PublishingChannel and Publication were originally created via `db push`;
-- this migration records their full structure so the migration history can
-- replay on a clean database (e.g. the shadow database), and adds the
-- publishing credential fields. All statements are idempotent.

-- CreateTable
CREATE TABLE IF NOT EXISTS "PublishingChannel" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "accountName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishingChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PublishingChannel_platform_key" ON "PublishingChannel"("platform");

-- CreateTable
CREATE TABLE IF NOT EXISTS "Publication" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "error" TEXT,
    "executionTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Publication_contentId_channelId_key" ON "Publication"("contentId", "channelId");

-- AddForeignKey (Publication already exists in the development database)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Publication_contentId_fkey') THEN
        ALTER TABLE "Publication" ADD CONSTRAINT "Publication_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Publication_channelId_fkey') THEN
        ALTER TABLE "Publication" ADD CONSTRAINT "Publication_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "PublishingChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- AlterTable: publishing credential fields (idempotent)
ALTER TABLE "PublishingChannel"
ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "externalId" TEXT,
ADD COLUMN IF NOT EXISTS "authorUrn" TEXT;

-- AlterTable: Content.publishedAt was added via `db push` before migration history existed
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);

-- AlterTable: Media.contentId became optional (unattached library uploads)
ALTER TABLE "Media" ALTER COLUMN "contentId" DROP NOT NULL;
