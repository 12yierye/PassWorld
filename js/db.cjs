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
  if (!encrypted) {
    console.error('Attempting to decrypt empty or undefined data');
    return '';
  }
  
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    console.error('Invalid encrypted data format, parts:', parts);
    throw new Error('Invalid encrypted data format');
  }
  
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
  console.log(`Preparing to hash password: ${password}`); // 调试信息
  
  if (!password) {
    console.error('Attempting to hash empty password');
    return null;
  }
  
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  const result = salt.toString('hex') + ':' + hash.toString('hex');
  
  console.log(`Generated hash: ${result.substring(0, 30)}...`); // 输出哈希值的前30个字符用于调试
  return result;
}

// 验证密码
function verifyPassword(password, hashed) {
  console.log(`Verifying password: ${password}, hash: ${hashed ? hashed.substring(0, 30) + '...' : 'null'}`); // 调试信息
  
  if (!hashed) {
    console.error('Password hash is null or undefined');
    return false;
  }
  
  const parts = hashed.split(':');
  if (parts.length !== 2) {
    console.error('Password hash format is incorrect:', hashed);
    return false;
  }
  
  const salt = Buffer.from(parts[0], 'hex');
  const hash = Buffer.from(parts[1], 'hex');
  const testHash = crypto.scryptSync(password, salt, 64);
  const isValid = crypto.timingSafeEqual(hash, testHash);
  
  console.log(`Password verification result: ${isValid}`);
  return isValid;
}

// 初始化数据库
async function initDatabases() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '../node_modules/sql.js/dist/', file)
  });
  
  // 初始化用户数据库
  console.log(`Checking user database file: ${userDbPath}, exists: ${fs.existsSync(userDbPath)}`);
  if (fs.existsSync(userDbPath)) {
    const userData = fs.readFileSync(userDbPath);
    userDb = new SQL.Database(userData);
    // 验证数据库中是否有用户数据
    try {
      const stmt = userDb.prepare("SELECT COUNT(*) as count FROM users");
      const result = stmt.getAsObject();
      console.log(`User database user table record count: ${result.count}`);
      stmt.free();
    } catch (error) {
      console.error('Error counting users:', error);
    }
  } else {
    userDb = new SQL.Database();
    console.log('Creating new empty user database');
  }
  
  // 确保用户表存在
  userDb.run(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    hashed_password TEXT NOT NULL
  )`);
  
  // 初始化账户数据库
  console.log(`Checking account database file: ${accountsDbPath}, exists: ${fs.existsSync(accountsDbPath)}`);
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
    console.error('Saving user database failed:', error);
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
    console.error('Saving account database failed:', error);
    return false;
  }
}

// 用户注册
async function createUser(username, password) {
  try {
    // 确保密码不为空
    if (!password) {
      throw new Error('Password cannot be empty');
    }
    
    const hashed = hashPassword(password);
    console.log(`Creating account for user ${username}, hash: ${hashed.substring(0, 20)}...`); // 输出哈希值的前20个字符用于调试
    
    userDb.run(`INSERT INTO users (username, hashed_password) VALUES (?, ?)`, [username, hashed]);
    const success = saveUserDatabaseToFile();
    
    if (success) {
      console.log(`User ${username} created successfully`);
    } else {
      console.error(`Failed to save user ${username} to database`);
    }
    
    return success;
  } catch (error) {
    console.error('Creating user failed:', error);
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
    console.log(`Starting authentication for user: ${username}, current database user table total record count:`);
    try {
      const countStmt = userDb.prepare("SELECT COUNT(*) as count FROM users");
      const countResult = countStmt.getAsObject();
      console.log(`- Total users in database: ${countResult.count}`);
      countStmt.free();
      
      // 查询具体的用户记录
      const userCheckStmt = userDb.prepare("SELECT username, hashed_password IS NULL as is_null, hashed_password FROM users WHERE username = ?");
      const userCheckResult = userCheckStmt.get([username]);
      if (userCheckResult) {
        console.log(`- User ${username} status in database - hashed_password_is_null: ${userCheckResult.is_null}, hashed_password_exists: ${!!userCheckResult.hashed_password}`);
      } else {
        console.log(`- User ${username} does not exist in database`);
      }
      userCheckStmt.free();
    } catch (countErr) {
      console.error('Error counting users:', countErr);
    }

    stmt = userDb.prepare(`SELECT hashed_password FROM users WHERE username = ?`);
    const row = stmt.get([username]);
    stmt.free();
    
    // 根据数据库查询结果有效性验证规范，验证查询结果
    if (!row) {
      console.log(`User ${username} does not exist`);
      return false;
    }
    
    if (!row.hashed_password) {
      console.log(`User ${username} exists but password field is empty`);
      return false;
    }
    
    // 验证密码
    const isValid = verifyPassword(password, row.hashed_password);
    if (!isValid) {
      console.log(`User ${username} password verification failed`);
    } else {
      console.log(`User ${username} authentication successful`);
    }
    return isValid;
  } catch (error) {
    console.error('Error authenticating user:', error);
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
    console.error('Saving account data failed:', error);
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
    console.error('Loading account data failed:', e);
    throw new Error('Invalid password');
  }
}

// 检查用户是否存在
async function checkUserExists(username) {
  let stmt;
  try {
    stmt = userDb.prepare(`SELECT 1 FROM users WHERE username = ?`);
    const row = stmt.get([username]);
    stmt.free();
    return !!row; // 如果查询结果不为null，则用户存在
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
}

module.exports = {
  initDatabases,
  createUser,
  authenticateUser,
  checkUserExists, // 导出新函数
  saveAccounts,
  loadAccounts
};