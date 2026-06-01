CREATE TYPE "ClientStatus" AS ENUM ('LEAD', 'ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "ServiceBillingMode" AS ENUM ('ONE_TIME', 'RECURRING');
CREATE TYPE "ClientServiceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'STRIPE', 'CASH', 'OTHER');

CREATE TABLE "BusinessClient" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "companyName" TEXT,
  "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "billingName" TEXT,
  "billingEmail" TEXT,
  "billingAddressLine1" TEXT,
  "billingAddressLine2" TEXT,
  "postalCode" TEXT,
  "city" TEXT,
  "country" TEXT NOT NULL DEFAULT 'DE',
  "vatId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BusinessClient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientContact" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "role" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceOffering" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unitPriceCents" INTEGER NOT NULL,
  "taxRateBps" INTEGER NOT NULL DEFAULT 1900,
  "billingMode" "ServiceBillingMode" NOT NULL DEFAULT 'ONE_TIME',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ServiceOffering_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientService" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "serviceId" TEXT,
  "title" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPriceCents" INTEGER NOT NULL,
  "taxRateBps" INTEGER NOT NULL DEFAULT 1900,
  "billingInterval" TEXT NOT NULL DEFAULT 'monthly',
  "status" "ClientServiceStatus" NOT NULL DEFAULT 'ACTIVE',
  "nextInvoiceDate" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClientService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "servicePeriodStart" TIMESTAMP(3),
  "servicePeriodEnd" TIMESTAMP(3),
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  "taxCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "sentAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvoiceItem" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "serviceId" TEXT,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPriceCents" INTEGER NOT NULL,
  "taxRateBps" INTEGER NOT NULL DEFAULT 1900,
  "lineNetCents" INTEGER NOT NULL,
  "lineTaxCents" INTEGER NOT NULL,
  "lineGrossCents" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
  "reference" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceOffering_name_key" ON "ServiceOffering"("name");
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE INDEX "BusinessClient_status_idx" ON "BusinessClient"("status");
CREATE INDEX "BusinessClient_name_idx" ON "BusinessClient"("name");
CREATE INDEX "ClientContact_clientId_idx" ON "ClientContact"("clientId");
CREATE INDEX "ClientContact_email_idx" ON "ClientContact"("email");
CREATE INDEX "ServiceOffering_isActive_idx" ON "ServiceOffering"("isActive");
CREATE INDEX "ServiceOffering_billingMode_idx" ON "ServiceOffering"("billingMode");
CREATE INDEX "ClientService_clientId_idx" ON "ClientService"("clientId");
CREATE INDEX "ClientService_serviceId_idx" ON "ClientService"("serviceId");
CREATE INDEX "ClientService_status_nextInvoiceDate_idx" ON "ClientService"("status", "nextInvoiceDate");
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_issueDate_idx" ON "Invoice"("issueDate");
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX "InvoiceItem_serviceId_idx" ON "InvoiceItem"("serviceId");
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");

ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BusinessClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BusinessClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientService" ADD CONSTRAINT "ClientService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "BusinessClient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ServiceOffering"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
