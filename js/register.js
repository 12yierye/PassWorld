const { ipcRenderer } = require('electron');

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000); // 5秒后隐藏
}

document.getElementById('register-btn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!username || !password || !confirmPassword) {
    showError('请输入用户名和密码');
    return;
  }

  if (password.length < 6) {
    showError('密码至少6位');
    return;
  }

  if (password !== confirmPassword) {
    showError('两次输入的密码不一致');
    return;
  }

  try {
    const result = await ipcRenderer.invoke('db-create-user', username, password);
    if (result.success) {
      showError('注册成功，请返回登录');
    } else {
      // 检查是否是用户名已存在的错误
      if (result.error && result.error.includes('UNIQUE constraint failed')) {
        showError('用户名已存在，请选择其他用户名');
      } else {
        showError('注册失败: ' + result.error);
      }
    }
  } catch (err) {
    showError('注册失败: ' + err.message);
  }
});

document.getElementById('back-to-login-btn').addEventListener('click', () => {
  window.location.href = 'login.html';
});