import http from 'node:http';

export type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

const routes = new Map<string, RouteHandler>();
let server: http.Server | null = null;

export function registerRoute(path: string, handler: RouteHandler): void {
  routes.set(path, handler);
}

export function startServer(port = 65321): void {
  if (server) {
    return;
  }
  server = http.createServer((req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }
    const handler = routes.get(req.url.split('?')[0]);
    if (!handler) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    handler(req, res);
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`[ipc] server listening on http://127.0.0.1:${port}`);
  });
}

export function stopServer(): void {
  if (!server) {
    return;
  }
  server.close();
  server = null;
}
