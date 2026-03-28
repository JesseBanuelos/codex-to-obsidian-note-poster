import fs from "node:fs/promises";
import path from "node:path";

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }
}

function sanitizeTitle(title) {
  const sanitized = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();

  if (sanitized === "") {
    throw new Error("Title sanitization resulted in an empty filename");
  }

  return sanitized;
}

function serializeYamlScalar(value) {
  if (typeof value === "string") {
    if (/^[A-Za-z0-9 _./-]+$/.test(value) && value.trim() !== "") {
      return value;
    }
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  throw new Error("Frontmatter values must be strings, numbers, booleans, null, or arrays");
}

function serializeFrontmatter(frontmatter) {
  if (frontmatter == null) {
    return "";
  }

  if (typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    throw new Error("frontmatter must be an object");
  }

  const lines = ["---"];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${serializeYamlScalar(item)}`);
      }
      continue;
    }

    lines.push(`${key}: ${serializeYamlScalar(value)}`);
  }

  lines.push("---", "");
  return `${lines.join("\n")}\n`;
}

function resolveNoteDirectory(vaultPath, folder = "") {
  const basePath = path.resolve(vaultPath);
  const targetPath = path.resolve(basePath, folder);
  const relativePath = path.relative(basePath, targetPath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Folder path resolves outside the vault");
  }

  return targetPath;
}

export async function createNote({ vaultPath, title, content, folder, frontmatter }) {
  assertNonEmptyString(vaultPath, "vaultPath");
  assertNonEmptyString(title, "title");
  assertNonEmptyString(content, "content");

  const noteDirectory = resolveNoteDirectory(vaultPath, folder);
  const safeTitle = sanitizeTitle(title);
  const savedPath = path.join(noteDirectory, `${safeTitle}.md`);

  await fs.mkdir(noteDirectory, { recursive: true });

  try {
    await fs.access(savedPath);
    throw new Error(`Note already exists at ${savedPath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  const body = `${serializeFrontmatter(frontmatter)}${content.trimEnd()}\n`;
  await fs.writeFile(savedPath, body, { encoding: "utf8", flag: "wx" });

  return {
    savedPath,
    message: `Created note at ${savedPath}`,
  };
}
