/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "PaymentGateway" ADD VALUE 'STRIPE';

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "gateway" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentId_key" ON "payments"("paymentId");
