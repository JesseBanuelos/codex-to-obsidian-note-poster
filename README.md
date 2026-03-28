# Codex to Obsidian Note Poster

Codex to Obsidian Note Poster is a dual-integration project for creating new notes in Obsidian from Codex.

This repository currently includes:

- A Codex MCP plugin at the repo root that writes new Markdown notes directly into a configured Obsidian vault
- The release assets for the companion Obsidian desktop plugin, which exposes a localhost-only HTTP endpoint on `127.0.0.1`

## Repository Layout

### Codex MCP plugin

The root package contains the Codex MCP plugin source.

Key files:

- `package.json`
- `src/create-note.mjs`
- `src/server.mjs`
- `tests/create-note.test.mjs`

### Obsidian release assets

The repository also includes the built assets required for the Obsidian community plugin release:

- `manifest.json`
- `main.js`
- `styles.css`
- `versions.json`

## Codex Plugin Setup

1. Run `npm install` in the repo root.
2. Run `npm test` to verify the plugin.
3. Update `.mcp.json` if you want a different vault path.
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

## Release Notes

Use [RELEASE_NOTES_v0.1.0.md](/Users/jessebanuelospersonalmacmini/Downloads/files/codex-to-obsidian-note-poster/RELEASE_NOTES_v0.1.0.md) as the GitHub release body for `v0.1.0`.

## Community Submission Notes

Before submitting the Obsidian plugin:

- upload `manifest.json`, `main.js`, and `styles.css` as the release assets
- keep `versions.json` updated
- follow the Obsidian community plugin review process

See `COMMUNITY-SUBMISSION-CHECKLIST.md` for the short checklist.
