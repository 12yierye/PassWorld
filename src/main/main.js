import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

// 实现单实例锁，确保应用只能运行一个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 如果获取锁失败，说明已经有实例在运行，直接退出
  app.quit();
}

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createWindow = () => {
  const options = {
    width: 1200,
    height: 800,
    minWidth: 800,  // 根据UI设计规范设置最小宽度
    minHeight: 500, // 根据UI设计规范设置最小高度
    webPreferences: {
      nodeIntegration: true,  // 启用nodeIntegration以支持原生JS功能
      contextIsolation: false, // 由于需要支持原生JS功能，暂时关闭上下文隔离
      preload: join(__dirname, 'preload.js')
    },
    icon: join(__dirname, '../../assets/Normal Locker.png'), // 如果有图标文件的话
    show: false // 先不显示窗口，等页面加载完成后再显示
  };

  const win = new BrowserWindow(options);

  // 设置页面加载事件监听器
  win.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
    if (!app.isPackaged) {
      win.webContents.openDevTools(); // 开发环境下自动打开开发者工具
    }
    win.show(); // 页面加载完成后显示窗口
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Page load failed: ${errorCode} - ${errorDescription}`);
    // 在开发环境中，如果无法加载主页面，显示错误信息
    if (!app.isPackaged) {
      win.loadFile(join(__dirname, '../../public/test.html')).then(() => {
        win.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>应用启动失败</h2>
            <p>无法加载主应用页面</p>
            <p>错误代码: ${errorCode}</p>
            <p>错误描述: ${errorDescription}</p>
          </div>';
        `);
        win.show();
      }).catch(err => {
        console.error('Failed to load test page:', err);
      });
    } else {
      // 生产环境中加载失败时显示错误信息
      win.loadFile(join(__dirname, '../../public/test.html')).then(() => {
        win.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>应用启动失败</h2>
            <p>无法加载应用界面</p>
            <p>错误代码: ${errorCode}</p>
            <p>错误描述: ${errorDescription}</p>
          </div>';
        `);
        win.show();
      }).catch(err => {
        console.error('Failed to load error page:', err);
      });
    }
  });

  // 根据环境决定加载的URL
  if (app.isPackaged) {
    // 生产环境：加载主HTML文件
    const indexPath = join(__dirname, '../../index.html');
    console.log('Packaged app - loading index.html from:', indexPath);
    
    if (existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      // 如果主文件不存在，尝试其他可能的路径
      const fallbackPath = join(__dirname, '../../public/test.html');
      if (existsSync(fallbackPath)) {
        win.loadFile(fallbackPath);
      } else {
        console.error('Main HTML file not found');
      }
    }
  } else {
    // 开发环境：直接加载主HTML文件
    win.loadFile(join(__dirname, '../../index.html'));
  }
};

// 当Electron完成初始化时调用
app.whenReady().then(() => {
  createWindow();

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

  // 在macOS上，如果没有窗口打开，单击 dock 图标时重新创建窗口
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

// IPC处理（如果需要的话）
ipcMain.on('asynchronous-message', (event, arg) => {
  console.log(arg); // prints "ping"
  event.reply('asynchronous-reply', 'pong');
});

ipcMain.on('synchronous-message', (event, arg) => {
  console.log(arg); // prints "ping"
  event.returnValue = 'pong';
});