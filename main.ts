import { Notice, Plugin, PluginSettingTab, Setting } from "obsidian";

import { startNotePosterServer } from "./src/http-server.mjs";

type NotePosterSettings = {
  port: number;
  apiKey: string;
  defaultFolder: string;
};

const DEFAULT_SETTINGS: NotePosterSettings = {
  port: 27125,
  apiKey: "",
  defaultFolder: "Inbox",
};

export default class ObsidianNotePosterPlugin extends Plugin {
  settings: NotePosterSettings = DEFAULT_SETTINGS;
  server: import("node:http").Server | null = null;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new ObsidianNotePosterSettingTab(this.app, this));

    this.addCommand({
      id: "restart-local-note-poster-server",
      name: "Restart local note poster server",
      callback: async () => {
        await this.restartServer();
        new Notice("Obsidian Note Poster server restarted");
      },
    });

    await this.startServer();
  }

  async onunload() {
    await this.stopServer();
  }

  async loadSettings() {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(await this.loadData()),
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
      new Notice("Obsidian Note Poster: set an API key in plugin settings to enable the local server.");
      return;
    }

    try {
      const adapter = this.app.vault.adapter as { basePath?: string };
      const vaultPath = adapter.basePath;

      if (!vaultPath) {
        throw new Error("This plugin requires the desktop filesystem adapter");
      }

      this.server = await startNotePosterServer({
        host: "127.0.0.1",
        port: Number(this.settings.port),
        expectedApiKey: this.settings.apiKey,
        vaultPath,
        defaultFolder: this.settings.defaultFolder,
      });
    } catch (error) {
      new Notice(
        `Obsidian Note Poster failed to start: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async stopServer() {
    if (!this.server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    this.server = null;
  }
}

class ObsidianNotePosterSettingTab extends PluginSettingTab {
  plugin: ObsidianNotePosterPlugin;

  constructor(app: PluginSettingTab["app"], plugin: ObsidianNotePosterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Codex to Obsidian Note Poster" });

    new Setting(containerEl)
      .setName("Default folder")
      .setDesc("All incoming notes will be created in this vault folder.")
      .addText((text) =>
        text
          .setPlaceholder("Inbox")
          .setValue(this.plugin.settings.defaultFolder)
          .onChange(async (value) => {
            this.plugin.settings.defaultFolder = value.trim() || "Inbox";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Port")
      .setDesc("The localhost port for the note intake endpoint.")
      .addText((text) =>
        text
          .setPlaceholder("27125")
          .setValue(String(this.plugin.settings.port))
          .onChange(async (value) => {
            const parsed = Number(value);
            this.plugin.settings.port = Number.isInteger(parsed) && parsed > 0 ? parsed : 27125;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("API key")
      .setDesc("Requests must send this key as a Bearer token.")
      .addText((text) =>
        text
          .setPlaceholder("Set a shared secret")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Restart server")
      .setDesc("Apply updated settings immediately.")
      .addButton((button) =>
        button.setButtonText("Restart").onClick(async () => {
          await this.plugin.restartServer();
          new Notice("Obsidian Note Poster server restarted");
        })
      );
  }
}
