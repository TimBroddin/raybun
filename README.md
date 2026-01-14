# Raybun

A lightweight terminal-based viewer for [Ray](https://myray.app) debug output. An alternative to the Ray desktop app that runs entirely in your terminal.

> **Experimental** - This is an early release. Please report issues!

## Features

- Full TUI with split-panel layout (payload list + detail view)
- Syntax highlighting for SQL, JSON, HTML, XML, PHP, JavaScript, CSS
- Follow mode - automatically scroll to new payloads
- Support for all Ray payload types (logs, dumps, queries, exceptions, tables, etc.)
- Keyboard-driven navigation
- Works with Laravel Ray, PHP Ray, and any Ray-compatible client

## Installation

```bash
# Run directly with bunx (no install needed)
bunx raybun

# Or install globally
bun install -g raybun
raybun

# Or clone and run locally
git clone https://github.com/timbroddin/raybun.git
cd raybun
bun install
bun start
```

## Usage

Start Raybun, then send debug output from your Laravel/PHP app:

```bash
# Start the viewer (default port 23517)
bunx raybun

# Or specify a custom port
bunx raybun --port 23518
```

In your Laravel/PHP code:

```php
ray('Hello from Laravel!');
ray($user)->label('Current User');
ray()->table(['name' => 'John', 'email' => 'john@example.com']);
ray()->sql('SELECT * FROM users WHERE active = ?', [true]);
ray()->exception(new Exception('Something went wrong'));
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `k` | Move up |
| `↓` / `j` | Move down |
| `g` | Go to top |
| `G` | Go to bottom (enable follow) |
| `PgUp` / `PgDn` | Page up/down |
| `f` | Toggle follow mode |
| `c` | Clear all payloads |
| `?` / `h` | Show help |
| `q` | Quit |

## Configuration

Raybun listens on the same port as the Ray desktop app (23517). To use Raybun instead of Ray:

1. Close the Ray desktop app
2. Start Raybun
3. Your Laravel app will automatically send debug output to Raybun

To use a different port, start Raybun with `--port` and configure your Laravel app:

```php
// config/ray.php
return [
    'port' => 23518,
];
```

## Requirements

- [Bun](https://bun.sh) runtime

## License

MIT

## Acknowledgments

- [Spatie](https://spatie.be) for creating Ray and the open Ray protocol
- Built with [Ink](https://github.com/vadimdemedes/ink) for the terminal UI
