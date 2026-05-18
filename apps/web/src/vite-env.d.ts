/// <reference types="vite/client" />

interface Window {
  skilldockDesktop?: {
    getVersion: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
    getZoomFactor: () => Promise<number>;
    setZoomFactor: (value: number) => Promise<number>;
  };
}
