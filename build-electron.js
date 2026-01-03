import { build } from 'electron-builder';
import { spawn } from 'child_process';
import { resolve } from 'path';

// 首先构建Vue项目
console.log('Building Vue project...');

// 尝试使用node直接执行vite构建命令
const vitePath = resolve('./node_modules/.bin/vite');
console.log('Using vite path:', vitePath);

const child = spawn('node', [vitePath, 'build'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('Vue project built successfully!');
    
    // 然后构建Electron应用
    console.log('Building Electron app...');
    build({
      config: {
        directories: {
          output: 'dist-electron'
        },
        extraResources: [
          {
            from: 'dist/',
            to: 'dist/'
          }
        ]
      }
    }).then(() => {
      console.log('Electron app built successfully!');
    }).catch((error) => {
      console.error('Build failed:', error);
      process.exit(1);
    });
  } else {
    console.error('Vue build failed with code:', code);
    process.exit(1);
  }
});