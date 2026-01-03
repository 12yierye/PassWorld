import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 启动Vite开发服务器
console.log('Starting Vite development server...');
const viteProcess = spawn('npx', ['vite'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (err) => {
  console.error('Failed to start Vite server:', err);
});

// 等待一段时间确保Vite服务器已启动
setTimeout(() => {
  console.log('Starting Electron app...');
  const electronProcess = spawn('npx', ['electron', '.'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  electronProcess.on('error', (err) => {
    console.error('Failed to start Electron app:', err);
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron app exited with code ${code}`);
    viteProcess.kill();
  });
}, 3000); // 等待3秒确保Vite服务器启动

// 处理主进程退出
process.on('exit', () => {
  viteProcess.kill();
});