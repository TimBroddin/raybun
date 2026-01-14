#!/usr/bin/env bun
import React from 'react';
import { render } from 'ink';
import { parseArgs } from 'util';
import { App } from './components/App';
import { startServer, stopServer } from './server';

const DEFAULT_PORT = 23517;

// Parse command line arguments
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    port: {
      type: 'string',
      short: 'p',
      default: String(DEFAULT_PORT),
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false,
    },
  },
  strict: true,
  allowPositionals: false,
});

if (values.help) {
  console.log(`
Raybun - A lightweight CLI/TUI for Ray

Usage: bun run src/index.tsx [options]

Options:
  -p, --port <port>  Port to listen on (default: ${DEFAULT_PORT})
  -h, --help         Show this help message

Keyboard shortcuts:
  ↑/↓ or j/k  Navigate payloads
  g/G         Go to top/bottom
  c           Clear all payloads
  ?           Show help
  q           Quit
`);
  process.exit(0);
}

const port = parseInt(values.port as string, 10);

if (isNaN(port) || port < 1 || port > 65535) {
  console.error(`Invalid port: ${values.port}`);
  process.exit(1);
}

// Start the HTTP server
const server = startServer(port);
console.log(`Raybun server listening on port ${server.port}`);

// Small delay to ensure the message is visible before TUI takes over
await Bun.sleep(100);

// Render the TUI
const { waitUntilExit } = render(<App port={server.port ?? port} />);

// Wait for the TUI to exit
await waitUntilExit();

// Cleanup
stopServer();
console.log('\nGoodbye!');
