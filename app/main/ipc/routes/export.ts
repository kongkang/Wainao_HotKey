import { registerRoute } from '../server.js';
import { parseJsonBody } from '../utils.js';
import { exportIndex } from '../../../core/indexer/export-service.js';

registerRoute('/export', async (req, res) => {
  try {
    const payload = await parseJsonBody(req);
    const result = await exportIndex(payload);
    res.end(JSON.stringify(result));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ message: (error as Error).message }));
  }
});
