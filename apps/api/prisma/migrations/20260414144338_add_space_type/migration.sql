-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('PERSONAL', 'TEAM', 'OFFICIAL');

-- AlterTable
ALTER TABLE "spaces" ADD COLUMN     "type" "SpaceType" NOT NULL DEFAULT 'TEAM';
