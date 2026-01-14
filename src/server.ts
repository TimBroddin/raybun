import type { RayRequest } from './types';
import { store } from './store';

const DEFAULT_PORT = 23517;

type BunServer = ReturnType<typeof Bun.serve>;

let server: BunServer | null = null;

export function startServer(port: number = DEFAULT_PORT): BunServer {
  server = Bun.serve({
    port,
    fetch: async (req) => {
      // Handle CORS preflight
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      // Only accept POST requests
      if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      try {
        const body = await req.json();
        const rayRequest = body as RayRequest;

        // Validate basic structure
        if (!rayRequest.uuid || !Array.isArray(rayRequest.payloads)) {
          return new Response('Invalid payload structure', { status: 400 });
        }

        // Process the request
        store.addRequest(rayRequest);

        // Return success quickly (Ray expects fast responses)
        return new Response('OK', {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response('Invalid JSON', { status: 400 });
      }
    },
  });

  return server;
}

export function stopServer(): void {
  if (server) {
    server.stop();
    server = null;
  }
}

export function getServerPort(): number {
  return server?.port ?? DEFAULT_PORT;
}
