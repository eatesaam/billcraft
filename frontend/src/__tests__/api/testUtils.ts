import type { NextApiRequest, NextApiResponse } from 'next';

export function mockReqRes(opts: { method: string; query?: Record<string, any>; body?: any }) {
  const req = { method: opts.method, query: opts.query || {}, body: opts.body, headers: {} } as unknown as NextApiRequest;
  const out: { status: number; body: any } = { status: 200, body: undefined };
  const res: any = {
    status(code: number) { out.status = code; return res; },
    json(b: any) { out.body = b; return res; },
    setHeader() { return res; },
  };
  return { req, res: res as NextApiResponse, out };
}

export function setupSqlite() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.SQLITE_DB_FILE = ':memory:';
}