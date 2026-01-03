import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

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
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    },
    icon: join(__dirname, '../public/icon.png'), // 如果有图标文件的话
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
    // 在开发环境中，如果无法连接到开发服务器，显示错误信息
    if (!app.isPackaged) {
      win.loadFile(join(__dirname, '../public/simple-download.html')).then(() => {
        win.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>应用启动失败</h2>
            <p>无法连接到开发服务器 http://localhost:5173</p>
            <p>请确保先在另一个终端运行: <code style="background: #eee; padding: 5px;">npm run dev</code></p>
            <p>然后再启动Electron应用</p>
          </div>';
        `);
        win.show();
      });
    } else {
      // 生产环境中加载失败时显示错误信息
      win.loadFile(join(__dirname, '../public/simple-download.html')).then(() => {
        win.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>应用启动失败</h2>
            <p>无法加载应用界面</p>
            <p>错误代码: ${errorCode}</p>
            <p>错误描述: ${errorDescription}</p>
          </div>';
        `);
        win.show();
      });
    }
  });

  // 根据环境决定加载的URL
  if (app.isPackaged) {
    // 生产环境：加载构建后的文件
    // 使用 app.getAppPath() 获取正确的路径
    const indexPath = join(process.resourcesPath, 'dist', 'index.html');
    // 检查文件是否存在，如果不存在则尝试其他可能的路径
    win.loadFile(indexPath).catch(err => {
      console.error('Failed to load main file:', err);
      // 尝试使用不同的路径
      const fallbackPath = join(__dirname, '../dist/index.html');
      win.loadFile(fallbackPath).catch(fallbackErr => {
        console.error('Fallback path also failed:', fallbackErr);
        // 如果都失败了，显示错误页面
        win.loadFile(join(__dirname, '../public/simple-download.html')).then(() => {
          win.webContents.executeJavaScript(`
            document.body.innerHTML = '<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
              <h2>应用启动失败</h2>
              <p>无法找到应用界面文件</p>
              <p>请确认应用是否完整安装</p>
              <p>错误详情: ${fallbackErr.message}</p>
            </div>';
          `);
          win.show();
        });
      });
    });
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