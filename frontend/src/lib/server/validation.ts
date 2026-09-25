import { HttpError } from './http';

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

export interface ClientInput {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
}

export interface ItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceInput {
  invoiceNumber: string | null;
  clientId: number | null;
  issueDate: string;
  dueDate: string | null;
  status: string;
  currency: string;
  taxRate: number;
  discount: number;
  notes: string | null;
  items: ItemInput[];
}

function optStr(v: unknown, field: string, max?: number): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') throw new HttpError(400, `${field} must be a string`);
  const t = v.trim();
  if (!t) return null;
  if (max && t.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return t;
}

function isDate(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
}

function num(v: unknown, field: string, def: number | undefined, min: number, max?: number): number {
  if (v === undefined || v === null || v === '') {
    if (def === undefined) throw new HttpError(400, `${field} is required`);
    return def;
  }
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || (max !== undefined && n > max)) {
    throw new HttpError(400, `${field} is invalid`);
  }
  return n;
}

export function parseClientInput(body: any): ClientInput {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
  const name = optStr(body.name, 'name', 255);
  if (!name) throw new HttpError(400, 'name is required');
  const email = optStr(body.email, 'email', 255);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'email is invalid');
  return {
    name,
    email,
    phone: optStr(body.phone, 'phone', 50),
    company: optStr(body.company, 'company', 255),
    address: optStr(body.address, 'address'),
    notes: optStr(body.notes, 'notes'),
  };
}

export function parseStatus(v: unknown): string {
  if (typeof v !== 'string' || !(INVOICE_STATUSES as readonly string[]).includes(v)) {
    throw new HttpError(400, `status must be one of ${INVOICE_STATUSES.join(', ')}`);
  }
  return v;
}

export function parseInvoiceInput(body: any, full: boolean): InvoiceInput {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
  if (!isDate(body.issueDate)) throw new HttpError(400, 'issueDate is required (YYYY-MM-DD)');
  let dueDate: string | null = null;
  if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== '') {
    if (!isDate(body.dueDate)) throw new HttpError(400, 'dueDate is invalid');
    dueDate = body.dueDate;
  }
  let clientId: number | null = null;
  if (body.clientId !== undefined && body.clientId !== null && body.clientId !== '') {
    const c = Number(body.clientId);
    if (!Number.isInteger(c) || c <= 0) throw new HttpError(400, 'clientId is invalid');
    clientId = c;
  }
  const invoiceNumber = optStr(body.invoiceNumber, 'invoiceNumber', 50);
  if (full) {
    if (!invoiceNumber) throw new HttpError(400, 'invoiceNumber is required');
    for (const f of ['status', 'currency', 'taxRate', 'discount']) {
      if (body[f] === undefined || body[f] === null) throw new HttpError(400, `${f} is required`);
    }
  }
  const status = body.status === undefined || body.status === null ? 'draft' : parseStatus(body.status);
  let currency = 'USD';
  if (body.currency !== undefined && body.currency !== null) {
    if (typeof body.currency !== 'string' || !/^[A-Za-z]{3}$/.test(body.currency)) {
      throw new HttpError(400, 'currency must be a 3-letter code');
    }
    currency = body.currency.toUpperCase();
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw new HttpError(400, 'items must contain at least one line item');
  }
  const items: ItemInput[] = body.items.map((it: any, i: number) => {
    const description = optStr(it?.description, `items[${i}].description`, 500);
    if (!description) throw new HttpError(400, `items[${i}].description is required`);
    return {
      description,
      quantity: num(it.quantity, `items[${i}].quantity`, 1, 0),
      unitPrice: num(it.unitPrice, `items[${i}].unitPrice`, 0, 0),
    };
  });
  return {
    invoiceNumber,
    clientId,
    issueDate: body.issueDate,
    dueDate,
    status,
    currency,
    taxRate: num(body.taxRate, 'taxRate', 0, 0, 100),
    discount: num(body.discount, 'discount', 0, 0),
    notes: optStr(body.notes, 'notes'),
    items,
  };
}

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeTotals(items: ItemInput[], taxRate: number, discount: number) {
  const lines = items.map((it, position) => ({ ...it, amount: r2(it.quantity * it.unitPrice), position }));
  const subtotal = r2(lines.reduce((s, l) => s + l.amount, 0));
  const taxable = Math.max(subtotal - discount, 0);
  const taxAmount = r2((taxable * taxRate) / 100);
  const total = r2(taxable + taxAmount);
  return { lines, subtotal, taxAmount, total };
}