/** @jest-environment node */
import { mockReqRes, setupSqlite } from './testUtils';
setupSqlite();
import { __resetDb } from '../../lib/db';
import clientsIndex from '../../pages/api/clients/index';
import clientById from '../../pages/api/clients/[id]';

beforeEach(() => __resetDb());
afterAll(() => __resetDb());

describe('GET /api/clients', () => {
  it('lists seeded clients with invoiceCount', async () => {
    const { req, res, out } = mockReqRes({ method: 'GET' });
    await clientsIndex(req, res);
    expect(out.status).toBe(200);
    expect(out.body.length).toBe(4);
    expect(out.body[0]).toHaveProperty('invoiceCount');
  });
  it('filters by search', async () => {
    const { req, res, out } = mockReqRes({ method: 'GET', query: { search: 'Globex' } });
    await clientsIndex(req, res);
    expect(out.body).toHaveLength(1);
    expect(out.body[0].company).toBe('Globex Ltd');
  });
});

describe('POST /api/clients', () => {
  it('creates a client', async () => {
    const { req, res, out } = mockReqRes({ method: 'POST', body: { name: 'New Co', email: 'new@co.example' } });
    await clientsIndex(req, res);
    expect(out.status).toBe(201);
    expect(out.body.name).toBe('New Co');
    expect(out.body.id).toBeGreaterThan(0);
  });
  it('rejects missing name', async () => {
    const { req, res, out } = mockReqRes({ method: 'POST', body: { email: 'x@y.example' } });
    await clientsIndex(req, res);
    expect(out.status).toBe(400);
  });
});

describe('GET /api/clients/{id}', () => {
  it('returns client with invoices', async () => {
    const { req, res, out } = mockReqRes({ method: 'GET', query: { id: '1' } });
    await clientById(req, res);
    expect(out.status).toBe(200);
    expect(Array.isArray(out.body.invoices)).toBe(true);
  });
  it('404 for unknown id', async () => {
    const { req, res, out } = mockReqRes({ method: 'GET', query: { id: '999' } });
    await clientById(req, res);
    expect(out.status).toBe(404);
  });
});

describe('PUT /api/clients/{id}', () => {
  it('updates client', async () => {
    const { req, res, out } = mockReqRes({ method: 'PUT', query: { id: '1' }, body: { name: 'Renamed' } });
    await clientById(req, res);
    expect(out.status).toBe(200);
    expect(out.body.name).toBe('Renamed');
  });
  it('404 for unknown id', async () => {
    const { req, res, out } = mockReqRes({ method: 'PUT', query: { id: '999' }, body: { name: 'X' } });
    await clientById(req, res);
    expect(out.status).toBe(404);
  });
});

describe('DELETE /api/clients/{id}', () => {
  it('deletes client', async () => {
    const { req, res, out } = mockReqRes({ method: 'DELETE', query: { id: '2' } });
    await clientById(req, res);
    expect(out.body).toEqual({ id: 2, success: true });
  });
  it('400 for invalid id', async () => {
    const { req, res, out } = mockReqRes({ method: 'DELETE', query: { id: 'abc' } });
    await clientById(req, res);
    expect(out.status).toBe(400);
  });
});