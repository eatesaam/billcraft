/** @jest-environment node */
import { mockReqRes, setupSqlite } from './testUtils';
setupSqlite();
import { __resetDb } from '../../lib/db';
import invoicesIndex from '../../pages/api/invoices/index';
import invoiceById from '../../pages/api/invoices/[id]/index';
import invoiceStatus from '../../pages/api/invoices/[id]/status';
import stats from '../../pages/api/dashboard/stats';
import health from '../../pages/api/health';

beforeEach(() => __resetDb());
afterAll(() => __resetDb());

const body = {
  clientId: 1, issueDate: '2025-04-01', dueDate: '2025-05-01', currency: 'USD',
  taxRate: 10, discount: 50, status: 'draft', invoiceNumber: 'INV-2001',
  items: [{ description: 'Design', quantity: 2, unitPrice: 100 }, { description: 'Dev', quantity: 1, unitPrice: 300 }],
};

describe('GET /api/health', () => {
  it('returns ok', () => {
    const { req, res, out } = mockReqRes({ method: 'GET' });
    health(req, res);
    expect(out.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/dashboard/stats', () => {
  it('returns aggregates', async () => {
    const { req, res, out } = mockReqRes({ method: 'GET' });
    await stats(req, res);
    expect(out.status).toBe(200);
    expect(out.body.totalInvoices).toBe(4);
    expect(out.body.statusCounts.paid).toBe(1);
    expect(out.body.overdueCount).toBe(1);
    expect(out.body.recentInvoices.length).toBeGreaterThan(0);
  });
  it('rejects POST', async () => {
    const { req, res, out } = mockReqRes({ method: 'POST' });
    await stats(req, res);
    expect(out.status).toBe(405);
  });
});

describe('GET /api/invoices', () => {
  it('lists with clientName', async () => {
    const { req, res, out } = mockReqRes({ method: 'GET' });
    await invoicesIndex(req, res);
    expect(out.body).toHaveLength(4);
    expect(out.body[0]).toHaveProperty('clientName');
  });
  it('rejects invalid status filter', async () => {
    const { req, res, out } = mockReqRes({ method: 'GET', query: { status: 'bogus' } });
    await invoicesIndex(req, res);
    expect(out.status).toBe(400);
  });
});

describe('POST /api/invoices', () => {
  it('creates and computes totals', async () => {
    const { req, res, out } = mockReqRes({ method: 'POST', body });
    await invoicesIndex(req, res);
    expect(out.status).toBe(201);
    expect(out.body.subtotal).toBe(500);
    expect(out.body.taxAmount).toBe(45);
    expect(out.body.total).toBe(495);
    expect(out.body.items).toHaveLength(2);
  });
  it('rejects empty items', async () => {
    const { req, res, out } = mockReqRes({ method: 'POST', body: { ...body, items: [] } });
    await invoicesIndex(req, res);
    expect(out.status).toBe(400);
  });
});

describe('GET /api/invoices/{id}', () => {
  it('returns invoice with client and items', async () => {
    const { req, res, out } = mockReqRes({ method: 'GET', query: { id: '1' } });
    await invoiceById(req, res);
    expect(out.body.client.name).toBe('Jane Cooper');
    expect(out.body.items).toHaveLength(2);
  });
  it('404 unknown', async () => {
    const { req, res, out } = mockReqRes({ method: 'GET', query: { id: '999' } });
    await invoiceById(req, res);
    expect(out.status).toBe(404);
  });
});

describe('PUT /api/invoices/{id}', () => {
  it('replaces items and recomputes', async () => {
    const { req, res, out } = mockReqRes({ method: 'PUT', query: { id: '4' }, body: { ...body, items: [{ description: 'One', quantity: 1, unitPrice: 100 }] } });
    await invoiceById(req, res);
    expect(out.status).toBe(200);
    expect(out.body.items).toHaveLength(1);
    expect(out.body.subtotal).toBe(100);
  });
  it('requires invoiceNumber', async () => {
    const { req, res, out } = mockReqRes({ method: 'PUT', query: { id: '4' }, body: { ...body, invoiceNumber: undefined } });
    await invoiceById(req, res);
    expect(out.status).toBe(400);
  });
});

describe('PATCH /api/invoices/{id}/status', () => {
  it('updates status', async () => {
    const { req, res, out } = mockReqRes({ method: 'PATCH', query: { id: '2' }, body: { status: 'paid' } });
    await invoiceStatus(req, res);
    expect(out.body.status).toBe('paid');
    expect(out.body).toHaveProperty('updatedAt');
  });
  it('rejects invalid status', async () => {
    const { req, res, out } = mockReqRes({ method: 'PATCH', query: { id: '2' }, body: { status: 'lost' } });
    await invoiceStatus(req, res);
    expect(out.status).toBe(400);
  });
});

describe('DELETE /api/invoices/{id}', () => {
  it('deletes', async () => {
    const { req, res, out } = mockReqRes({ method: 'DELETE', query: { id: '3' } });
    await invoiceById(req, res);
    expect(out.body).toEqual({ id: 3, success: true });
  });
  it('404 unknown', async () => {
    const { req, res, out } = mockReqRes({ method: 'DELETE', query: { id: '999' } });
    await invoiceById(req, res);
    expect(out.status).toBe(404);
  });
});