import { parseId, route } from '../../../../lib/server/http';
import { deleteInvoice, getInvoice, updateInvoice } from '../../../../lib/server/repo';
import { parseInvoiceInput } from '../../../../lib/server/validation';

export default route({
  GET: async (req, res) => {
    res.status(200).json(await getInvoice(parseId(req.query.id)));
  },
  PUT: async (req, res) => {
    const id = parseId(req.query.id);
    res.status(200).json(await updateInvoice(id, parseInvoiceInput(req.body, true)));
  },
  DELETE: async (req, res) => {
    res.status(200).json(await deleteInvoice(parseId(req.query.id)));
  },
});