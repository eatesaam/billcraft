import { route } from '../../../lib/server/http';
import { dashboardStats } from '../../../lib/server/repo';

export default route({
  GET: async (_req, res) => {
    res.status(200).json(await dashboardStats());
  },
});