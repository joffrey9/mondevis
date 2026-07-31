-- AlterTable
ALTER TABLE "Facture" ADD COLUMN "clientId" TEXT;

-- CreateIndex
CREATE INDEX "Facture_clientId_idx" ON "Facture"("clientId");
