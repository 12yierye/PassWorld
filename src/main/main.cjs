const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { join, dirname } = require('path');
const { readFileSync, existsSync } = require('fs');
const db = require('../../js/db.cjs')  // 更新引用路径

let mainWindow; // 存储主窗口引用

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
    minWidth: 800,  // 根据UI设计规范设置最小宽度
    minHeight: 500, // 根据UI设计规范设置最小高度
    webPreferences: {
      nodeIntegration: true,  // 启用nodeIntegration以支持原生JS功能
      contextIsolation: false, // 由于需要支持原生JS功能，暂时关闭上下文隔离
      preload: join(__dirname, '../../electron/preload.js')  // 修正预加载脚本路径
    },
    icon: join(__dirname, '../../assets/Normal Locker.png'), // 如果有图标文件的话
    show: false, // 先不显示窗口，等页面加载完成后再显示
    frame: false, // 禁用默认窗口边框，使用自定义标题栏
    backgroundColor: '#ffffff' // 设置背景色，确保窗口外观一致
  };

  mainWindow = new BrowserWindow(options);

  // 设置页面加载事件监听器
  mainWindow.webContents.on('did-finish-load', () => {
    const currentURL = mainWindow.webContents.getURL();
    const urlObj = new URL(currentURL);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'index.html'; // 如果没有文件名，默认为index.html
    console.log(`Page finished loading: ${filename}`);
    // if (!app.isPackaged) {
    //   mainWindow.webContents.openDevTools(); // 开发环境下自动打开开发者工具
    // }
    mainWindow.show(); // 页面加载完成后显示窗口
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Page load failed: ${errorCode} - ${errorDescription}`);
    // 在开发环境中，如果无法加载主页面，显示错误信息
    if (!app.isPackaged) {
      mainWindow.loadFile(join(__dirname, '../../public/test.html')).then(() => {
        mainWindow.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>应用启动失败</h2>
            <p>无法加载主应用页面</p>
            <p>错误代码: ${errorCode}</p>
            <p>错误描述: ${errorDescription}</p>
          </div>';
        `);
        mainWindow.show();
      }).catch(err => {
        console.error('Failed to load test page:', err);
      });
    } else {
      // 生产环境中加载失败时显示错误信息
      mainWindow.loadFile(join(__dirname, '../../public/test.html')).then(() => {
        mainWindow.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2>应用启动失败</h2>
            <p>无法加载应用界面</p>
            <p>错误代码: ${errorCode}</p>
            <p>错误描述: ${errorDescription}</p>
          </div>';
        `);
        mainWindow.show();
      }).catch(err => {
        console.error('Failed to load error page:', err);
      });
    }
  });

  // 根据环境决定加载的URL
  if (app.isPackaged) {
    // 生产环境：加载主HTML文件
    const indexPath = join(__dirname, '../../login.html');
    console.log('Packaged app - loading index.html from:', indexPath);
    
    if (existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      // 如果主文件不存在，尝试其他可能的路径
      const fallbackPath = join(__dirname, '../../public/test.html');
      if (existsSync(fallbackPath)) {
        mainWindow.loadFile(fallbackPath);
      } else {
        console.error('Main HTML file not found');
      }
    }
  } else {
    // 开发环境：直接加载主HTML文件
    mainWindow.loadFile(join(__dirname, '../../login.html'));
  }
};


// 当Electron完成初始化时调用
app.whenReady().then(() => {
  db.initDatabases();
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

// IPC处理窗口控制
ipcMain.handle('minimize-window', async (event) => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('toggle-maximize-window', async (event) => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', async (event) => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('set-position', async (event, x, y) => {
  if (mainWindow) {
    mainWindow.setPosition(x, y);
  }
});

// IPC处理数据库操作
ipcMain.handle('db-create-user', async (event, username, password) => {
  try {
    await db.createUser(username, password);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-authenticate', async (event, username, password) => {
  try {
    const valid = await db.authenticateUser(username, password);
    return { success: valid };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-check-user', async (event, username) => {
  try {
    const exists = await db.checkUserExists(username);
    return { exists };
  } catch (err) {
    return { exists: false, error: err.message };
  }
});

ipcMain.handle('db-save-accounts', async (event, user, masterPassword, accounts) => {
  try {
    await db.saveAccounts(user, masterPassword, accounts);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-load-accounts', async (event, user, masterPassword) => {
  try {
    const accounts = await db.loadAccounts(user, masterPassword);
    return { success: true, accounts };
  } catch (err) {
    return { success: false, accounts: [], error: err.message };
  }
});