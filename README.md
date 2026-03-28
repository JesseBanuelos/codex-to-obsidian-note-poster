# Codex To Obsidian Note Poster

This repository is set up so the repo root is a real Obsidian community plugin package, while `codex-plugin/` contains the separate Codex MCP plugin.

## Packages

### Repo Root

The root package is the Obsidian plugin. It exposes a localhost-only HTTP endpoint on `127.0.0.1`, requires an API key, and creates new notes in one configured default folder.

### `codex-plugin/`

This package is the Codex MCP plugin. It writes new Markdown notes directly into a configured Obsidian vault from Codex.

## Obsidian Plugin Setup

1. Run `npm install` in the repo root.
2. Run `npm run build`.
3. Copy `manifest.json`, `main.js`, `styles.css`, and `versions.json` into your vault's `.obsidian/plugins/codex-note-poster/` folder for local testing.
4. Enable the plugin in Obsidian.
5. Configure the API key, port, and default folder in plugin settings.

## Codex Plugin Setup

1. Open `codex-plugin/`.
2. Run `npm install`.
3. Update `codex-plugin/.mcp.json` if you want a different vault path.
4. Register the plugin in your Codex local plugin catalog.

## Obsidian Request Shape

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

Send the API key as:

```text
Authorization: Bearer <api-key>
```

## Community Submission Notes

Before submitting the Obsidian plugin:

- test the plugin in a real desktop Obsidian vault
- create a public GitHub repository
- create a GitHub release containing `manifest.json`, `main.js`, and `styles.css`
- keep `versions.json` updated
- submit the plugin for review through the Obsidian community plugin process

See [COMMUNITY-SUBMISSION-CHECKLIST.md](/Users/jessebanuelospersonalmacmini/Downloads/files/codex-to-obsidian-note-poster/COMMUNITY-SUBMISSION-CHECKLIST.md) for the short checklist.

## Verification

Verified in this workspace:

- root Obsidian plugin: tests pass and the plugin builds to `main.js`
- `codex-plugin/`: tests pass and the MCP server starts cleanly
