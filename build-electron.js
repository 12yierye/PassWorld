import { build } from 'electron-builder';
import { execSync } from 'child_process';

// 首先构建Vue项目
console.log('Building Vue project...');
execSync('npm run build', { stdio: 'inherit' });

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