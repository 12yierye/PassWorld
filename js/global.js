// 全局工具函数或状态
window.PassWorld = window.PassWorld || {};

// 检查是否已登录
PassWorld.isLoggedIn = () => {
  return !!localStorage.getItem('currentUser');
};

// 获取当前用户
PassWorld.getCurrentUser = () => {
  return localStorage.getItem('currentUser');
};

// 保存用户
PassWorld.loginUser = (username, masterPassword) => {
  localStorage.setItem('currentUser', username);
  sessionStorage.setItem('masterPassword', masterPassword);
  PassWorld.masterPassword = masterPassword; // 也存储在内存中
};

// 获取主密码
PassWorld.getMasterPassword = () => {
  return sessionStorage.getItem('masterPassword') || PassWorld.masterPassword;
};

// 注销
PassWorld.logout = () => {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('masterPassword');
  delete PassWorld.masterPassword;
  localStorage.removeItem('accounts'); // 可选：是否清除数据
};