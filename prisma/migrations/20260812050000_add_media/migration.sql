CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Media_contentId_idx" ON "Media"("contentId");

ALTER TABLE "Media"
ADD CONSTRAINT "Media_contentId_fkey"
FOREIGN KEY ("contentId") REFERENCES "Content"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
