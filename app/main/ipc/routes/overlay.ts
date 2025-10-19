import { registerRoute } from '../server.js';
import { parseJsonBody } from '../utils.js';
import { captureContext } from '../../../core/scanner/context-capture.js';
import { findShortcutsForContext } from '../../../core/indexer/query-service.js';

registerRoute('/overlay/context', async (req, res) => {
  try {
    const payload = await parseJsonBody(req);
    const context = captureContext(payload);
    const shortcuts = findShortcutsForContext(context);
    const response = {
      shortcuts,
      conflicts: [],
      recommendations: [],
      latencyBudgetMs: 1000
    };
    res.end(JSON.stringify(response));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ message: (error as Error).message }));
  }
});

registerRoute('/overlay/hide', (_req, res) => {
  res.statusCode = 204;
  res.end();
});
