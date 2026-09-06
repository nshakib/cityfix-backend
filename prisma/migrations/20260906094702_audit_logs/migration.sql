-- CreateTable
CREATE TABLE "complaint_status_logs" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "oldStatus" "ComplaintStatus",
    "newStatus" "ComplaintStatus" NOT NULL,
    "performedBy" TEXT NOT NULL,
    "note" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "complaint_status_logs_complaintId_idx" ON "complaint_status_logs"("complaintId");

-- CreateIndex
CREATE INDEX "complaint_status_logs_performedBy_idx" ON "complaint_status_logs"("performedBy");

-- AddForeignKey
ALTER TABLE "complaint_status_logs" ADD CONSTRAINT "complaint_status_logs_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
