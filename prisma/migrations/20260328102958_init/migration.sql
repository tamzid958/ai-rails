-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'LEAD', 'MEMBER');

-- CreateEnum
CREATE TYPE "CaptureMethod" AS ENUM ('GATEWAY', 'COMMIT_TAG', 'HEURISTIC');

-- CreateEnum
CREATE TYPE "PrStatus" AS ENUM ('OPENED', 'REVIEW_IN_PROGRESS', 'CHANGES_REQUESTED', 'APPROVED', 'MERGED', 'CLOSED', 'REVERTED');

-- CreateEnum
CREATE TYPE "DataRichness" AS ENUM ('NONE', 'HEURISTIC', 'TAGGED', 'FULL');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "allowedModels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultModel" TEXT,
    "costAlertDaily" DOUBLE PRECISION,
    "costAlertEngineer" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engineer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gitUsername" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engineer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMembership" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repo" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'github',
    "webhookActive" BOOLEAN NOT NULL DEFAULT false,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiActivity" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "captureMethod" "CaptureMethod" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "tool" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "taskType" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "promptSnippet" TEXT,
    "responseSnippet" TEXT,
    "branchName" TEXT,
    "commitSha" TEXT,
    "repoFullName" TEXT,
    "promptTemplateId" TEXT,
    "gatewayRequestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isBase" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "engineerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "branchName" TEXT NOT NULL,
    "title" TEXT,
    "engineerId" TEXT,
    "status" "PrStatus" NOT NULL DEFAULT 'OPENED',
    "reviewCycles" INTEGER NOT NULL DEFAULT 0,
    "linesAdded" INTEGER,
    "linesRemoved" INTEGER,
    "filesChanged" INTEGER,
    "aiActivitiesCount" INTEGER NOT NULL DEFAULT 0,
    "aiToolsUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dataRichness" "DataRichness" NOT NULL DEFAULT 'NONE',
    "openedAt" TIMESTAMP(3),
    "firstReviewAt" TIMESTAMP(3),
    "mergedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "engineerId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "toolsGenerated" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "backupsCreated" INTEGER NOT NULL DEFAULT 0,
    "configHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Engineer_email_key" ON "Engineer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Engineer_gitUsername_key" ON "Engineer"("gitUsername");

-- CreateIndex
CREATE INDEX "ProductMembership_engineerId_idx" ON "ProductMembership"("engineerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMembership_productId_engineerId_key" ON "ProductMembership"("productId", "engineerId");

-- CreateIndex
CREATE UNIQUE INDEX "Repo_fullName_key" ON "Repo"("fullName");

-- CreateIndex
CREATE INDEX "Repo_productId_idx" ON "Repo"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_productId_idx" ON "ApiKey"("productId");

-- CreateIndex
CREATE INDEX "ApiKey_engineerId_idx" ON "ApiKey"("engineerId");

-- CreateIndex
CREATE INDEX "AiActivity_productId_engineerId_createdAt_idx" ON "AiActivity"("productId", "engineerId", "createdAt");

-- CreateIndex
CREATE INDEX "AiActivity_productId_captureMethod_idx" ON "AiActivity"("productId", "captureMethod");

-- CreateIndex
CREATE INDEX "AiActivity_productId_engineerId_branchName_idx" ON "AiActivity"("productId", "engineerId", "branchName");

-- CreateIndex
CREATE INDEX "AiActivity_productId_promptTemplateId_idx" ON "AiActivity"("productId", "promptTemplateId");

-- CreateIndex
CREATE INDEX "PromptTemplate_productId_taskType_idx" ON "PromptTemplate"("productId", "taskType");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_productId_taskType_engineerId_isBase_key" ON "PromptTemplate"("productId", "taskType", "engineerId", "isBase");

-- CreateIndex
CREATE UNIQUE INDEX "PrEvent_externalId_key" ON "PrEvent"("externalId");

-- CreateIndex
CREATE INDEX "PrEvent_productId_engineerId_branchName_idx" ON "PrEvent"("productId", "engineerId", "branchName");

-- CreateIndex
CREATE INDEX "PrEvent_productId_status_idx" ON "PrEvent"("productId", "status");

-- CreateIndex
CREATE INDEX "PrEvent_productId_dataRichness_idx" ON "PrEvent"("productId", "dataRichness");

-- CreateIndex
CREATE INDEX "Recommendation_productId_engineerId_idx" ON "Recommendation"("productId", "engineerId");

-- CreateIndex
CREATE INDEX "SyncEvent_productId_idx" ON "SyncEvent"("productId");

-- AddForeignKey
ALTER TABLE "ProductMembership" ADD CONSTRAINT "ProductMembership_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMembership" ADD CONSTRAINT "ProductMembership_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repo" ADD CONSTRAINT "Repo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiActivity" ADD CONSTRAINT "AiActivity_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiActivity" ADD CONSTRAINT "AiActivity_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiActivity" ADD CONSTRAINT "AiActivity_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrEvent" ADD CONSTRAINT "PrEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncEvent" ADD CONSTRAINT "SyncEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncEvent" ADD CONSTRAINT "SyncEvent_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
