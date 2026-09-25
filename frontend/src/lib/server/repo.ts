import { getDb, isSupabase } from '../db';
import { HttpError } from './http';
import { ClientInput, InvoiceInput, computeTotals, INVOICE_STATUSES } from './validation';

const n = (v: any) => (v === null || v === undefined ? 0 : Number(v));
const d = (v: any) => (v ? String(v).slice(0, 10) : null);
const ts = (v: any) => (v ? new Date(v).toISOString() : new Date().toISOString());

function sbCheck(error: any) {
  if (!error) return;
  if (error.code === '23505') throw new HttpError(409, 'A record with this unique value already exists');
  throw new Error(error.message || 'Database error');
}

function sqliteUnique(err: any): never {
  if (String(err?.code || '').startsWith('SQLITE_CONSTRAINT_UNIQUE')) {
    throw new HttpError(409, 'A record with this unique value already exists');
  }
  throw err;
}

function mapClient(r: any) {
  return {
    id: Number(r.id),
    name: r.name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    company: r.company ?? null,
    address: r.address ?? null,
    notes: r.notes ?? null,
    createdAt: ts(r.createdAt),
  };
}

function mapItem(r: any) {
  return {
    id: Number(r.id),
    description: r.description,
    quantity: n(r.quantity),
    unitPrice: n(r.unitPrice),
    amount: n(r.amount),
    position: Number(r.position),
  };
}

function mapInvoiceFull(r: any, items: any[]) {
  return {
    id: Number(r.id),
    invoiceNumber: r.invoiceNumber,
    clientId: r.clientId === null || r.clientId === undefined ? null : Number(r.clientId),
    issueDate: d(r.issueDate) as string,
    dueDate: d(r.dueDate),
    status: r.status,
    currency: r.currency,
    taxRate: n(r.taxRate),
    discount: n(r.discount),
    subtotal: n(r.subtotal),
    taxAmount: n(r.taxAmount),
    total: n(r.total),
    notes: r.notes ?? null,
    createdAt: ts(r.createdAt),
    updatedAt: ts(r.updatedAt),
    items: items.map(mapItem).sort((a, b) => a.position - b.position),
  };
}

/* ---------------- Clients ---------------- */

export async function listClients(search?: string) {
  const db = getDb();
  const s = (search || '').trim();
  if (isSupabase()) {
    let q = db.from('clients').select('*').order('createdAt', { ascending: false });
    if (s) {
      const safe = s.replace(/[,()%*\\]/g, ' ');
      q = q.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%`);
    }
    const { data, error } = await q;
    sbCheck(error);
    const { data: inv, error: e2 } = await db.from('invoices').select('clientId');
    sbCheck(e2);
    const counts: Record<number, number> = {};
    (inv || []).forEach((i: any) => {
      if (i.clientId != null) counts[i.clientId] = (counts[i.clientId] || 0) + 1;
    });
    return (data || []).map((r: any) => ({ ...mapClient(r), invoiceCount: counts[r.id] || 0 }));
  }
  const like = `%${s}%`;
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM invoices i WHERE i.clientId = c.id) AS invoiceCount
       FROM clients c
       WHERE (? = '' OR c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)
       ORDER BY c.createdAt DESC, c.id DESC`
    )
    .all(s, like, like, like);
  return rows.map((r: any) => ({ ...mapClient(r), invoiceCount: Number(r.invoiceCount) }));
}

export async function getClient(id: number) {
  const db = getDb();
  let client: any;
  let invoices: any[];
  if (isSupabase()) {
    const { data, error } = await db.from('clients').select('*').eq('id', id).maybeSingle();
    sbCheck(error);
    client = data;
    if (!client) throw new HttpError(404, 'Client not found');
    const res = await db
      .from('invoices')
      .select('id, invoiceNumber, issueDate, dueDate, status, total')
      .eq('clientId', id)
      .order('issueDate', { ascending: false });
    sbCheck(res.error);
    invoices = res.data || [];
  } else {
    client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) throw new HttpError(404, 'Client not found');
    invoices = db
      .prepare('SELECT id, invoiceNumber, issueDate, dueDate, status, total FROM invoices WHERE clientId = ? ORDER BY issueDate DESC')
      .all(id);
  }
  return {
    ...mapClient(client),
    invoices: invoices.map((i: any) => ({
      id: Number(i.id),
      invoiceNumber: i.invoiceNumber,
      issueDate: d(i.issueDate) as string,
      dueDate: d(i.dueDate),
      status: i.status,
      total: n(i.total),
    })),
  };
}

export async function createClient(input: ClientInput) {
  const db = getDb();
  if (isSupabase()) {
    const { data, error } = await db.from('clients').insert(input).select('*').single();
    sbCheck(error);
    return mapClient(data);
  }
  try {
    const info = db
      .prepare('INSERT INTO clients (name, email, phone, company, address, notes) VALUES (?,?,?,?,?,?)')
      .run(input.name, input.email, input.phone, input.company, input.address, input.notes);
    return mapClient(db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid));
  } catch (e) {
    sqliteUnique(e);
  }
}

export async function updateClient(id: number, input: ClientInput) {
  const db = getDb();
  if (isSupabase()) {
    const { data, error } = await db.from('clients').update(input).eq('id', id).select('*').maybeSingle();
    sbCheck(error);
    if (!data) throw new HttpError(404, 'Client not found');
    return mapClient(data);
  }
  try {
    const info = db
      .prepare('UPDATE clients SET name=?, email=?, phone=?, company=?, address=?, notes=? WHERE id=?')
      .run(input.name, input.email, input.phone, input.company, input.address, input.notes, id);
    if (info.changes === 0) throw new HttpError(404, 'Client not found');
    return mapClient(db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    sqliteUnique(e);
  }
}

export async function deleteClient(id: number) {
  const db = getDb();
  if (isSupabase()) {
    const { data, error } = await db.from('clients').delete().eq('id', id).select('id');
    sbCheck(error);
    if (!data || data.length === 0) throw new HttpError(404, 'Client not found');
  } else {
    const info = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    if (info.changes === 0) throw new HttpError(404, 'Client not found');
  }
  return { id, success: true };
}

async function assertClientExists(clientId: number | null) {
  if (clientId === null) return;
  const db = getDb();
  let found: any;
  if (isSupabase()) {
    const { data, error } = await db.from('clients').select('id').eq('id', clientId).maybeSingle();
    sbCheck(error);
    found = data;
  } else {
    found = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
  }
  if (!found) throw new HttpError(400, 'clientId does not reference an existing client');
}

/* ---------------- Invoices ---------------- */

export async function listInvoices(filters: { status?: string; clientId?: number }) {
  const db = getDb();
  let rows: any[];
  const names: Record<number, string> = {};
  if (isSupabase()) {
    let q = db
      .from('invoices')
      .select('id, invoiceNumber, clientId, issueDate, dueDate, status, currency, total')
      .order('issueDate', { ascending: false })
      .order('id', { ascending: false });
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.clientId) q = q.eq('clientId', filters.clientId);
    const { data, error } = await q;
    sbCheck(error);
    rows = data || [];
    const ids = Array.from(new Set(rows.map((r) => r.clientId).filter((x) => x != null)));
    if (ids.length) {
      const res = await db.from('clients').select('id, name').in('id', ids);
      sbCheck(res.error);
      (res.data || []).forEach((c: any) => (names[c.id] = c.name));
    }
    rows = rows.map((r) => ({ ...r, clientName: r.clientId != null ? names[r.clientId] ?? null : null }));
  } else {
    rows = db
      .prepare(
        `SELECT i.id, i.invoiceNumber, i.clientId, i.issueDate, i.dueDate, i.status, i.currency, i.total, c.name AS clientName
         FROM invoices i LEFT JOIN clients c ON c.id = i.clientId
         WHERE (? IS NULL OR i.status = ?) AND (? IS NULL OR i.clientId = ?)
         ORDER BY i.issueDate DESC, i.id DESC`
      )
      .all(filters.status ?? null, filters.status ?? null, filters.clientId ?? null, filters.clientId ?? null);
  }
  return rows.map((r: any) => ({
    id: Number(r.id),
    invoiceNumber: r.invoiceNumber,
    clientId: r.clientId == null ? null : Number(r.clientId),
    clientName: r.clientName ?? null,
    issueDate: d(r.issueDate) as string,
    dueDate: d(r.dueDate),
    status: r.status,
    currency: r.currency,
    total: n(r.total),
  }));
}

async function loadInvoice(id: number) {
  const db = getDb();
  if (isSupabase()) {
    const { data, error } = await db.from('invoices').select('*').eq('id', id).maybeSingle();
    sbCheck(error);
    if (!data) throw new HttpError(404, 'Invoice not found');
    const res = await db.from('invoice_items').select('*').eq('invoiceId', id).order('position');
    sbCheck(res.error);
    return mapInvoiceFull(data, res.data || []);
  }
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!inv) throw new HttpError(404, 'Invoice not found');
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoiceId = ? ORDER BY position').all(id);
  return mapInvoiceFull(inv, items);
}

export async function getInvoice(id: number) {
  const inv = await loadInvoice(id);
  let client: any = null;
  if (inv.clientId != null) {
    const db = getDb();
    let c: any;
    if (isSupabase()) {
      const { data, error } = await db.from('clients').select('id, name, email, company, address').eq('id', inv.clientId).maybeSingle();
      sbCheck(error);
      c = data;
    } else {
      c = db.prepare('SELECT id, name, email, company, address FROM clients WHERE id = ?').get(inv.clientId);
    }
    if (c) {
      client = { id: Number(c.id), name: c.name, email: c.email ?? null, company: c.company ?? null, address: c.address ?? null };
    }
  }
  return { ...inv, client };
}

async function nextInvoiceNumber(): Promise<string> {
  const db = getDb();
  let maxId = 0;
  if (isSupabase()) {
    const { data, error } = await db.from('invoices').select('id').order('id', { ascending: false }).limit(1);
    sbCheck(error);
    maxId = data && data[0] ? Number(data[0].id) : 0;
  } else {
    maxId = Number(db.prepare('SELECT COALESCE(MAX(id),0) AS m FROM invoices').get().m);
  }
  return `INV-${1001 + maxId}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export async function createInvoice(input: InvoiceInput) {
  await assertClientExists(input.clientId);
  const db = getDb();
  const { lines, subtotal, taxAmount, total } = computeTotals(input.items, input.taxRate, input.discount);
  const invoiceNumber = input.invoiceNumber || (await nextInvoiceNumber());
  const row = {
    invoiceNumber,
    clientId: input.clientId,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    status: input.status,
    currency: input.currency,
    taxRate: input.taxRate,
    discount: input.discount,
    subtotal,
    taxAmount,
    total,
    notes: input.notes,
  };
  if (isSupabase()) {
    const { data, error } = await db.from('invoices').insert(row).select('id').single();
    sbCheck(error);
    const invoiceId = data.id;
    const res = await db.from('invoice_items').insert(lines.map((l) => ({ ...l, invoiceId })));
    if (res.error) {
      await db.from('invoices').delete().eq('id', invoiceId);
      sbCheck(res.error);
    }
    return loadInvoice(invoiceId);
  }
  let newId: number = 0;
  try {
    const tx = db.transaction(() => {
      const info = db
        .prepare(`INSERT INTO invoices (invoiceNumber, clientId, issueDate, dueDate, status, currency, taxRate, discount, subtotal, taxAmount, total, notes)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(row.invoiceNumber, row.clientId, row.issueDate, row.dueDate, row.status, row.currency, row.taxRate, row.discount, subtotal, taxAmount, total, row.notes);
      newId = Number(info.lastInsertRowid);
      const ins = db.prepare('INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, amount, position) VALUES (?,?,?,?,?,?)');
      lines.forEach((l) => ins.run(newId, l.description, l.quantity, l.unitPrice, l.amount, l.position));
    });
    tx();
  } catch (e) {
    sqliteUnique(e);
  }
  return loadInvoice(newId);
}

export async function updateInvoice(id: number, input: InvoiceInput) {
  await assertClientExists(input.clientId);
  const db = getDb();
  const { lines, subtotal, taxAmount, total } = computeTotals(input.items, input.taxRate, input.discount);
  const now = new Date().toISOString();
  const row = {
    invoiceNumber: input.invoiceNumber as string,
    clientId: input.clientId,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    status: input.status,
    currency: input.currency,
    taxRate: input.taxRate,
    discount: input.discount,
    subtotal,
    taxAmount,
    total,
    notes: input.notes,
    updatedAt: now,
  };
  if (isSupabase()) {
    const { data, error } = await db.from('invoices').update(row).eq('id', id).select('id').maybeSingle();
    sbCheck(error);
    if (!data) throw new HttpError(404, 'Invoice not found');
    const del = await db.from('invoice_items').delete().eq('invoiceId', id);
    sbCheck(del.error);
    const ins = await db.from('invoice_items').insert(lines.map((l) => ({ ...l, invoiceId: id })));
    sbCheck(ins.error);
    return loadInvoice(id);
  }
  try {
    const tx = db.transaction(() => {
      const info = db
        .prepare(`UPDATE invoices SET invoiceNumber=?, clientId=?, issueDate=?, dueDate=?, status=?, currency=?, taxRate=?, discount=?,
                  subtotal=?, taxAmount=?, total=?, notes=?, updatedAt=? WHERE id=?`)
        .run(row.invoiceNumber, row.clientId, row.issueDate, row.dueDate, row.status, row.currency, row.taxRate, row.discount, subtotal, taxAmount, total, row.notes, now, id);
      if (info.changes === 0) throw new HttpError(404, 'Invoice not found');
      db.prepare('DELETE FROM invoice_items WHERE invoiceId = ?').run(id);
      const ins = db.prepare('INSERT INTO invoice_items (invoiceId, description, quantity, unitPrice, amount, position) VALUES (?,?,?,?,?,?)');
      lines.forEach((l) => ins.run(id, l.description, l.quantity, l.unitPrice, l.amount, l.position));
    });
    tx();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    sqliteUnique(e);
  }
  return loadInvoice(id);
}

export async function updateInvoiceStatus(id: number, status: string) {
  const db = getDb();
  const now = new Date().toISOString();
  if (isSupabase()) {
    const { data, error } = await db.from('invoices').update({ status, updatedAt: now }).eq('id', id).select('id, status, updatedAt').maybeSingle();
    sbCheck(error);
    if (!data) throw new HttpError(404, 'Invoice not found');
    return { id: Number(data.id), status: data.status, updatedAt: ts(data.updatedAt) };
  }
  const info = db.prepare('UPDATE invoices SET status = ?, updatedAt = ? WHERE id = ?').run(status, now, id);
  if (info.changes === 0) throw new HttpError(404, 'Invoice not found');
  return { id, status, updatedAt: now };
}

export async function deleteInvoice(id: number) {
  const db = getDb();
  if (isSupabase()) {
    const { data, error } = await db.from('invoices').delete().eq('id', id).select('id');
    sbCheck(error);
    if (!data || data.length === 0) throw new HttpError(404, 'Invoice not found');
  } else {
    const info = db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
    if (info.changes === 0) throw new HttpError(404, 'Invoice not found');
  }
  return { id, success: true };
}

/* ---------------- Dashboard ---------------- */

export async function dashboardStats() {
  const db = getDb();
  let invoices: any[];
  let totalClients: number;
  if (isSupabase()) {
    const inv = await db.from('invoices').select('id, invoiceNumber, clientId, issueDate, status, total, createdAt');
    sbCheck(inv.error);
    invoices = inv.data || [];
    const cl = await db.from('clients').select('id, name');
    sbCheck(cl.error);
    const names: Record<number, string> = {};
    (cl.data || []).forEach((c: any) => (names[c.id] = c.name));
    totalClients = (cl.data || []).length;
    invoices = invoices.map((i) => ({ ...i, clientName: i.clientId != null ? names[i.clientId] ?? null : null }));
  } else {
    invoices = db
      .prepare(`SELECT i.id, i.invoiceNumber, i.clientId, i.issueDate, i.status, i.total, i.createdAt, c.name AS clientName
                FROM invoices i LEFT JOIN clients c ON c.id = i.clientId`)
      .all();
    totalClients = Number(db.prepare('SELECT COUNT(*) AS c FROM clients').get().c);
  }
  const statusCounts = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 } as Record<(typeof INVOICE_STATUSES)[number], number>;
  let totalBilled = 0, totalPaid = 0, totalOutstanding = 0;
  for (const i of invoices) {
    const t = n(i.total);
    if (i.status in statusCounts) statusCounts[i.status as keyof typeof statusCounts]++;
    if (i.status !== 'cancelled' && i.status !== 'draft') totalBilled += t;
    if (i.status === 'paid') totalPaid += t;
    if (i.status === 'sent' || i.status === 'overdue') totalOutstanding += t;
  }
  const recentInvoices = [...invoices]
    .sort((a, b) => String(b.issueDate).localeCompare(String(a.issueDate)) || Number(b.id) - Number(a.id))
    .slice(0, 5)
    .map((i) => ({
      id: Number(i.id),
      invoiceNumber: i.invoiceNumber,
      clientName: i.clientName ?? null,
      issueDate: d(i.issueDate) as string,
      status: i.status,
      total: n(i.total),
    }));
  const round = (x: number) => Math.round(x * 100) / 100;
  return {
    totalInvoices: invoices.length,
    totalClients,
    totalBilled: round(totalBilled),
    totalPaid: round(totalPaid),
    totalOutstanding: round(totalOutstanding),
    overdueCount: statusCounts.overdue,
    statusCounts,
    recentInvoices,
  };
}