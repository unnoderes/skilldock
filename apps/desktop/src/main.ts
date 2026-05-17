import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { app, BrowserWindow, ipcMain, shell } = require("electron") as typeof import("electron");

type EmbeddedServerModule = {
  startServer(options?: {
    host?: string;
    port?: number;
    staticRoot?: string;
    launchProjectPath?: string;
  }): Promise<string>;
  stopServer?(): Promise<void>;
};

const DESKTOP_RENDERER_URL = process.env.SKILLDOCK_DESKTOP_RENDERER_URL?.trim();
const isDevRenderer = Boolean(DESKTOP_RENDERER_URL);
const desktopDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(desktopDir, "..", "..", "..");
const desktopLogPath = path.join(os.tmpdir(), "skilldock-desktop.log");

type BrowserWindowInstance = InstanceType<typeof BrowserWindow>;

let mainWindow: BrowserWindowInstance | null = null;
let embeddedServerModule: EmbeddedServerModule | null = null;
let embeddedServerUrl: string | null = null;

function logDesktop(message: string, error?: unknown): void {
  const details = error instanceof Error
    ? `${error.message}\n${error.stack ?? ""}`
    : error == null
      ? ""
      : String(error);

  try {
    fs.appendFileSync(
      desktopLogPath,
      `[${new Date().toISOString()}] ${message}${details ? `\n${details}` : ""}\n`,
      "utf8",
    );
  } catch {
    // Swallow logging failures to avoid affecting app startup.
  }
}

function isAllowedExternalUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function openExternalUrl(url: string): Promise<void> {
  if (!isAllowedExternalUrl(url)) {
    throw new Error("Only http(s) URLs are allowed.");
  }

  await shell.openExternal(url);
}

async function startEmbeddedServer(): Promise<string> {
  if (embeddedServerUrl) return embeddedServerUrl;

  logDesktop("Starting embedded server.");
  const serverEntry = path.join(appRoot, "apps", "server", "dist", "index.js");
  const staticRoot = path.join(appRoot, "apps", "web", "dist");

  try {
    embeddedServerModule = await import(pathToFileURL(serverEntry).href) as EmbeddedServerModule;
    embeddedServerUrl = await embeddedServerModule.startServer({
      host: "127.0.0.1",
      port: 0,
      staticRoot,
      launchProjectPath: app.getPath("home"),
    });
  } catch (error) {
    logDesktop("Embedded server failed to start.", error);
    throw error;
  }

  logDesktop(`Embedded server started at ${embeddedServerUrl}.`);

  return embeddedServerUrl;
}

async function stopEmbeddedServer(): Promise<void> {
  if (!embeddedServerModule) return;

  const currentModule = embeddedServerModule;
  embeddedServerModule = null;
  embeddedServerUrl = null;

  if (typeof currentModule.stopServer === "function") {
    await currentModule.stopServer();
  }
}

async function resolveRendererUrl(): Promise<string> {
  if (isDevRenderer && DESKTOP_RENDERER_URL) {
    return DESKTOP_RENDERER_URL;
  }

  return startEmbeddedServer();
}

async function createMainWindow(): Promise<void> {
  logDesktop("Creating main window.");
  const rendererUrl = await resolveRendererUrl();
  const rendererOrigin = new URL(rendererUrl).origin;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#101418",
    webPreferences: {
      preload: path.join(appRoot, "apps", "desktop", "dist", "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const revealWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      logDesktop("Revealing main window.");
      mainWindow.show();
    }
  };

  const showFallbackTimer = setTimeout(() => {
    logDesktop("Main window show fallback timer fired.");
    revealWindow();
  }, 1500);

  mainWindow.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
    if (isAllowedExternalUrl(url)) {
      void shell.openExternal(url);
    }

    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event: { preventDefault(): void }, url: string) => {
    if (isAllowedExternalUrl(url) && new URL(url).origin !== rendererOrigin) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  mainWindow.once("ready-to-show", () => {
    logDesktop("Main window ready-to-show.");
    clearTimeout(showFallbackTimer);
    revealWindow();
  });

  mainWindow.once("closed", () => {
    clearTimeout(showFallbackTimer);
  });

  mainWindow.webContents.on("did-finish-load", () => {
    logDesktop("Main window did-finish-load.");
  });

  mainWindow.webContents.on("did-fail-load", (_event: unknown, errorCode: number, errorDescription: string) => {
    logDesktop(`Main window did-fail-load: ${errorCode} ${errorDescription}`);
  });

  await mainWindow.loadURL(rendererUrl);
  logDesktop(`Main window loadURL resolved for ${rendererUrl}.`);
  clearTimeout(showFallbackTimer);
  revealWindow();
}

ipcMain.handle("desktop:getVersion", () => app.getVersion());
ipcMain.handle("desktop:openExternal", async (_event: unknown, url: string) => {
  await openExternalUrl(url);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  void stopEmbeddedServer();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createMainWindow();
  }
});

process.on("uncaughtException", (error) => {
  logDesktop("Uncaught exception in desktop process.", error);
});

process.on("unhandledRejection", (reason) => {
  logDesktop("Unhandled rejection in desktop process.", reason);
});

logDesktop("Desktop process booting.");
void app.whenReady()
  .then(async () => {
    logDesktop("Electron app ready.");
    await createMainWindow();
  })
  .catch((error) => {
    logDesktop("Electron app failed during whenReady flow.", error);
  });
