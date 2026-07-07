const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("svoyaIgraMedia", {
  saveFile: (file) => ipcRenderer.invoke("media:save-file", file)
});

contextBridge.exposeInMainWorld("svoyaIgraGameFiles", {
  exportGame: (game) => ipcRenderer.invoke("game-files:export", game),
  importGame: () => ipcRenderer.invoke("game-files:import"),
  revealFile: (filePath) => ipcRenderer.invoke("game-files:reveal", filePath)
});

contextBridge.exposeInMainWorld("svoyaIgraUpdates", {
  getStatus: () => ipcRenderer.invoke("updates:get-status"),
  check: () => ipcRenderer.invoke("updates:check"),
  download: () => ipcRenderer.invoke("updates:download"),
  install: () => ipcRenderer.invoke("updates:install"),
  openRelease: () => ipcRenderer.invoke("updates:open-release"),
  onStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("updates:status", listener);
    return () => ipcRenderer.removeListener("updates:status", listener);
  }
});
