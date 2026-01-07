const initSqlJs = require('sql.js/dist/sql-asm.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// 数据库 - 使用 sql.js 内存数据库
let db;

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
  const parts = hashed.split(':');
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
  db = new SQL.Database();
  
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    hashed_password TEXT NOT NULL
  )`);

  // 账户表
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    user TEXT PRIMARY KEY,
    encrypted_data TEXT NOT NULL
  )`);
}

// 用户注册
async function createUser(username, password) {
  const hashed = hashPassword(password);
  db.run(`INSERT INTO users (username, hashed_password) VALUES (?, ?)`, [username, hashed]);
}

// 用户认证
async function authenticateUser(username, password) {
  const stmt = db.prepare(`SELECT hashed_password FROM users WHERE username = ?`);
  const row = stmt.get([username]);
  stmt.free();
  if (!row) return false;
  return verifyPassword(password, row.hashed_password);
}

// 保存账户数据
async function saveAccounts(user, masterPassword, accounts) {
  const encrypted = encrypt(JSON.stringify(accounts), masterPassword);
  // 检查用户是否已有保存的数据
  const stmt = db.prepare(`SELECT user FROM accounts WHERE user = ?`);
  const row = stmt.get([user]);
  stmt.free();
  if (row) {
    // 更新现有数据
    db.run(`UPDATE accounts SET encrypted_data = ? WHERE user = ?`, [encrypted, user]);
  } else {
    // 插入新数据
    db.run(`INSERT INTO accounts (user, encrypted_data) VALUES (?, ?)`, [user, encrypted]);
  }
}

// 加载账户数据
async function loadAccounts(user, masterPassword) {
  const stmt = db.prepare(`SELECT encrypted_data FROM accounts WHERE user = ?`);
  const row = stmt.get([user]);
  stmt.free();
  if (!row) return [];
  try {
    const decrypted = decrypt(row.encrypted_data, masterPassword);
    return JSON.parse(decrypted);
  } catch (e) {
    // 解密失败，可能是密码错误
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