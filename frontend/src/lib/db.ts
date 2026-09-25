import path from 'path';

let db: any = null;

export function getDb() {
  if (db) return db;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { createClient } = require('@supabase/supabase-js');
    db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    return db;
  }

  // VMSS preview only — Supabase env vars are absent.
  const Database = require('better-sqlite3');
  const file = process.env.SQLITE_DB_FILE || path.join('/tmp', 'app.db');
  db = new Database(file);
  if (file !== ':memory:') db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      company TEXT,
      address TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNumber TEXT NOT NULL UNIQUE,
      clientId INTEGER NULL REFERENCES clients(id) ON DELETE SET NULL,
      issueDate TEXT NOT NULL,
      dueDate TEXT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      currency TEXT NOT NULL DEFAULT 'USD',
      taxRate REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL DEFAULT 0,
      taxAmount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unitPrice REAL NOT NULL DEFAULT 0,
      amount REAL NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      UNIQUE (invoiceId, position)
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM clients').get();
  if (count.c === 0 && process.env.SQLITE_SKIP_SEED !== 'true') {
    const insC = db.prepare('INSERT INTO clients (email, name, phone, company, address, notes) VALUES (?,?,?,?,?,?)');
    const insI = db.prepare(`INSERT INTO invoices (invoiceNumber, clientId, issueDate, dueDate, status, currency, taxRate, discount, subtotal, taxAmount, total, notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insIt = db.prepare('INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, amount, position) VALUES (?,?,?,?,?,?)');
    const seed = db.transaction(() => {
      const c1 = insC.run('billing@acme.example', 'Jane Cooper', '+1 555 0101', 'Acme Corp', '12 Market St, San Francisco, CA', 'Net 30 terms').lastInsertRowid;
      const c2 = insC.run('ap@globex.example', 'Robert Fox', '+1 555 0102', 'Globex Ltd', '88 Harbor Rd, Boston, MA', null).lastInsertRowid;
      const c3 = insC.run('finance@initech.example', 'Esther Howard', '+1 555 0103', 'Initech', '500 Office Park, Austin, TX', 'Prefers PDF invoices').lastInsertRowid;
      const c4 = insC.run('hello@umbrella.example', 'Cody Fisher', '+1 555 0104', 'Umbrella Studio', '7 Elm Ave, Seattle, WA', null).lastInsertRowid;
      const i1 = insI.run('INV-1001', c1, '2025-01-05', '2025-02-04', 'paid', 'USD', 10, 0, 2500, 250, 2750, 'Thank you for your business.').lastInsertRowid;
      const i2 = insI.run('INV-1002', c2, '2025-02-10', '2025-03-12', 'sent', 'USD', 8, 100, 1800, 136, 1836, null).lastInsertRowid;
      const i3 = insI.run('INV-1003', c3, '2024-12-01', '2024-12-31', 'overdue', 'USD', 0, 0, 960, 0, 960, 'Second reminder sent.').lastInsertRowid;
      const i4 = insI.run('INV-1004', c4, '2025-03-01', '2025-03-31', 'draft', 'USD', 5, 0, 400, 20, 420, null).lastInsertRowid;
      insIt.run(i1, 'Website redesign', 1, 2000, 2000, 0);
      insIt.run(i1, 'Hosting (12 months)', 12, 41.67, 500, 1);
      insIt.run(i2, 'Consulting hours', 12, 150, 1800, 0);
      insIt.run(i3, 'Logo design', 1, 960, 960, 0);
      insIt.run(i4, 'Photography session', 2, 200, 400, 0);
    });
    seed();
  }

  return db;
}

export function isSupabase(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

// Test helper: reset cached connection.
export function __resetDb() {
  if (db && typeof db.close === 'function') db.close();
  db = null;
}