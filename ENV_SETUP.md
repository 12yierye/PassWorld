# PassWorld 环境配置说明

## 问题描述

在当前 Windows 环境中，运行 `npm install` 或 `npx electron` 命令时，会出现以下错误：

```
'node' ڲⲿҲǿеĳ
ļ
```

这表示在执行子进程脚本时无法找到 node 命令。

## 解决方案

### 方法1：修复环境变量

1. 确保 Node.js 已正确安装在您的系统上
2. 检查 `C:\Program Files\nodejs\`（或您的 Node.js 安装路径）是否已添加到系统 PATH 环境变量中
3. 重启命令提示符或终端，确保环境变量更新生效

### 方法2：使用 Windows 命令提示符

在某些情况下，Git Bash 或其他 shell 可能无法正确处理 Windows 环境变量。请尝试使用 Windows 原生命令提示符（cmd）或 PowerShell：

```bash
# 使用 Windows CMD
npm install
npm run build
```

### 方法3：安装 Windows Build Tools

如果您需要编译原生模块，可能需要安装 Windows Build Tools：

```bash
npm install --global windows-build-tools
```

## 项目依赖

本项目使用以下依赖：

- Electron: 桌面应用框架
- face-api.js: 人脸识别库
- sql.js: JavaScript SQLite 实现

## 运行项目

在正确配置环境后，您可以：

1. 安装依赖：`npm install`
2. 运行开发版本：`npm run dev`
3. 构建生产版本：`npm run build`

## 注意事项

- 本项目使用了 `better-sqlite3` 或 `sql.js` 作为数据库解决方案
- 如果 `better-sqlite3` 安装失败，代码已修改为使用 `sql.js` 作为替代
- 在 Windows 环境中，某些原生模块可能需要额外的构建工具