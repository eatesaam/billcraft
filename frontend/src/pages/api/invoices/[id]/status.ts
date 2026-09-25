import { HttpError, parseId, route } from '../../../../lib/server/http';
import { updateInvoiceStatus } from '../../../../lib/server/repo';
import { parseStatus } from '../../../../lib/server/validation';

export default route({
  PATCH: async (req, res) => {
    const id = parseId(req.query.id);
    if (!req.body || typeof req.body !== 'object') throw new HttpError(400, 'Invalid body');
    res.status(200).json(await updateInvoiceStatus(id, parseStatus(req.body.status)));
  },
});