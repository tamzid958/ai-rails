-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "alertWebhookUrl" TEXT;

-- CreateIndex
CREATE INDEX "ApiKey_key_isActive_idx" ON "ApiKey"("key", "isActive");
