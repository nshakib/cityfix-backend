/*
  Warnings:

  - The values [CONFIRMED] on the enum `ComplaintStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ComplaintStatus_new" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'REJECTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'DISPUTED', 'CLOSED');
ALTER TABLE "public"."complaints" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "complaint_status_logs" ALTER COLUMN "oldStatus" TYPE "ComplaintStatus_new" USING ("oldStatus"::text::"ComplaintStatus_new");
ALTER TABLE "complaint_status_logs" ALTER COLUMN "newStatus" TYPE "ComplaintStatus_new" USING ("newStatus"::text::"ComplaintStatus_new");
ALTER TABLE "complaints" ALTER COLUMN "status" TYPE "ComplaintStatus_new" USING ("status"::text::"ComplaintStatus_new");
ALTER TYPE "ComplaintStatus" RENAME TO "ComplaintStatus_old";
ALTER TYPE "ComplaintStatus_new" RENAME TO "ComplaintStatus";
DROP TYPE "public"."ComplaintStatus_old";
ALTER TABLE "complaints" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;
