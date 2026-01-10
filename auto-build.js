import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 自动化构建脚本，解决文件锁定问题
console.log('=== PassWorld 自动构建脚本 ===');

// 1. 生成唯一的输出目录名（使用时间戳）
const timestamp = new Date().getTime();
const outputDir = `build-${timestamp}`;
console.log(`\n[1/4] 使用唯一输出目录: ${outputDir}`);

// 2. 终止所有可能占用文件的PassWorld进程
console.log('[2/4] 清理占用资源的进程...');
try {
  // 终止PassWorld相关进程
  execSync('taskkill /f /im PassWorld.exe 2>&1', { stdio: 'ignore' });
  execSync('taskkill /f /im electron.exe 2>&1', { stdio: 'ignore' });
  console.log('  ✓ 已终止所有PassWorld进程');
} catch (err) {
  // 如果没有找到进程，忽略错误
  console.log('  ✓ 没有运行中的PassWorld进程');
}

// 3. 创建临时配置文件，继承主配置并覆盖输出目录
console.log('[3/4] 创建临时构建配置...');
const mainConfigPath = path.join(process.cwd(), 'electron-builder.json');
const mainConfig = JSON.parse(fs.readFileSync(mainConfigPath, 'utf8'));

// 创建临时配置，继承主配置并修改必要的部分
const tempConfig = {
  ...mainConfig,
  directories: {
    ...mainConfig.directories,
    output: outputDir
  },
  files: [
    "**/*",
    "!node_modules/**/*",
    "!dist/**/*",
    "!build*/**/*",
    "node_modules/sql.js/**/*",
    "node_modules/face-api.js/**/*",
    `!${outputDir}/**/*`
  ]
};

// 写入临时配置文件
const tempConfigPath = path.join(process.cwd(), 'electron-builder-temp.json');
fs.writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2));
console.log(`  ✓ 临时配置文件已创建: ${tempConfigPath}`);

// 4. 运行构建命令，使用临时配置文件
console.log(`[4/4] 开始构建项目...`);
try {
  // 使用临时配置文件进行构建
  const buildOutput = execSync(
    `npx electron-builder --config="${tempConfigPath}"`, 
    { encoding: 'utf8' }
  );
  console.log('  ✓ 构建成功！');
  
  // 显示构建结果路径
  console.log(`\n=== 构建完成 ===`);
  console.log(`安装程序: ${path.join(process.cwd(), outputDir, 'PassWorld Setup 0.0.1.exe')}`);
  console.log(`解压目录: ${path.join(process.cwd(), outputDir, 'win-unpacked')}`);
  
} catch (err) {
  console.error('  ✗ 构建失败！');
  console.error(err.stdout || err.stderr || err.message);
  process.exit(1);
} finally {
  // 清理临时配置文件
  if (fs.existsSync(tempConfigPath)) {
    fs.unlinkSync(tempConfigPath);
    console.log(`\n[清理] 临时配置文件已删除`);
  }
}

console.log('\n=== 自动化构建流程完成 ===');
