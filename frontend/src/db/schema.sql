-- Billcraft schema (PostgreSQL / Supabase)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  company VARCHAR(255),
  address TEXT,
  notes TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  "invoiceNumber" VARCHAR(50) NOT NULL UNIQUE,
  "clientId" INTEGER NULL REFERENCES clients(id) ON DELETE SET NULL,
  "issueDate" DATE NOT NULL,
  "dueDate" DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  "taxRate" NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  "taxAmount" NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  "invoiceId" INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  "unitPrice" NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE ("invoiceId", position)
);

CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices("clientId");
CREATE INDEX IF NOT EXISTS idx_items_invoice ON invoice_items("invoiceId");