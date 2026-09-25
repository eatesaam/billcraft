import { parseId, route } from '../../../lib/server/http';
import { deleteClient, getClient, updateClient } from '../../../lib/server/repo';
import { parseClientInput } from '../../../lib/server/validation';

export default route({
  GET: async (req, res) => {
    res.status(200).json(await getClient(parseId(req.query.id)));
  },
  PUT: async (req, res) => {
    const id = parseId(req.query.id);
    res.status(200).json(await updateClient(id, parseClientInput(req.body)));
  },
  DELETE: async (req, res) => {
    res.status(200).json(await deleteClient(parseId(req.query.id)));
  },
});