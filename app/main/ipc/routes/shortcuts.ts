import { registerRoute } from '../server.js';
import { queryShortcuts } from '../../../core/indexer/query-service.js';

registerRoute('/shortcuts', (req, res) => {
  const url = new URL(req.url ?? '', 'http://localhost');
  const filters = {
    bundleId: url.searchParams.get('bundleId') ?? undefined,
    scope: url.searchParams.get('scope') ?? undefined,
    normalizedCombo: url.searchParams.get('normalizedCombo') ?? undefined
  };
  const shortcuts = queryShortcuts(filters);
  res.end(JSON.stringify({ items: shortcuts, total: shortcuts.length }));
});
