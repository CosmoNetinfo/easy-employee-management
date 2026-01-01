-- Migration: Add Payment Model
-- Created: 2026-01-02
-- Description: Aggiunge la tabella Payment per tracciare i pagamenti ai dipendenti

-- Create Payment table
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" SERIAL PRIMARY KEY,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create index on userId for better query performance
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
