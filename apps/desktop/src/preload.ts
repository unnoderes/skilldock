import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { contextBridge, ipcRenderer } = require("electron") as typeof import("electron");

const desktopApi = {
  getVersion: (): Promise<string> => ipcRenderer.invoke("desktop:getVersion"),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("desktop:openExternal", url),
};

contextBridge.exposeInMainWorld("skilldockDesktop", desktopApi);
