const { ipcRenderer } = require('electron');

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  // 隐藏成功消息（如果正在显示）
  document.getElementById('success-message').style.display = 'none';
  
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000); // 5秒后隐藏
}

function showSuccess(message) {
  const successDiv = document.getElementById('success-message');
  successDiv.textContent = message;
  successDiv.style.display = 'block';
  
  // 隐藏错误消息（如果正在显示）
  document.getElementById('error-message').style.display = 'none';
  
  setTimeout(() => {
    successDiv.style.display = 'none';
  }, 5000); // 5秒后隐藏
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showError('请输入用户名和密码');
    return;
  }

  // 禁用按钮以防止重复提交
  const loginBtn = document.getElementById('login-btn');
  loginBtn.disabled = true;
  loginBtn.textContent = '登录中...';

  try {
    const result = await ipcRenderer.invoke('db-authenticate', username, password);
    if (result.success) {
      PassWorld.loginUser(username, password);
      window.location.href = 'mainPage.html';
    } else {
      showError('用户名或密码错误');
    }
  } catch (err) {
    showError('登录失败: ' + err.message);
  } finally {
    // 无论成功还是失败，都要重新启用按钮
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login';
  }
});

