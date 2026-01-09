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
  localStorage.setItem(`masterPassword_${username}`, masterPassword); // 持久化存储主密码
  PassWorld.masterPassword = masterPassword; // 也存储在内存中
};

// 获取主密码
PassWorld.getMasterPassword = () => {
  const currentUser = PassWorld.getCurrentUser();
  return sessionStorage.getItem('masterPassword') || 
         (currentUser ? localStorage.getItem(`masterPassword_${currentUser}`) : null) || 
         PassWorld.masterPassword;
};

// 注销
PassWorld.logout = () => {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('masterPassword');
  delete PassWorld.masterPassword;
  // 不清除本地存储的主密码，以便下次登录时使用
};