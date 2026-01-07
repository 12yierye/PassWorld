import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库路径
const dataDir = path.join(__dirname, '..', 'data');
const usersDbPath = path.join(dataDir, 'users.db');
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
  const parts = hashed.split(':');
  const salt = Buffer.from(parts[0], 'hex');
  const hash = Buffer.from(parts[1], 'hex');
  const testHash = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hash, testHash);
}

// 初始化数据库
function initDatabases() {
  // 用户数据库
  const usersDb = new sqlite3.Database(usersDbPath);
  usersDb.serialize(() => {
    usersDb.run(`CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      hashed_password TEXT NOT NULL
    )`);
  });
  usersDb.close();

  // 账户数据库
  const accountsDb = new sqlite3.Database(accountsDbPath);
  accountsDb.serialize(() => {
    accountsDb.run(`CREATE TABLE IF NOT EXISTS accounts (
      user TEXT PRIMARY KEY,
      encrypted_data TEXT NOT NULL
    )`);
  });
  accountsDb.close();
}

// 用户相关
function createUser(username, password) {
  return new Promise((resolve, reject) => {
    const hashed = hashPassword(password);
    const usersDb = new sqlite3.Database(usersDbPath);
    usersDb.run('INSERT INTO users (username, hashed_password) VALUES (?, ?)', [username, hashed], function(err) {
      usersDb.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

function authenticateUser(username, password) {
  return new Promise((resolve, reject) => {
    const usersDb = new sqlite3.Database(usersDbPath);
    usersDb.get('SELECT hashed_password FROM users WHERE username = ?', [username], (err, row) => {
      usersDb.close();
      if (err) reject(err);
      else if (!row) resolve(false);
      else resolve(verifyPassword(password, row.hashed_password));
    });
  });
}

// 账户相关
function saveAccounts(user, masterPassword, accounts) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(accounts);
    const encrypted = encrypt(data, masterPassword);
    const accountsDb = new sqlite3.Database(accountsDbPath);
    accountsDb.run('INSERT OR REPLACE INTO accounts (user, encrypted_data) VALUES (?, ?)', [user, encrypted], function(err) {
      accountsDb.close();
      if (err) reject(err);
      else resolve();
    });
  });
}

function loadAccounts(user, masterPassword) {
  return new Promise((resolve, reject) => {
    const accountsDb = new sqlite3.Database(accountsDbPath);
    accountsDb.get('SELECT encrypted_data FROM accounts WHERE user = ?', [user], (err, row) => {
      accountsDb.close();
      if (err) reject(err);
      else if (!row) resolve([]);
      else {
        try {
          const decrypted = decrypt(row.encrypted_data, masterPassword);
          resolve(JSON.parse(decrypted));
        } catch (e) {
          reject(new Error('Invalid master password'));
        }
      }
    });
  });
}

export {
  initDatabases,
  createUser,
  authenticateUser,
  saveAccounts,
  loadAccounts
};