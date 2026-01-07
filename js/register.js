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

  // 禁用按钮以防止重复提交
  const registerBtn = document.getElementById('register-btn');
  registerBtn.disabled = true;
  registerBtn.textContent = '注册中...';

  try {
    const result = await ipcRenderer.invoke('db-create-user', username, password);
    if (result.success) {
      showSuccess('注册成功！');
      // 清空表单
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      document.getElementById('confirm-password').value = '';
      
      // 2秒后自动跳转到登录页面
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
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
  } finally {
    // 重新启用按钮
    registerBtn.disabled = false;
    registerBtn.textContent = '注册';
  }
});

document.getElementById('back-to-login-btn').addEventListener('click', () => {
  window.location.href = 'login.html';
});