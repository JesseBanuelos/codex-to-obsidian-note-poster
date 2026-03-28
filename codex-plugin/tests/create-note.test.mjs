import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createNote } from "../src/create-note.mjs";

async function makeVault() {
  return fs.mkdtemp(path.join(os.tmpdir(), "obsidian-note-poster-"));
}

test("creates a note in the vault root", async () => {
  const vaultPath = await makeVault();

  const result = await createNote({
    vaultPath,
    title: "Project Kickoff",
    content: "Meeting notes",
  });

  assert.equal(result.savedPath, path.join(vaultPath, "Project Kickoff.md"));
  assert.equal(await fs.readFile(result.savedPath, "utf8"), "Meeting notes\n");
});

test("creates a note in a nested folder with frontmatter", async () => {
  const vaultPath = await makeVault();

  const result = await createNote({
    vaultPath,
    title: "Weekly Update",
    content: "Status is green",
    folder: "Work/Status",
    frontmatter: {
      tags: ["weekly", "status"],
      published: false,
    },
  });

  assert.equal(
    result.savedPath,
    path.join(vaultPath, "Work", "Status", "Weekly Update.md")
  );
  assert.equal(
    await fs.readFile(result.savedPath, "utf8"),
    "---\n" +
      "tags:\n" +
      "  - weekly\n" +
      "  - status\n" +
      "published: false\n" +
      "---\n\n" +
      "Status is green\n"
  );
});

test("rejects duplicate note paths", async () => {
  const vaultPath = await makeVault();

  await createNote({
    vaultPath,
    title: "Daily Log",
    content: "First copy",
  });

  await assert.rejects(
    createNote({
      vaultPath,
      title: "Daily Log",
      content: "Second copy",
    }),
    /already exists/i
  );
});

test("rejects folder traversal outside the vault", async () => {
  const vaultPath = await makeVault();

  await assert.rejects(
    createNote({
      vaultPath,
      title: "Escape Attempt",
      content: "Nope",
      folder: "../outside",
    }),
    /outside the vault/i
  );
});

test("rejects titles that sanitize to an empty filename", async () => {
  const vaultPath = await makeVault();

  await assert.rejects(
    createNote({
      vaultPath,
      title: "///",
      content: "Nope",
    }),
    /empty filename/i
  );
});
