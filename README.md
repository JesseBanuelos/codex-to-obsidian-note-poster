# Codex to Obsidian Note Poster

Codex to Obsidian Note Poster is a desktop-only Obsidian plugin that lets trusted local tools create new notes in Obsidian through a simple localhost HTTP endpoint.

The plugin is designed for lightweight capture and automation workflows. It runs only on `127.0.0.1`, requires an API key, and writes notes into a single configured default folder inside your vault. This keeps the behavior predictable and reduces the risk of arbitrary writes across the vault.

Version `0.1.0` focuses on a narrow, safe workflow:

- create new notes only
- refuse to overwrite existing notes
- sanitize note titles into safe filenames
- support optional YAML frontmatter
- keep configuration simple with a port, API key, and default folder

This makes it a good fit for local automation scenarios such as:

- sending notes from Codex or other local AI tools into Obsidian
- capturing summaries, meeting notes, or status updates into an inbox folder
- building personal workflows that treat Obsidian as the final note destination

The repository also includes a companion Codex MCP plugin for direct vault writes, but the Obsidian community plugin itself is focused on the localhost note intake workflow inside the Obsidian desktop environment.

## Obsidian Plugin Setup

1. Run `npm install` in the repo root.
2. Run `npm run build`.
3. Copy `manifest.json`, `main.js`, `styles.css`, and `versions.json` into your vault's `.obsidian/plugins/codex-note-poster/` folder for local testing.
4. Enable the plugin in Obsidian.
5. Configure the API key, port, and default folder in plugin settings.

## HTTP Request Shape

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

## Codex Companion Plugin

The `codex-plugin/` directory contains the companion Codex MCP plugin for direct vault writes.

Setup:

1. Open `codex-plugin/`.
2. Run `npm install`.
3. Update `codex-plugin/.mcp.json` if you want a different vault path.
4. Register the plugin in your Codex local plugin catalog.

## Release Notes

Use [RELEASE_NOTES_v0.1.0.md](/Users/jessebanuelospersonalmacmini/Downloads/files/codex-to-obsidian-note-poster/RELEASE_NOTES_v0.1.0.md) as the GitHub release body for `v0.1.0`.

## Community Submission Notes

Before submitting the Obsidian plugin:

- upload `manifest.json`, `main.js`, and `styles.css` as the release assets
- keep `versions.json` updated
- follow the Obsidian community plugin review process

See [COMMUNITY-SUBMISSION-CHECKLIST.md](/Users/jessebanuelospersonalmacmini/Downloads/files/codex-to-obsidian-note-poster/COMMUNITY-SUBMISSION-CHECKLIST.md) for the short checklist.
