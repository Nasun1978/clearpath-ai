const { contextBridge, ipcRenderer } = require("electron");

// Expose a minimal, typed API to the renderer via window.electron.
// Nothing from Node or Electron internals leaks beyond this boundary.
contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  isDesktop: true,
  appVersion: process.env.npm_package_version ?? "0.1.0",

  // Let the renderer ask the main process to open an external URL safely.
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
});
