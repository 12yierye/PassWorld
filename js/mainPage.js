// 平台列表
const platforms = [
  'Google', 'Facebook', 'Twitter', 'Instagram', 'GitHub', 'LinkedIn', 'YouTube',
  'Amazon', 'Netflix', 'Spotify', 'Discord', 'Reddit', 'WhatsApp', 'Telegram',
  'Microsoft', 'Apple', 'Steam', 'PayPal', 'Dropbox', 'Slack', 'Zoom', 'TikTok'
];

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = PassWorld.getCurrentUser();
  const masterPassword = PassWorld.getMasterPassword();
  if (!currentUser || !masterPassword) {
    window.location.href = 'login.html';
    return;
  }
  PassWorld.masterPassword = masterPassword; // 恢复到内存

  document.getElementById('user-info').textContent = `欢迎, ${currentUser}`;

  await loadAccounts();
  setupEventListeners();
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

function setupEventListeners() {
  document.getElementById('logout-btn').addEventListener('click', () => {
    PassWorld.logout();
    window.location.href = 'login.html';
  });

  document.getElementById('add-account-btn').addEventListener('click', () => {
    openModal('添加账户');
  });

  // 平台输入建议
  const platformInput = document.getElementById('platform-input');
  const suggestionsDiv = document.getElementById('platform-suggestions');

  platformInput.addEventListener('input', () => {
    const query = platformInput.value.toLowerCase().trim();
    if (query === '') {
      suggestionsDiv.style.display = 'none';
      return;
    }

    // 过滤平台：先以query开头，然后包含query
    const startsWith = platforms.filter(p => p.toLowerCase().startsWith(query));
    const contains = platforms.filter(p => p.toLowerCase().includes(query) && !p.toLowerCase().startsWith(query));
    const filtered = [...startsWith, ...contains].slice(0, 10); // 最多10个

    if (filtered.length > 0) {
      suggestionsDiv.innerHTML = filtered.map(p => `<div>${p}</div>`).join('');
      suggestionsDiv.style.display = 'block';

      // 添加点击事件
      suggestionsDiv.querySelectorAll('div').forEach(div => {
        div.addEventListener('click', () => {
          platformInput.value = div.textContent;
          suggestionsDiv.style.display = 'none';
        });
      });
    } else {
      suggestionsDiv.style.display = 'none';
    }
  });

  // 点击其他地方隐藏建议
  document.addEventListener('click', (e) => {
    if (!platformInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
      suggestionsDiv.style.display = 'none';
    }
  });

  document.getElementById('cancel-btn').addEventListener('click', closeModal);
  document.getElementById('save-btn').addEventListener('click', saveAccount);

  // 关闭模态框点击遮罩
  document.getElementById('account-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('account-modal')) closeModal();
  });
}

let editingIndex = null;

function openModal(title, account = null) {
  document.getElementById('modal-title').textContent = title;
  const modal = document.getElementById('account-modal');
  modal.style.display = 'flex';

  if (account) {
    editingIndex = account.index;
    document.getElementById('platform-input').value = account.platform;
    document.getElementById('account-username-input').value = account.username;
    document.getElementById('account-password-input').value = account.password;
  } else {
    editingIndex = null;
    document.getElementById('platform-input').value = '';
    document.getElementById('account-username-input').value = '';
    document.getElementById('account-password-input').value = '';
  }
}

function closeModal() {
  document.getElementById('account-modal').style.display = 'none';
}

const { ipcRenderer } = require('electron');

let accounts = [];

async function getAccounts() {
  return accounts;
}

async function saveAccountsToDb(accs) {
  const currentUser = PassWorld.getCurrentUser();
  const masterPassword = PassWorld.masterPassword;
  try {
    const result = await ipcRenderer.invoke('db-save-accounts', currentUser, masterPassword, accs);
    if (!result.success) {
      showError('保存失败: ' + result.error);
    } else {
      showSuccess('保存成功');
    }
  } catch (err) {
    showError('保存失败: ' + err.message);
  }
}

async function loadAccounts() {
  const currentUser = PassWorld.getCurrentUser();
  const masterPassword = PassWorld.masterPassword;
  try {
    const result = await ipcRenderer.invoke('db-load-accounts', currentUser, masterPassword);
    accounts = result.accounts || [];
    const tbody = document.getElementById('accounts-tbody');
    tbody.innerHTML = '';

    accounts.forEach((acc, index) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td title="${acc.platform}">${acc.platform}</td>
        <td title="${acc.username}">${acc.username}</td>
        <td class="password-cell" data-password="${acc.password}" title="${acc.password}"><span class="password-text">******</span></td>
        <td>
          <button class="action-btn edit" data-index="${index}">编辑</button>
          <button class="action-btn delete" data-index="${index}">删除</button>
        </td>
      `;
    });

    // 绑定操作按钮事件（委托）
    tbody.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit')) {
        const index = e.target.dataset.index;
        const acc = accounts[index];
        openModal('编辑账户', { ...acc, index });
      } else if (e.target.classList.contains('delete')) {
        const index = e.target.dataset.index;
        if (confirm('确定删除？')) {
          accounts.splice(index, 1);
          saveAccountsToDb(accounts);
          loadAccounts();
        }
      } else if (e.target.classList.contains('password-cell')) {
        const cell = e.target;
        const span = cell.querySelector('.password-text');
        if (span.textContent === '******') {
          span.textContent = cell.dataset.password;
        } else {
          span.textContent = '******';
        }
      }
    });
  } catch (err) {
    showError('加载失败: ' + err.message);
  }
}

async function saveAccount() {
  const platform = document.getElementById('platform-input').value.trim();
  const username = document.getElementById('account-username-input').value.trim();
  const password = document.getElementById('account-password-input').value;

  if (!platform || !username) {
    showError('平台和用户名必填');
    return;
  }

  if (editingIndex !== null) {
    accounts[editingIndex] = { platform, username, password };
  } else {
    accounts.push({ platform, username, password });
  }

  await saveAccountsToDb(accounts);
  loadAccounts();
  closeModal();
}