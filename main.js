"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ObsidianNotePosterPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/http-server.mjs
var import_node_http = __toESM(require("node:http"), 1);

// src/note-service.mjs
var import_promises = __toESM(require("node:fs/promises"), 1);
var import_node_path = __toESM(require("node:path"), 1);
function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }
}
function sanitizeTitle(title) {
  const sanitized = title.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").replace(/\s+/g, " ").replace(/\.+$/g, "").trim();
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
  return `${lines.join("\n")}
`;
}
function textResponse(status, payload) {
  return {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload, null, 2)
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
async function createDefaultFolderNote({
  vaultPath,
  defaultFolder,
  title,
  content,
  frontmatter
}) {
  assertNonEmptyString(vaultPath, "vaultPath");
  assertNonEmptyString(defaultFolder, "defaultFolder");
  assertNonEmptyString(title, "title");
  assertNonEmptyString(content, "content");
  const safeTitle = sanitizeTitle(title);
  const noteDirectory = import_node_path.default.join(import_node_path.default.resolve(vaultPath), defaultFolder);
  const savedPath = import_node_path.default.join(noteDirectory, `${safeTitle}.md`);
  await import_promises.default.mkdir(noteDirectory, { recursive: true });
  try {
    await import_promises.default.access(savedPath);
    throw new Error(`Note already exists at ${savedPath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
  const body = `${serializeFrontmatter(frontmatter)}${content.trimEnd()}
`;
  await import_promises.default.writeFile(savedPath, body, { encoding: "utf8", flag: "wx" });
  return {
    savedPath,
    message: `Created note at ${savedPath}`
  };
}
async function handleCreateNoteRequest({
  headers,
  expectedApiKey,
  body,
  vaultPath,
  defaultFolder
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
      frontmatter: body?.frontmatter
    });
    return textResponse(201, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return textResponse(400, { error: message });
  }
}

// src/http-server.mjs
function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body === "" ? {} : JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}
function startNotePosterServer({
  host = "127.0.0.1",
  port,
  expectedApiKey,
  vaultPath,
  defaultFolder,
  logger = console
}) {
  const server = import_node_http.default.createServer(async (request, response) => {
    if (request.method === "POST" && request.url === "/notes") {
      try {
        const body = await readJsonBody(request);
        const result = await handleCreateNoteRequest({
          headers: request.headers,
          expectedApiKey,
          body,
          vaultPath,
          defaultFolder
        });
        response.writeHead(result.status, result.headers);
        response.end(result.body);
      } catch (error) {
        response.writeHead(400, {
          "content-type": "application/json; charset=utf-8"
        });
        response.end(
          JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error)
            },
            null,
            2
          )
        );
      }
      return;
    }
    response.writeHead(404, {
      "content-type": "application/json; charset=utf-8"
    });
    response.end(JSON.stringify({ error: "Not found" }, null, 2));
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      logger.info?.(`Obsidian Note Poster listening on http://${host}:${port}/notes`);
      resolve(server);
    });
  });
}

// main.ts
var DEFAULT_SETTINGS = {
  port: 27125,
  apiKey: "",
  defaultFolder: "Inbox"
};
var ObsidianNotePosterPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.server = null;
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new ObsidianNotePosterSettingTab(this.app, this));
    this.addCommand({
      id: "restart-local-note-poster-server",
      name: "Restart local note poster server",
      callback: async () => {
        await this.restartServer();
        new import_obsidian.Notice("Obsidian Note Poster server restarted");
      }
    });
    await this.startServer();
  }
  async onunload() {
    await this.stopServer();
  }
  async loadSettings() {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...await this.loadData()
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async restartServer() {
    await this.stopServer();
    await this.startServer();
  }
  async startServer() {
    if (!this.settings.apiKey.trim()) {
      new import_obsidian.Notice("Obsidian Note Poster: set an API key in plugin settings to enable the local server.");
      return;
    }
    try {
      const adapter = this.app.vault.adapter;
      const vaultPath = adapter.basePath;
      if (!vaultPath) {
        throw new Error("This plugin requires the desktop filesystem adapter");
      }
      this.server = await startNotePosterServer({
        host: "127.0.0.1",
        port: Number(this.settings.port),
        expectedApiKey: this.settings.apiKey,
        vaultPath,
        defaultFolder: this.settings.defaultFolder
      });
    } catch (error) {
      new import_obsidian.Notice(
        `Obsidian Note Poster failed to start: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  async stopServer() {
    if (!this.server) {
      return;
    }
    await new Promise((resolve, reject) => {
      this.server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(void 0);
      });
    });
    this.server = null;
  }
};
var ObsidianNotePosterSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Codex to Obsidian Note Poster" });
    new import_obsidian.Setting(containerEl).setName("Default folder").setDesc("All incoming notes will be created in this vault folder.").addText(
      (text) => text.setPlaceholder("Inbox").setValue(this.plugin.settings.defaultFolder).onChange(async (value) => {
        this.plugin.settings.defaultFolder = value.trim() || "Inbox";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Port").setDesc("The localhost port for the note intake endpoint.").addText(
      (text) => text.setPlaceholder("27125").setValue(String(this.plugin.settings.port)).onChange(async (value) => {
        const parsed = Number(value);
        this.plugin.settings.port = Number.isInteger(parsed) && parsed > 0 ? parsed : 27125;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("API key").setDesc("Requests must send this key as a Bearer token.").addText(
      (text) => text.setPlaceholder("Set a shared secret").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Restart server").setDesc("Apply updated settings immediately.").addButton(
      (button) => button.setButtonText("Restart").onClick(async () => {
        await this.plugin.restartServer();
        new import_obsidian.Notice("Obsidian Note Poster server restarted");
      })
    );
  }
};
