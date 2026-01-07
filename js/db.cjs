const initSqlJs = require('sql.js/dist/sql-asm.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// 数据库 - 使用 sql.js 持久化数据库
let userDb;
let accountsDb;

// 创建data目录
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const userDbPath = path.join(dataDir, 'user.db');
const accountsDbPath = path.join(dataDir, 'accounts.db');

// 加密算法
const algorithm = 'aes-256-cbc';
const keyLength = 32; // for aes-256
const ivLength = 16; // for aes-256-cbc

// 派生密钥
function deriveKey(password, salt) {
  return crypto.scryptSync(password, salt, keyLength);
}

// 加密数据
function encrypt(text, password) {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;
}

// 解密数据
function decrypt(encrypted, password) {
  const parts = encrypted.split(':');
  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// 哈希密码
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

// 验证密码
function verifyPassword(password, hashed) {
  if (!hashed) {
    console.error('密码哈希值为空或未定义');
    return false;
  }
  
  const parts = hashed.split(':');
  if (parts.length !== 2) {
    console.error('密码哈希格式不正确:', hashed);
    return false;
  }
  
  const salt = Buffer.from(parts[0], 'hex');
  const hash = Buffer.from(parts[1], 'hex');
  const testHash = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hash, testHash);
}

// 初始化数据库
async function initDatabases() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '../node_modules/sql.js/dist/', file)
  });
  
  // 初始化用户数据库
  if (fs.existsSync(userDbPath)) {
    const userData = fs.readFileSync(userDbPath);
    userDb = new SQL.Database(userData);
  } else {
    userDb = new SQL.Database();
  }
  
  // 确保用户表存在
  userDb.run(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    hashed_password TEXT NOT NULL
  )`);
  
  // 初始化账户数据库
  if (fs.existsSync(accountsDbPath)) {
    const accountsData = fs.readFileSync(accountsDbPath);
    accountsDb = new SQL.Database(accountsData);
  } else {
    accountsDb = new SQL.Database();
  }
  
  // 确保账户表存在
  accountsDb.run(`CREATE TABLE IF NOT EXISTS accounts (
    user TEXT PRIMARY KEY,
    encrypted_data TEXT NOT NULL
  )`);
}

// 保存用户数据库到文件
function saveUserDatabaseToFile() {
  try {
    // 先导出数据
    const data = userDb.export();
    const buffer = new Uint8Array(data);
    
    // 创建临时文件，然后重命名为目标文件，这是一种原子操作
    const tempPath = userDbPath + '.tmp';
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, userDbPath);
    
    return true;
  } catch (error) {
    console.error('保存用户数据库失败:', error);
    return false;
  }
}

// 保存账户数据库到文件
function saveAccountsDatabaseToFile() {
  try {
    // 先导出数据
    const data = accountsDb.export();
    const buffer = new Uint8Array(data);
    
    // 创建临时文件，然后重命名为目标文件，这是一种原子操作
    const tempPath = accountsDbPath + '.tmp';
    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, accountsDbPath);
    
    return true;
  } catch (error) {
    console.error('保存账户数据库失败:', error);
    return false;
  }
}

// 用户注册
async function createUser(username, password) {
  try {
    const hashed = hashPassword(password);
    userDb.run(`INSERT INTO users (username, hashed_password) VALUES (?, ?)`, [username, hashed]);
    return saveUserDatabaseToFile();
  } catch (error) {
    console.error('创建用户失败:', error);
    // 检查是否是唯一性约束错误（用户名已存在）
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('UNIQUE constraint failed');
    }
    throw error;
  }
}

// 用户认证
async function authenticateUser(username, password) {
  let stmt;
  try {
    stmt = userDb.prepare(`SELECT hashed_password FROM users WHERE username = ?`);
    const row = stmt.get([username]);
    stmt.free();
    
    if (!row || !row.hashed_password) {
      console.log(`用户 ${username} 不存在或密码字段为空`);
      return false;
    }
    
    // 验证密码
    const isValid = verifyPassword(password, row.hashed_password);
    return isValid;
  } catch (error) {
    console.error('认证用户时发生错误:', error);
    return false;
  }
}

// 保存账户数据
async function saveAccounts(user, masterPassword, accounts) {
  try {
    const encrypted = encrypt(JSON.stringify(accounts), masterPassword);
    // 检查用户是否已有保存的数据
    const stmt = accountsDb.prepare(`SELECT user FROM accounts WHERE user = ?`);
    const row = stmt.get([user]);
    stmt.free();
    if (row) {
      // 更新现有数据
      accountsDb.run(`UPDATE accounts SET encrypted_data = ? WHERE user = ?`, [encrypted, user]);
    } else {
      // 插入新数据
      accountsDb.run(`INSERT INTO accounts (user, encrypted_data) VALUES (?, ?)`, [user, encrypted]);
    }
    return saveAccountsDatabaseToFile();
  } catch (error) {
    console.error('保存账户数据失败:', error);
    return false;
  }
}

// 加载账户数据
async function loadAccounts(user, masterPassword) {
  try {
    const stmt = accountsDb.prepare(`SELECT encrypted_data FROM accounts WHERE user = ?`);
    const row = stmt.get([user]);
    stmt.free();
    if (!row) return [];
    const decrypted = decrypt(row.encrypted_data, masterPassword);
    return JSON.parse(decrypted);
  } catch (e) {
    console.error('加载账户数据失败:', e);
    throw new Error('Invalid password');
  }
}

module.exports = {
  initDatabases,
  createUser,
  authenticateUser,
  saveAccounts,
  loadAccounts
};