const { ipcRenderer } = require('electron');

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000); // 5秒后隐藏
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showError('请输入用户名和密码');
    return;
  }

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
  }
});

document.getElementById('go-to-register-btn').addEventListener('click', () => {
  window.location.href = 'register.html';
});