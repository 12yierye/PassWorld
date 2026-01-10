

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

// 初始化窗口控制按钮
function initWindowControlButtons() {
  console.log('初始化窗口控制按钮 (register.html)');
  console.log('window.electron对象:', window.electron);
  
  // 直接绑定事件
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');
  
  console.log('按钮元素:', { minimizeBtn, maximizeBtn, closeBtn });
  
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      console.log('点击最小化按钮');
      window.electron.minimizeWindow().catch(err => console.error('最小化失败:', err));
    });
  }
  
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      console.log('点击最大化按钮');
      window.electron.toggleMaximizeWindow().catch(err => console.error('最大化失败:', err));
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('点击关闭按钮');
      window.electron.closeWindow().catch(err => console.error('关闭失败:', err));
    });
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  initWindowControlButtons();
});

document.getElementById('register-btn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();

  if (!username) {
    showError('请输入用户名');
    return;
  }

  // 禁用按钮以防止重复提交
  const registerBtn = document.getElementById('register-btn');
  registerBtn.disabled = true;
  registerBtn.textContent = '注册中...';

  try {
    // 生成随机密码用于注册（内部使用，用户不需要知道）
    const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const result = await window.electron.invoke('db-create-user', username, randomPassword);
    if (result.success) {
      showSuccess('注册成功！');
      
      // 2秒后跳转到登录页面
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
    if (!document.querySelector('.success-section')) {
      registerBtn.disabled = false;
      registerBtn.textContent = '注册';
    }
  }
});

document.getElementById('back-to-login-btn').addEventListener('click', () => {
  window.location.href = 'login.html';
});