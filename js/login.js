

// 初始化标题栏按钮
document.addEventListener('DOMContentLoaded', () => {
  initWindowControlButtons();
});

// 初始化窗口控制按钮
function initWindowControlButtons() {
  console.log('Initializing window control buttons (login.html)');
  console.log('window.electron object:', window.electron);
  
  // 直接绑定事件，不使用可选链
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');
  
  console.log('Button elements:', { minimizeBtn, maximizeBtn, closeBtn });
  
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      console.log('Minimize button clicked');
      window.electron.minimizeWindow().catch(err => console.error('Minimize failed:', err));
    });
  }
  
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      console.log('Maximize button clicked');
      window.electron.toggleMaximizeWindow().catch(err => console.error('Maximize failed:', err));
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('Close button clicked');
      window.electron.closeWindow().catch(err => console.error('Close failed:', err));
    });
  }
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();

  if (!username) {
    showError('请输入用户名');
    return;
  }

  // 检查用户是否存在
  try {
    const result = await window.electron.invoke('db-check-user', username);
    if (result.exists) {
      // 用户存在，跳转到人脸识别页面
      window.location.href = `faceAuth.html?username=${encodeURIComponent(username)}&action=login`;
    } else {
      // 用户不存在，显示错误提示
      showError('用户不存在');
    }
  } catch (err) {
    showError('检查用户失败: ' + err.message);
  }
});

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

document.getElementById('face-id-btn').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();

  if (!username) {
    showError('请输入用户名');
    return;
  }

  // 禁用按钮以防止重复提交
  const faceIdBtn = document.getElementById('face-id-btn');
  faceIdBtn.disabled = true;
  faceIdBtn.textContent = '验证中...';

  // 显示人脸识别加载界面
  document.getElementById('face-id-section').innerHTML = `
    <div class="face-id-loading">
      <div class="spinner"></div>
      <p>人脸识别中...</p>
      <p>请直视摄像头</p>
    </div>
  `;

  try {
    // 模拟人脸识别，延时0.8秒后进入主界面
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 由于是假人脸识别，我们直接进入主界面
    // 在实际应用中，这里应该验证用户是否存在
    const result = await window.electron.invoke('db-check-user', username);
    if (result.exists) {
      // 尝试从本地存储获取主密码（如果有）
      const savedMasterPassword = localStorage.getItem(`masterPassword_${username}`) || 'default_password';
      // 设置当前用户
      PassWorld.loginUser(username, savedMasterPassword);
      window.location.href = 'mainPage.html';
    } else {
      showError('用户不存在');
      // 重新启用按钮并恢复原始界面
      faceIdBtn.disabled = false;
      faceIdBtn.textContent = '人脸识别登录';
      document.getElementById('face-id-section').innerHTML = `
        <div id="face-id-loading" class="face-id-loading">
          <div class="spinner"></div>
          <p>正在扫描面部特征...</p>
        </div>
      `;
    }
  } catch (err) {
    showError('登录失败: ' + err.message);
    // 重新启用按钮并恢复原始界面
    faceIdBtn.disabled = false;
    faceIdBtn.textContent = '人脸识别登录';
    document.getElementById('face-id-section').innerHTML = `
      <div id="face-id-loading" class="face-id-loading">
        <div class="spinner"></div>
        <p>正在扫描面部特征...</p>
      </div>
    `;
  }
});

// 页面加载完成后隐藏人脸识别加载界面
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('face-id-loading').style.display = 'none';
});