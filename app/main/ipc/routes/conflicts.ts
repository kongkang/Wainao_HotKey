import { registerRoute } from '../server.js';
import { listConflicts } from '../../../core/indexer/conflict-service.js';

registerRoute('/conflicts', (req, res) => {
  const url = new URL(req.url ?? '', 'http://localhost');
  const level = url.searchParams.get('level') ?? undefined;
  const conflicts = listConflicts(level);
  res.end(JSON.stringify({ items: conflicts, total: conflicts.length }));
});
