# mcp-open-library

Search books, authors, and trending titles via the Open Library API.

> **Free API** — No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `search_books` | Search for books. |
| `get_book` | Get book details by Open Library key or ISBN. |
| `search_authors` | Search for authors. |
| `get_author_works` | Get works by an author. |
| `get_trending` | Get trending/popular books. |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-open-library.git
cd mcp-open-library
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "open-library": {
      "command": "node",
      "args": ["/path/to/mcp-open-library/dist/index.js"]
    }
  }
}
```

## Usage with npx

```bash
npx mcp-open-library
```

## License

MIT
