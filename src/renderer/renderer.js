// 简单的密码管理应用逻辑
document.addEventListener('DOMContentLoaded', () => {
  // DOM元素引用
  const authSection = document.getElementById('auth-section');
  const accountsSection = document.getElementById('accounts-section');
  const userInfo = document.getElementById('user-info');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const addAccountBtn = document.getElementById('add-account-btn');
  const accountModal = document.getElementById('account-modal');
  const cancelBtn = document.getElementById('cancel-btn');
  const saveBtn = document.getElementById('save-btn');
  const accountsTbody = document.getElementById('accounts-tbody');
  
  // 表单元素
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const platformInput = document.getElementById('platform-input');
  const accountUsernameInput = document.getElementById('account-username-input');
  const accountPasswordInput = document.getElementById('account-password-input');
  const modalTitle = document.getElementById('modal-title');
  
  // 全局状态
  let isLoggedIn = false;
  let currentUsername = '';
  let accounts = [];
  let editingAccountId = null;
  let showPasswordMap = {};

  // 初始化应用
  initApp();

  function initApp() {
    // 检查登录状态
    const storedUsername = localStorage.getItem('currentUsername');
    if (storedUsername) {
      currentUsername = storedUsername;
      isLoggedIn = true;
      showAccountsView();
    } else {
      showLoginView();
    }

    // 加载账户数据
    const storedAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    accounts = storedAccounts;

    // 绑定事件监听器
    bindEventListeners();
    
    // 渲染账户列表
    renderAccounts();
  }

  function bindEventListeners() {
    // 登录事件
    loginBtn.addEventListener('click', handleLogin);
    
    // 登出事件
    logoutBtn.addEventListener('click', handleLogout);
    
    // 添加账户按钮
    addAccountBtn.addEventListener('click', () => openModal());
    
    // 保存和取消按钮
    saveBtn.addEventListener('click', saveAccount);
    cancelBtn.addEventListener('click', closeModal);
  }

  function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
      alert('请输入用户名和密码');
      return;
    }
    
    // 简单验证（实际应用中应该有更安全的验证）
    currentUsername = username;
    isLoggedIn = true;
    
    // 保存用户名到本地存储
    localStorage.setItem('currentUsername', username);
    
    showAccountsView();
  }

  function handleLogout() {
    isLoggedIn = false;
    currentUsername = '';
    localStorage.removeItem('currentUsername');
    
    usernameInput.value = '';
    passwordInput.value = '';
    
    showLoginView();
  }

  function showLoginView() {
    authSection.style.display = 'block';
    accountsSection.style.display = 'none';
    userInfo.textContent = '未登录';
  }

  function showAccountsView() {
    authSection.style.display = 'none';
    accountsSection.style.display = 'block';
    userInfo.textContent = `${currentUsername}，已登录`;
    
    // 重新渲染账户列表
    renderAccounts();
  }

  function openModal(account = null) {
    if (account) {
      // 编辑模式
      editingAccountId = account.id;
      modalTitle.textContent = '编辑账户';
      platformInput.value = account.platform || '';
      accountUsernameInput.value = account.username || '';
      accountPasswordInput.value = account.password || '';
    } else {
      // 添加模式
      editingAccountId = null;
      modalTitle.textContent = '添加账户';
      platformInput.value = '';
      accountUsernameInput.value = '';
      accountPasswordInput.value = '';
    }
    
    accountModal.style.display = 'flex';
  }

  function closeModal() {
    accountModal.style.display = 'none';
    editingAccountId = null;
  }

  function saveAccount() {
    const platform = platformInput.value.trim();
    const username = accountUsernameInput.value.trim();
    const password = accountPasswordInput.value;
    
    if (!platform || !username || !password) {
      alert('请填写所有字段');
      return;
    }
    
    if (editingAccountId) {
      // 更新现有账户
      const index = accounts.findIndex(acc => acc.id === editingAccountId);
      if (index !== -1) {
        accounts[index] = {
          ...accounts[index],
          platform,
          username,
          password
        };
      }
    } else {
      // 添加新账户
      const newAccount = {
        id: Date.now(),
        platform,
        username,
        password
      };
      accounts.push(newAccount);
    }
    
    // 保存到本地存储
    localStorage.setItem('accounts', JSON.stringify(accounts));
    
    // 更新UI
    renderAccounts();
    
    // 关闭模态框
    closeModal();
  }

  function deleteAccount(id) {
    if (confirm('确定要删除这个账户吗？')) {
      accounts = accounts.filter(acc => acc.id !== id);
      localStorage.setItem('accounts', JSON.stringify(accounts));
      renderAccounts();
    }
  }

  function renderAccounts() {
    // 清空现有内容
    accountsTbody.innerHTML = '';
    
    // 添加账户行
    accounts.forEach(account => {
      const row = document.createElement('tr');
      
      // 显示密码的处理
      const isPasswordVisible = showPasswordMap[account.id] || false;
      const passwordDisplay = isPasswordVisible ? account.password : '••••••••';
      
      row.innerHTML = `
        <td>${escapeHtml(account.platform)}</td>
        <td>${escapeHtml(account.username)}</td>
        <td class="password-cell">${passwordDisplay} 
          <button class="toggle-password-btn" data-id="${account.id}" style="margin-left: 10px; padding: 2px 6px; font-size: 12px;">
            ${isPasswordVisible ? '隐藏' : '显示'}
          </button>
        </td>
        <td>
          <button class="action-btn edit" data-id="${account.id}">编辑</button>
          <button class="action-btn delete" data-id="${account.id}">删除</button>
        </td>
      `;
      
      accountsTbody.appendChild(row);
    });
    
    // 为编辑和删除按钮添加事件监听器
    document.querySelectorAll('.action-btn.edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        const account = accounts.find(acc => acc.id === id);
        if (account) openModal(account);
      });
    });
    
    document.querySelectorAll('.action-btn.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        deleteAccount(id);
      });
    });
    
    // 为密码显示/隐藏按钮添加事件监听器
    document.querySelectorAll('.toggle-password-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        showPasswordMap[id] = !showPasswordMap[id];
        renderAccounts(); // 重新渲染以更新密码显示状态
      });
    });
  }

  // 简单的HTML转义函数，防止XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});