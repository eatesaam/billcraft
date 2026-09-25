INSERT INTO clients (email, name, phone, company, address, notes) VALUES
  ('billing@acme.example', 'Jane Cooper', '+1 555 0101', 'Acme Corp', '12 Market St, San Francisco, CA', 'Net 30 terms'),
  ('ap@globex.example', 'Robert Fox', '+1 555 0102', 'Globex Ltd', '88 Harbor Rd, Boston, MA', NULL),
  ('finance@initech.example', 'Esther Howard', '+1 555 0103', 'Initech', '500 Office Park, Austin, TX', 'Prefers PDF invoices'),
  ('hello@umbrella.example', 'Cody Fisher', '+1 555 0104', 'Umbrella Studio', '7 Elm Ave, Seattle, WA', NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO invoices ("invoiceNumber", "clientId", "issueDate", "dueDate", status, currency, "taxRate", discount, subtotal, "taxAmount", total, notes)
SELECT 'INV-1001', id, DATE '2025-01-05', DATE '2025-02-04', 'paid', 'USD', 10, 0, 2500, 250, 2750, 'Thank you for your business.' FROM clients WHERE email = 'billing@acme.example'
ON CONFLICT ("invoiceNumber") DO NOTHING;
INSERT INTO invoices ("invoiceNumber", "clientId", "issueDate", "dueDate", status, currency, "taxRate", discount, subtotal, "taxAmount", total, notes)
SELECT 'INV-1002', id, DATE '2025-02-10', DATE '2025-03-12', 'sent', 'USD', 8, 100, 1800, 136, 1836, NULL FROM clients WHERE email = 'ap@globex.example'
ON CONFLICT ("invoiceNumber") DO NOTHING;
INSERT INTO invoices ("invoiceNumber", "clientId", "issueDate", "dueDate", status, currency, "taxRate", discount, subtotal, "taxAmount", total, notes)
SELECT 'INV-1003', id, DATE '2024-12-01', DATE '2024-12-31', 'overdue', 'USD', 0, 0, 960, 0, 960, 'Second reminder sent.' FROM clients WHERE email = 'finance@initech.example'
ON CONFLICT ("invoiceNumber") DO NOTHING;
INSERT INTO invoices ("invoiceNumber", "clientId", "issueDate", "dueDate", status, currency, "taxRate", discount, subtotal, "taxAmount", total, notes)
SELECT 'INV-1004', id, DATE '2025-03-01', DATE '2025-03-31', 'draft', 'USD', 5, 0, 400, 20, 420, NULL FROM clients WHERE email = 'hello@umbrella.example'
ON CONFLICT ("invoiceNumber") DO NOTHING;

INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Website redesign', 1, 2000, 2000, 0 FROM invoices WHERE "invoiceNumber" = 'INV-1001' ON CONFLICT ("invoiceId", position) DO NOTHING;
INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Hosting (12 months)', 12, 41.67, 500, 1 FROM invoices WHERE "invoiceNumber" = 'INV-1001' ON CONFLICT ("invoiceId", position) DO NOTHING;
INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Consulting hours', 12, 150, 1800, 0 FROM invoices WHERE "invoiceNumber" = 'INV-1002' ON CONFLICT ("invoiceId", position) DO NOTHING;
INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Logo design', 1, 960, 960, 0 FROM invoices WHERE "invoiceNumber" = 'INV-1003' ON CONFLICT ("invoiceId", position) DO NOTHING;
INSERT INTO invoice_items ("invoiceId", description, quantity, "unitPrice", amount, position)
SELECT id, 'Photography session', 2, 200, 400, 0 FROM invoices WHERE "invoiceNumber" = 'INV-1004' ON CONFLICT ("invoiceId", position) DO NOTHING;