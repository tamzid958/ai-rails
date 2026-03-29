-- AlterTable: AI Policy enforcement fields
ALTER TABLE "Product" ADD COLUMN     "allowedTools" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "gatewayRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minTaggingRate" DOUBLE PRECISION,
ADD COLUMN     "spendCapDaily" DOUBLE PRECISION,
ADD COLUMN     "spendCapMonthly" DOUBLE PRECISION;

-- AlterTable: Member activation tracking
ALTER TABLE "ProductMembership" ADD COLUMN     "activationStatus" TEXT NOT NULL DEFAULT 'INVITED',
ADD COLUMN     "starterKeyId" TEXT;
