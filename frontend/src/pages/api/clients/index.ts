import { route } from '../../../lib/server/http';
import { createClient, listClients } from '../../../lib/server/repo';
import { parseClientInput } from '../../../lib/server/validation';

export default route({
  GET: async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    res.status(200).json(await listClients(search));
  },
  POST: async (req, res) => {
    const input = parseClientInput(req.body);
    res.status(201).json(await createClient(input));
  },
});