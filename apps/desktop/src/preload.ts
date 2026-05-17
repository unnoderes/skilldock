import { contextBridge, ipcRenderer } from "electron";

const desktopApi = {
  getVersion: (): Promise<string> => ipcRenderer.invoke("desktop:getVersion"),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("desktop:openExternal", url),
};

contextBridge.exposeInMainWorld("skilldockDesktop", desktopApi);
