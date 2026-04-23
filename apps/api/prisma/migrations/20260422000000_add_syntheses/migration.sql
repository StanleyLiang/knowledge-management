-- CreateEnum
CREATE TYPE "SynthesisStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EDITED');

-- CreateTable
CREATE TABLE "page_embeddings" (
    "page_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "vector" DOUBLE PRECISION[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_embeddings_pkey" PRIMARY KEY ("page_id")
);

-- CreateTable
CREATE TABLE "syntheses" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "contradictions" TEXT NOT NULL,
    "open_questions" TEXT NOT NULL,
    "cluster_key" TEXT NOT NULL,
    "status" "SynthesisStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "syntheses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "synthesis_sources" (
    "synthesis_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "snippet" TEXT,

    CONSTRAINT "synthesis_sources_pkey" PRIMARY KEY ("synthesis_id","page_id")
);

-- CreateIndex
CREATE INDEX "syntheses_space_id_idx" ON "syntheses"("space_id");

-- CreateIndex
CREATE INDEX "syntheses_cluster_key_idx" ON "syntheses"("cluster_key");

-- CreateIndex
CREATE INDEX "synthesis_sources_page_id_idx" ON "synthesis_sources"("page_id");

-- AddForeignKey
ALTER TABLE "page_embeddings" ADD CONSTRAINT "page_embeddings_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syntheses" ADD CONSTRAINT "syntheses_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synthesis_sources" ADD CONSTRAINT "synthesis_sources_synthesis_id_fkey" FOREIGN KEY ("synthesis_id") REFERENCES "syntheses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synthesis_sources" ADD CONSTRAINT "synthesis_sources_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
