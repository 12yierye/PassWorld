import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { URL } from 'url';

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
  const mainWindow = createWindow();

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