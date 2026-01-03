// 预加载脚本
// 在这里可以安全地访问Node.js API并将其暴露给渲染进程
// 但当前应用不需要特殊API，所以保持简单

// 所有预加载脚本中的代码将在渲染进程上下文中运行，但具有Node.js和Electron API的访问权限

// 例如，可以暴露特定的API给渲染进程：
// window.electron = {
//   ipcRenderer: require('electron').ipcRenderer
// };

// 为了安全起见，我们只暴露必要的API
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // IPC相关API
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    once: (channel, func) => ipcRenderer.once(channel, (event, ...args) => func(...args)),
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
  },
  
  // 也可以暴露一些工具函数
  process: {
    platform: process.platform,
    version: process.version
  }
});