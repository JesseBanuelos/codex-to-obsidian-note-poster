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

function textResponse(status, payload) {
  return {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload, null, 2),
  };
}

function readBearerToken(headers) {
  const authorization = headers.authorization ?? headers.Authorization;

  if (typeof authorization !== "string") {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export async function createDefaultFolderNote({
  vaultPath,
  defaultFolder,
  title,
  content,
  frontmatter,
}) {
  assertNonEmptyString(vaultPath, "vaultPath");
  assertNonEmptyString(defaultFolder, "defaultFolder");
  assertNonEmptyString(title, "title");
  assertNonEmptyString(content, "content");

  const safeTitle = sanitizeTitle(title);
  const noteDirectory = path.join(path.resolve(vaultPath), defaultFolder);
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

export async function handleCreateNoteRequest({
  headers,
  expectedApiKey,
  body,
  vaultPath,
  defaultFolder,
}) {
  if (typeof expectedApiKey !== "string" || expectedApiKey.trim() === "") {
    return textResponse(500, { error: "Plugin API key is not configured" });
  }

  const token = readBearerToken(headers ?? {});
  if (token !== expectedApiKey) {
    return textResponse(401, { error: "API key is missing or invalid" });
  }

  try {
    const result = await createDefaultFolderNote({
      vaultPath,
      defaultFolder,
      title: body?.title,
      content: body?.content,
      frontmatter: body?.frontmatter,
    });

    return textResponse(201, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return textResponse(400, { error: message });
  }
}
