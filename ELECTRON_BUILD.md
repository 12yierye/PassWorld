# PassWorld Electron 构建说明

## 项目概述

PassWorld 是一个基于 Vue 3 和 Electron 构建的跨平台桌面应用，用于管理账户密码信息。

## 项目结构

- `src/` - Vue 3 源代码
- `electron/` - Electron 主进程代码
- `public/` - 静态资源文件
- `dist/` - Vue 构建输出目录
- `dist-electron/` - Electron 构建输出目录

## 开发环境运行

由于Windows环境下直接运行`npm run electron:dev`可能会遇到node命令找不到的问题，推荐使用以下方式：

1. 分别启动：
   ```bash
   # 终端1：启动Vite开发服务器
   npm run dev
   
   # 终端2：启动Electron（需要额外配置）
   npx electron .
   ```

## 构建桌面应用

### 完整构建
```bash
npm run electron:build
```

### 构建到分发包
```bash
npm run electron:dist
```

## 构建步骤详解

1. 首先运行 `npm run build` 来构建Vue项目
2. 然后运行 `node build-electron.js` 来构建Electron应用
3. 构建后的应用将位于 `dist-electron/` 目录

## 图标文件

为了完整构建，您需要准备以下图标文件：
- `public/icon.ico` - Windows平台图标 (256x256)
- `public/icon.icns` - macOS平台图标 (256x256)
- `public/icon.png` - Linux平台图标 (512x512)

您可以使用在线工具将一个高分辨率的PNG图标转换为所需的格式。

## 分发包

构建完成后，最终的安装包将位于 `dist-electron/` 目录下，根据平台不同会生成：
- Windows: `.exe` 安装程序
- macOS: `.dmg` 磁盘映像
- Linux: `.AppImage` 可执行文件

## 注意事项

1. 在Windows环境下，由于环境变量问题，直接运行`electron:dev`脚本可能会失败，建议使用构建模式测试。
2. 人脸识别功能（face-api.js）在Electron环境中应该能正常工作。
3. 应用使用localStorage存储用户数据，在打包后依然有效。