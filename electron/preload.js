const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('toggle-maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});