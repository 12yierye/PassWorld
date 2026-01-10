import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 自动化构建脚本，解决文件锁定问题
console.log('=== PassWorld 自动构建脚本 ===');

// 1. 生成唯一的输出目录名（使用时间戳）
const timestamp = new Date().getTime();
const outputDir = `build-${timestamp}`;
console.log(`\n[1/4] 使用唯一输出目录: ${outputDir}`);

// 2. 修改electron-builder配置文件
const electronBuilderConfigPath = path.join(process.cwd(), 'electron-builder.json');

// 安全地解析和修改JSON配置
const config = JSON.parse(fs.readFileSync(electronBuilderConfigPath, 'utf8'));

// 更新输出目录
config.directories.output = outputDir;

// 确保files数组存在且格式正确
if (!Array.isArray(config.files)) {
  config.files = ['**/*', '!node_modules/**/*', '!dist/**/*'];
}

// 清理旧的构建目录排除规则和依赖模块规则
config.files = config.files.filter(file => {
  return !file.match(/^!build(?:-[^/]+)?\/\*\*\/\*$/) && 
         !file.match(/^node_modules\/(sql\.js|face-api\.js)\/\*\*\/\*$/);
});

// 确保包含必要的依赖模块
config.files.push(
  "node_modules/sql.js/**/*",
  "node_modules/face-api.js/**/*"
);

// 添加新的输出目录排除
config.files.push(`!${outputDir}/**/*`);

// 写回配置文件
fs.writeFileSync(electronBuilderConfigPath, JSON.stringify(config, null, 2));
console.log('[2/4] 已更新electron-builder配置');

// 3. 终止所有可能占用文件的PassWorld进程
console.log('[3/4] 清理占用资源的进程...');
try {
  // 终止PassWorld相关进程
  execSync('taskkill /f /im PassWorld.exe 2>&1', { stdio: 'ignore' });
  execSync('taskkill /f /im electron.exe 2>&1', { stdio: 'ignore' });
  console.log('  ✓ 已终止所有PassWorld进程');
} catch (err) {
  // 如果没有找到进程，忽略错误
  console.log('  ✓ 没有运行中的PassWorld进程');
}

// 4. 运行构建命令
console.log(`[4/4] 开始构建项目...`);
try {
  const buildOutput = execSync('npm run build', { encoding: 'utf8' });
  console.log('  ✓ 构建成功！');
  
  // 显示构建结果路径
  console.log(`\n=== 构建完成 ===`);
  console.log(`安装程序: ${path.join(process.cwd(), outputDir, 'PassWorld Setup 0.0.1.exe')}`);
  console.log(`解压目录: ${path.join(process.cwd(), outputDir, 'win-unpacked')}`);
  
} catch (err) {
  console.error('  ✗ 构建失败！');
  console.error(err.stdout || err.stderr || err.message);
  process.exit(1);
}

console.log('\n=== 自动化构建流程完成 ===');
