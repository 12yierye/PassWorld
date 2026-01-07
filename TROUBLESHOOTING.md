# PassWorld 故障排除指南

## 问题描述

在 Windows 环境中运行 PassWorld 项目时，出现以下错误：

```
'node' 不是内部或外部命令，也不是可运行的程序或批处理文件。
```

## 问题原因

这是一个 Windows 环境变量配置问题，特别是在以下情况下发生：
1. Node.js 没有正确添加到系统 PATH 环境变量
2. 当 Electron 运行安装脚本时，子进程无法继承正确的环境变量
3. 使用 Git Bash 等非原生 Windows 终端

## 解决方案

### 方案 1: 修复环境变量（推荐）

1. 找到 Node.js 安装路径（通常是 `C:\Program Files\nodejs\`）
2. 将该路径添加到系统的 PATH 环境变量中：
   - 右键点击 "此电脑" → "属性"
   - 点击 "高级系统设置"
   - 点击 "环境变量"
   - 在 "系统变量" 中找到 "Path"，点击 "编辑"
   - 点击 "新建"，添加 Node.js 安装路径（如 `C:\Program Files\nodejs\`）
   - 确认所有对话框
3. 重启命令提示符或整个系统
4. 验证修复：在命令提示符中运行 `node --version` 和 `npm --version`

### 方案 2: 使用 Windows 命令提示符

在 Windows 命令提示符（cmd）或 PowerShell 中运行命令，而不是 Git Bash：

```bash
# 使用 Windows 命令提示符
cd e:\PassWorld
npm install
npm run dev
```

### 方案 3: 重新安装 Node.js

1. 从 [nodejs.org](https://nodejs.org/) 下载最新 LTS 版本
2. 在安装过程中确保勾选 "Add to PATH" 选项
3. 完成安装后重启系统

## 代码优化已完成

我们已经完成了以下代码优化，以提高应用的兼容性：

1. 将原生模块 `sqlite3` 替换为纯 JavaScript 实现 `sql.js`
2. 更新了数据库访问代码以兼容新的数据库库
3. 修正了 Electron 主进程文件中的预加载脚本路径
4. 简化了 package.json 配置以避免不必要的构建步骤

## 验证修复

按照上述方案修复环境问题后，您应该能够：

1. 成功运行 `npm install`
2. 成功运行 `npm run dev` 启动开发服务器
3. 成功运行 `npm run build` 构建生产版本

## 如果问题仍然存在

如果尝试了上述所有解决方案后仍有问题，请：

1. 验证 Node.js 是否正确安装：检查 `C:\Program Files\nodejs\node.exe` 是否存在
2. 检查 npm 是否正确安装：检查 `C:\Program Files\nodejs\npm.cmd` 是否存在
3. 尝试使用管理员权限运行命令提示符
4. 考虑使用 Node.js 版本管理器如 NVM-Windows

## 技术细节

- 我们已将 `better-sqlite3` 替换为 `sql.js` 以避免原生模块编译需求
- 应用架构保持不变，所有数据库操作接口兼容
- Electron 应用的单实例锁定功能和其他核心功能保持完好