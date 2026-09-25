import { HttpError, route } from '../../../lib/server/http';
import { createInvoice, listInvoices } from '../../../lib/server/repo';
import { parseInvoiceInput, parseStatus } from '../../../lib/server/validation';

export default route({
  GET: async (req, res) => {
    const status = typeof req.query.status === 'string' && req.query.status ? parseStatus(req.query.status) : undefined;
    let clientId: number | undefined;
    if (typeof req.query.clientId === 'string' && req.query.clientId) {
      clientId = Number(req.query.clientId);
      if (!Number.isInteger(clientId) || clientId <= 0) throw new HttpError(400, 'clientId is invalid');
    }
    res.status(200).json(await listInvoices({ status, clientId }));
  },
  POST: async (req, res) => {
    const input = parseInvoiceInput(req.body, false);
    res.status(201).json(await createInvoice(input));
  },
});