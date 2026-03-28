import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { createNote } from "./create-note.mjs";

const DEFAULT_VAULT_PATH =
  "/Users/jessebanuelospersonalmacmini/Documents/Obsidian Vault";

function toTextResult(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

async function main() {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH || DEFAULT_VAULT_PATH;
  const server = new McpServer({
    name: "obsidian-note-poster",
    version: "0.1.0",
  });

  server.registerTool(
    "create_obsidian_note",
    {
      description: "Create a new Markdown note in the configured Obsidian vault.",
      inputSchema: z.object({
        title: z.string().min(1).describe("Note title used for the filename"),
        content: z.string().min(1).describe("Markdown body for the note"),
        folder: z
          .string()
          .min(1)
          .optional()
          .describe("Optional vault-relative folder for the new note"),
        frontmatter: z
          .record(z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))]))
          .optional()
          .describe("Optional YAML frontmatter object"),
      }),
    },
    async ({ title, content, folder, frontmatter }) => {
      const result = await createNote({
        vaultPath,
        title,
        content,
        folder,
        frontmatter,
      });

      return toTextResult({
        message: result.message,
        savedPath: result.savedPath,
      });
    }
  );

  await server.connect(new StdioServerTransport());

  if (process.env.OBSIDIAN_NOTE_POSTER_EXIT_AFTER_CONNECT === "1") {
    process.exit(0);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Obsidian Note Poster MCP server failed to start: ${message}\n`);
  process.exit(1);
});
