// 平台列表
const platforms = [
  'Google', 'Facebook', 'Twitter', 'Instagram', 'GitHub', 'LinkedIn', 'YouTube',
  'Amazon', 'Netflix', 'Spotify', 'Discord', 'Reddit', 'WhatsApp', 'Telegram',
  'Microsoft', 'Apple', 'Steam', 'PayPal', 'Dropbox', 'Slack', 'Zoom', 'TikTok',
  'Meta', 'Twitch', 'Pinterest', 'Snapchat', 'Flickr', 'Vimeo', 'Adobe',
  'Salesforce', 'Oracle', 'SAP', 'IBM', 'Cisco', 'Intel', 'HP', 'Dell',
  'Lenovo', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Tesla', 'SpaceX', 'Uber',
  'Airbnb', 'Shopify', 'WordPress'
];

// 彩蛋相关变量
let clickCount = 0;
let clickTimer;
let isEggActive = false;

// 保存状态相关变量
let isSaving = false; // 标记是否正在保存
let isCancelForced = false; // 标记是否强制取消

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

  // 显示加载状态
  const tbody = document.getElementById('accounts-tbody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="loading-state">
          <div style="text-align: center; padding: 20px; color: #999;">
            <p>正在加载账户数据...</p>
          </div>
        </td>
      </tr>
    `;
  }

  // 异步加载账户数据
  await loadAccounts();
  setupEventListeners();
});

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {  // 检查元素是否存在
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // 隐藏成功消息（如果正在显示）
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
      successDiv.classList.add('hidden');
    }
    
    setTimeout(() => {
      if (errorDiv) {  // 检查元素是否存在
        errorDiv.classList.add('hidden');
      }
    }, 5000); // 5秒后隐藏
  }
}

function showSuccess(message) {
  const successDiv = document.getElementById('success-message');
  if (successDiv) {  // 检查元素是否存在
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    
    // 隐藏错误消息（如果正在显示）
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
    
    setTimeout(() => {
      if (successDiv) {  // 检查元素是否存在
        successDiv.classList.add('hidden');
      }
    }, 5000); // 5秒后隐藏
  }
}

function showModalError(message) {
  const errorDiv = document.getElementById('modal-error-message');
  if (errorDiv) {  // 检查元素是否存在
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // 5秒后隐藏错误消息
    setTimeout(() => {
      if (errorDiv) {  // 再次检查元素是否存在
        errorDiv.classList.add('hidden');
      }
    }, 5000);
  }
}

function hideModalError() {
  const errorDiv = document.getElementById('modal-error-message');
  if (errorDiv) {  // 检查元素是否存在
    errorDiv.classList.add('hidden');
  }
}

function setupEventListeners() {
  document.getElementById('logout-btn').addEventListener('click', () => {
    PassWorld.logout();
    window.location.href = 'login.html';
  });

  // 添加账户按钮点击事件，用于彩蛋检测
  document.getElementById('add-account-btn').addEventListener('click', () => {
    // 检查彩蛋条件：3分钟内点击超过20次
    if (!clickTimer) {
      clickTimer = setTimeout(() => {
        clickCount = 0;
        clickTimer = null;
      }, 3 * 60 * 1000); // 3分钟
    }

    clickCount++;

    if (clickCount > 20 && !isEggActive) {
      isEggActive = true;
      alert('真的有这么多账户吗 o(>﹏<)o');
      // 重置计数
      setTimeout(() => {
        clickCount = 0;
        isEggActive = false;
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
      }, 1000);
    }

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

  // 为取消按钮添加事件监听器
  document.getElementById('cancel-btn').addEventListener('click', handleCancel);
  document.getElementById('save-btn').addEventListener('click', saveAccount);

  // 关闭模态框点击遮罩 - 修复死循环问题
  document.getElementById('account-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('account-modal')) {
      handleCancel();
    }
  });
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
      // 检查是否在添加/编辑账户的模态框中
      if (editingIndex !== null || document.getElementById('modal-title').textContent === '添加账户') {
        showModalError('保存失败: ' + result.error);
        // 抛出错误，让调用方知道保存失败了
        throw new Error(result.error);
      } else {
        showError('保存失败: ' + result.error);
        // 抛出错误，让调用方知道保存失败了
        throw new Error(result.error);
      }
    } else {
      showSuccess('保存成功');
      // 返回成功结果（不再在这里关闭模态框）
      return result;
    }
  } catch (err) {
    // 检查是否在添加/编辑账户的模态框中
    if (editingIndex !== null || document.getElementById('modal-title').textContent === '添加账户') {
      showModalError('保存失败: ' + err.message);
    } else {
      showError('保存失败: ' + err.message);
    }
    // 抛出错误，让调用方知道保存失败了
    throw err;
  }
}

async function loadAccounts() {
  const currentUser = PassWorld.getCurrentUser();
  const masterPassword = PassWorld.masterPassword;
  try {
    console.log('开始加载账户数据...');
    const result = await ipcRenderer.invoke('db-load-accounts', currentUser, masterPassword);
    console.log('账户数据加载完成:', result);
    accounts = result.accounts || [];
    const tbody = document.getElementById('accounts-tbody');
    
    if (tbody) {  // 检查元素是否存在
      // 清空表格内容 - 使用更彻底的方式清除所有子元素
      while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
      }

      // 检查是否有账户数据，如果没有则显示空状态
      if (accounts.length === 0) {
        const emptyRow = tbody.insertRow();
        const emptyCell = emptyRow.insertCell(0);
        emptyCell.colSpan = 4;
        emptyCell.className = 'empty-state-cell';
        
        const emptyContent = document.createElement('div');
        emptyContent.className = 'empty-state-content';
        emptyContent.textContent = '空空如也，请添加账户';
        
        emptyCell.appendChild(emptyContent);
      } else {
        accounts.forEach((acc, index) => {
          const row = tbody.insertRow();
          
          // 创建并填充平台单元格
          const platformCell = row.insertCell();
          platformCell.title = acc.platform;
          platformCell.textContent = acc.platform;
          
          // 创建并填充用户名单元格
          const usernameCell = row.insertCell();
          usernameCell.title = acc.username;
          usernameCell.textContent = acc.username;
          
          // 创建并填充密码单元格
          const passwordCell = row.insertCell();
          passwordCell.className = 'password-cell';
          passwordCell.setAttribute('data-password', acc.password);
          passwordCell.title = acc.password;
          
          const passwordSpan = document.createElement('span');
          passwordSpan.className = 'password-text';
          passwordSpan.textContent = '******';
          
          passwordCell.appendChild(passwordSpan);
          
          // 创建并填充操作单元格
          const actionCell = row.insertCell();
          
          const editButton = document.createElement('button');
          editButton.className = 'action-btn edit';
          editButton.dataset.index = index;
          editButton.textContent = '编辑';
          
          const deleteButton = document.createElement('button');
          deleteButton.className = 'action-btn delete';
          deleteButton.dataset.index = index;
          deleteButton.textContent = '删除';
          
          actionCell.appendChild(editButton);
          actionCell.appendChild(deleteButton);
        });
      }

      // 绑定操作按钮事件（委托）
      tbody.removeEventListener('click', handleTableClick); // 防止重复绑定
      tbody.addEventListener('click', handleTableClick);
    }
  } catch (err) {
    console.error('加载账户失败:', err);
    // 如果是新用户没有账户数据，这可能是正常的，所以不显示错误
    // 仍然显示空状态
    const tbody = document.getElementById('accounts-tbody');
    if (tbody) {  // 检查元素是否存在
      // 清空表格内容 - 使用更彻底的方式清除所有子元素
      while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
      }
      
      const emptyRow = tbody.insertRow();
      const emptyCell = emptyRow.insertCell(0);
      emptyCell.colSpan = 4;
      emptyCell.className = 'empty-state-cell';
      
      const emptyContent = document.createElement('div');
      emptyContent.className = 'empty-state-content';
      emptyContent.textContent = '空空如也，请添加账户';
      
      emptyCell.appendChild(emptyContent);
    }
  }
}

// 将表格点击处理函数独立出来，避免重复绑定
function handleTableClick(e) {
  if (e.target.classList.contains('edit')) {
    const index = e.target.dataset.index;
    const acc = accounts[index];
    openModal('编辑账户', { ...acc, index });
  } else if (e.target.classList.contains('delete')) {
    const index = e.target.dataset.index;
    if (confirm('确定删除？')) {
      accounts.splice(index, 1);
      // 保存账户并等待完成后再重新加载
      saveAccountsToDb(accounts)
        .then(() => {
          // 保存成功后重新加载账户列表
          return loadAccounts();
        })
        .catch(err => {
          // 删除操作不在模态框中，所以可以显示在主界面上
          showError('删除失败: ' + err.message);
        });
    }
  } else if (e.target.classList.contains('password-cell') || e.target.classList.contains('password-text')) {
    let cell;
    if (e.target.classList.contains('password-text')) {
      cell = e.target.closest('.password-cell');
    } else {
      cell = e.target;
    }
    if (cell) {
      const span = cell.querySelector('.password-text');
      if (span) {
        if (span.textContent === '******') {
          span.textContent = cell.dataset.password;
        } else {
          span.textContent = '******';
        }
      }
    }
  }
}

let editingIndex = null;

function openModal(title, account = null) {
  document.getElementById('modal-title').textContent = title;
  const modal = document.getElementById('account-modal');
  // 移除可能存在的关闭类
  modal.classList.remove('closing', 'hidden');
  // 确保显示状态正确
  modal.style.display = 'flex';
  // 清除任何现有的错误消息
  hideModalError();
  // 触发重排以确保display生效
  void modal.offsetWidth;
  // 添加show类以显示动画
  modal.classList.add('show');
  // 防止页面抖动
  document.body.style.overflow = 'hidden';

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

function handleCancel() {
  // 如果正在保存中，询问是否强制取消
  if (isSaving && !isCancelForced) {
    if (confirm('数据正在保存中，是否强制取消？')) {
      isCancelForced = true;
      closeModal();
      isCancelForced = false; // 重置状态
    }
  } else {
    closeModal();
  }
}

function closeModal() {
  const modal = document.getElementById('account-modal');
  // 添加关闭动画类
  modal.classList.add('closing');
  
  // 动画结束后隐藏模态框
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('show', 'closing');
    // 清除错误消息
    hideModalError();
    // 恢复页面滚动
    document.body.style.overflow = '';
  }, 150); // 与CSS中的动画时长匹配
}

async function saveAccount() {
  // 如果正在保存，直接返回
  if (isSaving) return;
  
  const platform = document.getElementById('platform-input').value.trim();
  const username = document.getElementById('account-username-input').value.trim();
  const password = document.getElementById('account-password-input').value;

  if (!platform || !username) {
    showModalError('平台和用户名必填');
    return;
  }

  // 设置保存状态，禁用保存按钮并显示加载状态
  isSaving = true;
  const saveBtn = document.getElementById('save-btn');
  const originalText = saveBtn.textContent;
  saveBtn.innerHTML = '<span class="loading-spinner"></span> 保存中...';
  saveBtn.disabled = true;

  if (editingIndex !== null) {
    accounts[editingIndex] = { platform, username, password };
  } else {
    accounts.push({ platform, username, password });
  }

  try {
    // 等待数据保存完成后再关闭模态框
    await saveAccountsToDb(accounts);
    // 重新加载账户列表
    await loadAccounts();
    closeModal(); // 成功后才关闭模态框
  } catch (error) {
    // 显示错误但不关闭模态框
    console.error('保存账户时发生错误:', error); // 在控制台输出详细错误信息
    showModalError('保存失败: ' + error.message);
  } finally {
    // 恢复按钮状态
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
    isSaving = false;
  }
}