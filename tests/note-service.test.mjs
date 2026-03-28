import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createDefaultFolderNote, handleCreateNoteRequest } from "../src/note-service.mjs";

async function makeVault() {
  return fs.mkdtemp(path.join(os.tmpdir(), "obsidian-http-plugin-"));
}

test("creates a note in the configured default folder", async () => {
  const vaultPath = await makeVault();

  const result = await createDefaultFolderNote({
    vaultPath,
    defaultFolder: "Inbox",
    title: "Status Update",
    content: "Ready to ship",
    frontmatter: {
      source: "codex",
      tags: ["status", "weekly"],
    },
  });

  const expectedPath = path.join(vaultPath, "Inbox", "Status Update.md");
  assert.equal(result.savedPath, expectedPath);
  assert.equal(
    await fs.readFile(expectedPath, "utf8"),
    "---\n" +
      "source: codex\n" +
      "tags:\n" +
      "  - status\n" +
      "  - weekly\n" +
      "---\n\n" +
      "Ready to ship\n"
  );
});

test("rejects duplicate notes in the default folder", async () => {
  const vaultPath = await makeVault();

  await createDefaultFolderNote({
    vaultPath,
    defaultFolder: "Inbox",
    title: "Duplicate",
    content: "First",
  });

  await assert.rejects(
    createDefaultFolderNote({
      vaultPath,
      defaultFolder: "Inbox",
      title: "Duplicate",
      content: "Second",
    }),
    /already exists/i
  );
});

test("rejects titles that sanitize to an empty filename", async () => {
  const vaultPath = await makeVault();

  await assert.rejects(
    createDefaultFolderNote({
      vaultPath,
      defaultFolder: "Inbox",
      title: "///",
      content: "Nope",
    }),
    /empty filename/i
  );
});

test("returns 401 when the API key is missing", async () => {
  const response = await handleCreateNoteRequest({
    headers: {},
    expectedApiKey: "secret",
    body: {
      title: "Test",
      content: "Body",
    },
    vaultPath: "/vault",
    defaultFolder: "Inbox",
  });

  assert.equal(response.status, 401);
  assert.match(response.body, /api key/i);
});

test("returns 201 when the API key is valid and note creation succeeds", async () => {
  const vaultPath = await makeVault();

  const response = await handleCreateNoteRequest({
    headers: {
      authorization: "Bearer secret",
    },
    expectedApiKey: "secret",
    body: {
      title: "HTTP Note",
      content: "Posted locally",
    },
    vaultPath,
    defaultFolder: "Inbox",
  });

  assert.equal(response.status, 201);
  assert.match(response.body, /HTTP Note\.md/);
});
