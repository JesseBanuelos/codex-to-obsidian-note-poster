## Codex to Obsidian Note Poster v0.1.0

Initial public release of Codex to Obsidian Note Poster.

This repository includes two related integrations:

- An Obsidian desktop plugin that exposes a localhost-only HTTP endpoint on `127.0.0.1`
- A Codex MCP plugin that writes new notes directly into a configured Obsidian vault

### Obsidian plugin features

- Creates new notes only
- Writes into one configured default folder
- Requires an API key
- Refuses overwrites
- Supports optional YAML frontmatter
- Desktop-only plugin

### Release assets

This release includes the required Obsidian community plugin assets:

- `manifest.json`
- `main.js`
- `styles.css`

### Example request

`POST /notes`

```json
{
  "title": "Weekly Update",
  "content": "Status is green",
  "frontmatter": {
    "source": "codex"
  }
}
```

Header:

`Authorization: Bearer <api-key>`
