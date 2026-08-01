-- CreateTable
CREATE TABLE "SalesEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "medium" TEXT NOT NULL DEFAULT 'none',
    "campaign" TEXT NOT NULL DEFAULT 'none',
    "experimentId" TEXT,
    "experimentVariant" TEXT,
    "quantity" INTEGER,
    "value" DECIMAL(12,2),
    "currency" CHAR(3),
    "externalEventId" TEXT,
    "evidenceSource" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutAttribution" (
    "cartHash" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutAttribution_pkey" PRIMARY KEY ("cartHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesEvent_externalEventId_key" ON "SalesEvent"("externalEventId");
CREATE INDEX "SalesEvent_eventType_createdAt_idx" ON "SalesEvent"("eventType", "createdAt");
CREATE INDEX "SalesEvent_sessionHash_createdAt_idx" ON "SalesEvent"("sessionHash", "createdAt");
CREATE INDEX "SalesEvent_productId_createdAt_idx" ON "SalesEvent"("productId", "createdAt");
CREATE INDEX "SalesEvent_source_medium_campaign_idx" ON "SalesEvent"("source", "medium", "campaign");
CREATE INDEX "CheckoutAttribution_sessionHash_idx" ON "CheckoutAttribution"("sessionHash");
CREATE INDEX "CheckoutAttribution_expiresAt_idx" ON "CheckoutAttribution"("expiresAt");
