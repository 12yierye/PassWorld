@echo off
echo Starting PassWorld Electron Application...

REM 添加Node.js到PATH（根据常见安装位置）
set PATH=%PATH%;C:\Program Files\nodejs\;C:\Program Files\nodejs

REM 检查node是否可用
node --version
if errorlevel 1 (
  echo ERROR: Node.js is not found in your system PATH.
  echo Please ensure Node.js is installed and added to your PATH.
  pause
  exit /b 1
)

REM 检查npm是否可用
npm --version
if errorlevel 1 (
  echo ERROR: npm is not found in your system PATH.
  echo Please ensure Node.js is installed and added to your PATH.
  pause
  exit /b 1
)

REM 安装Electron如果尚未安装
if not exist "node_modules\electron" (
  echo Installing Electron...
  npm install electron@^28.2.0 --save-dev --ignore-scripts
)

REM 运行Electron应用
echo Running PassWorld...
npx electron .