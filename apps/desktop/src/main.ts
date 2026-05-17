import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

let mainWindow: BrowserWindow | null = null;
let embeddedServerModule: EmbeddedServerModule | null = null;
let embeddedServerUrl: string | null = null;

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

  const serverEntry = path.join(appRoot, "apps", "server", "dist", "index.js");
  const staticRoot = path.join(appRoot, "apps", "web", "dist");

  embeddedServerModule = await import(pathToFileURL(serverEntry).href) as EmbeddedServerModule;
  embeddedServerUrl = await embeddedServerModule.startServer({
    host: "127.0.0.1",
    port: 0,
    staticRoot,
    launchProjectPath: app.getPath("home"),
  });

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
    mainWindow?.show();
  });

  await mainWindow.loadURL(rendererUrl);
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

await app.whenReady();
await createMainWindow();
