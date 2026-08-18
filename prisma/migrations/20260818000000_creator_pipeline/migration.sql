-- Creator Studio durable pipeline models.
-- NOTE: the development database was provisioned via `prisma db push`, so the
-- migration history is not perfectly tracked. This file records the DDL that
-- brings a fresh database in line with the Creator Studio pipeline feature.

CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'READY_FOR_REVIEW', 'APPROVED', 'SCHEDULED', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');
CREATE TYPE "ClipStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'APPROVED', 'SCHEDULED', 'FAILED', 'REJECTED');

-- ContentJob -----------------------------------------------------------------
CREATE TABLE "ContentJob" (
  "id" text NOT NULL,
  "sourceMediaId" text,
  "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
  "progress" integer NOT NULL DEFAULT 0,
  "currentStage" text,
  "error" text,
  "errorMessage" text,
  "retryCount" integer NOT NULL DEFAULT 0,
  "lockedAt" timestamp(3),
  "workerId" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentJob_status_idx" ON "ContentJob"("status");
CREATE INDEX "ContentJob_sourceMediaId_idx" ON "ContentJob"("sourceMediaId");

-- PipelineStage --------------------------------------------------------------
CREATE TABLE "PipelineStage" (
  "id" text NOT NULL,
  "jobId" text NOT NULL,
  "name" text NOT NULL,
  "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
  "progress" integer NOT NULL DEFAULT 0,
  "error" text,
  "retryCount" integer NOT NULL DEFAULT 0,
  "startedAt" timestamp(3),
  "completedAt" timestamp(3),
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PipelineStage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ContentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PipelineStage_jobId_idx" ON "PipelineStage"("jobId");

-- ContentClip ----------------------------------------------------------------
CREATE TABLE "ContentClip" (
  "id" text NOT NULL,
  "jobId" text NOT NULL,
  "position" integer NOT NULL DEFAULT 0,
  "index" integer NOT NULL DEFAULT 0,
  "sourceStart" double precision NOT NULL DEFAULT 0,
  "sourceEnd" double precision NOT NULL DEFAULT 0,
  "score" integer NOT NULL DEFAULT 0,
  "hook" text,
  "transcript" text,
  "category" text,
  "title" text,
  "caption" text,
  "captionStyle" text,
  "hashtags" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "platforms" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "recommendedTime" text,
  "status" "ClipStatus" NOT NULL DEFAULT 'PENDING',
  "error" text,
  "generatedMediaId" text,
  "hasCaptions" boolean NOT NULL DEFAULT false,
  "contentId" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentClip_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContentClip_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ContentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ContentClip_jobId_idx" ON "ContentClip"("jobId");

-- ContentBundle --------------------------------------------------------------
CREATE TABLE "ContentBundle" (
  "id" text NOT NULL,
  "clipId" text NOT NULL,
  "jobId" text NOT NULL,
  "title" text,
  "hook" text,
  "caption" text,
  "hashtags" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "thumbnail" text,
  "score" integer NOT NULL DEFAULT 0,
  "status" text NOT NULL DEFAULT 'DRAFT',
  "platformRecs" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "contentId" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentBundle_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContentBundle_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "ContentClip"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContentBundle_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ContentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContentBundle_clipId_unique" UNIQUE ("clipId")
);
CREATE INDEX "ContentBundle_jobId_idx" ON "ContentBundle"("jobId");

-- GeneratedAsset -------------------------------------------------------------
CREATE TABLE "GeneratedAsset" (
  "id" text NOT NULL,
  "jobId" text NOT NULL,
  "kind" text NOT NULL,
  "clipId" text,
  "url" text NOT NULL,
  "filename" text,
  "mimeType" text,
  "size" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GeneratedAsset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GeneratedAsset_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ContentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "GeneratedAsset_jobId_idx" ON "GeneratedAsset"("jobId");
CREATE INDEX "GeneratedAsset_clipId_idx" ON "GeneratedAsset"("clipId");
