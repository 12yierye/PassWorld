import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { URL } from 'url';

// 实现单实例锁，确保应用只能运行一个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 如果获取锁失败，说明已经有实例在运行，直接退出
  app.quit();
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: join(__dirname, 'preload.js')
    },
    icon: join(__dirname, '../public/icon.png'),
    show: false
  });

  // 检查是否为开发环境
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    // 开发模式下加载Vite服务器
    win.loadURL('http://localhost:5173');
    win.webContents.on('did-finish-load', () => {
      win.webContents.openDevTools();
      win.show();
    });
  } else {
    // 生产模式下加载构建后的文件
    const indexPath = join(__dirname, '..', 'index.html');
    win.loadFile(indexPath).then(() => {
      win.show();
    }).catch(err => {
      console.error('Failed to load main page:', err);
      // 加载备用页面
      win.loadFile(join(__dirname, '../public/test.html')).then(() => {
        win.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>应用启动失败</h2>
            <p>无法加载应用界面</p>
            <p>${err.message}</p>
          </div>';
        `);
        win.show();
      });
    });
  }

  return win;
};

app.whenReady().then(() => {
  const mainWindow = createWindow();

  // 处理第二个实例的尝试
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 如果有其他实例启动，激活当前窗口
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
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

// 当所有窗口都关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 处理应用退出
app.on('before-quit', () => {
  // 任何清理代码
});

// 为开发环境添加IPC处理
if (process.env.NODE_ENV === 'development') {
  // 开发时可能需要的IPC处理
  ipcMain.handle('app:get-path', (event, name) => {
    return app.getPath(name);
  });
}

// IPC处理（如果需要的话）
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg); // prints "ping"
  event.reply('asynchronous-reply', 'pong');
});

ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg); // prints "ping"
  event.returnValue = 'pong';
});