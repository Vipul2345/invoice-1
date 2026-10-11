const { contextBridge } = require('electron');

// Expose safe, minimal platform detection to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
});
