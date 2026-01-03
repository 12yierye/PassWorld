import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { URL } from 'url';

// 实现单实例锁，确保应用只能运行一个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 如果获取锁失败，说明已经有实例在运行，直接退出
  app.quit();
}

const createWindow = () => {
  const options = {
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(app.getAppPath(), 'electron', 'preload.js')
    },
    icon: join(__dirname, '../public/icon.png') // 如果有图标文件的话
  };

  const win = new BrowserWindow(options);

  // 根据环境决定加载的URL
  if (app.isPackaged) {
    // 生产环境：加载构建后的文件
    win.loadFile(join(__dirname, '../dist/index.html'));
  } else {
    // 开发环境：加载开发服务器
    win.loadURL('http://localhost:5173');
  }

  return win;
};

app.whenReady().then(() => {
  // 检查是否已经有实例在运行
  if (!gotTheLock) {
    // 如果已经有实例在运行，当前实例只负责退出
    return;
  }
  
  const mainWindow = createWindow();

  // 当有第二个实例尝试运行时，激活主窗口
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时，激活窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});