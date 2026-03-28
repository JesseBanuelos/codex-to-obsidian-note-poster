## Codex to Obsidian Note Poster v0.1.0

Initial public release of Codex to Obsidian Note Poster.

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
