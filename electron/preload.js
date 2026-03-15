// Preload script for security
// Currently minimal as we're using contextIsolation
// Add IPC communication here if needed in the future

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  version: process.versions.electron,
  platform: process.platform,
});