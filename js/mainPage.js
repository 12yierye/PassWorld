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

  // 初始化标题栏按钮
  initWindowControlButtons();
  
  // 异步加载账户数据
  await loadAccounts();
  setupEventListeners();
});

// 初始化窗口控制按钮
function initWindowControlButtons() {
  console.log('初始化窗口控制按钮');
  console.log('window.electron对象:', window.electron);
  
  // 直接绑定事件，不使用可选链
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
  const masterPassword = PassWorld.getMasterPassword(); // 使用getMasterPassword()确保获取最新的主密码
  
  console.log('=== 开始保存账户数据 ===');
  console.log('当前用户:', currentUser);
  console.log('要保存的账户数量:', accs.length);
  console.log('要保存的账户数据:', JSON.stringify(accs, null, 2));
  
  if (!masterPassword) {
    console.error('保存失败：主密码不存在');
    throw new Error('主密码不存在');
  }
  try {
    const result = await ipcRenderer.invoke('db-save-accounts', currentUser, masterPassword, accs);
    console.log('数据库保存结果:', result);
    
    if (!result.success) {
      // 检查是否在添加/编辑账户的模态框中
      if (editingIndex !== null || document.getElementById('modal-title').textContent === '添加账户') {
        showModalError('保存失败: ' + result.error);
      } else {
        showError('保存失败: ' + result.error);
      }
      // 抛出错误，让调用方知道保存失败了
      throw new Error(result.error);
    } else {
      showSuccess('保存成功');
      // 返回成功结果（不再在这里关闭模态框）
      return result;
    }
  } catch (err) {
    console.error('保存账户时发生异常:', err);
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
  const masterPassword = PassWorld.getMasterPassword();
  
  console.log('=== 开始加载账户数据 ===');
  console.log('当前用户:', currentUser);
  console.log('主密码存在:', !!masterPassword);
  
  if (!currentUser || !masterPassword) {
    console.error('加载账户失败：用户未登录或主密码不存在');
    return [];
  }
  
  // 显示加载指示器
  const tbody = document.getElementById('accounts-tbody');
  if (!tbody) {
    console.error('加载账户失败：未找到表格tbody元素');
    return [];
  }
  
  // 清空表格内容
  tbody.innerHTML = '';
  
  // 添加加载状态行
  const loadingRow = tbody.insertRow();
  const loadingCell = loadingRow.insertCell(0);
  loadingCell.colSpan = 4;
  loadingCell.className = 'loading-state-cell';
  loadingCell.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; padding: 40px 20px; color: #999;"><div class="spinner"></div> <span style="margin-left: 10px;">正在加载...</span></div>';
  
  try {
    console.log('正在从数据库加载账户数据...');
    const result = await ipcRenderer.invoke('db-load-accounts', currentUser, masterPassword);
    console.log('数据库加载结果:', result);
    
    accounts = result.accounts || [];
    console.log('加载后的accounts数组长度:', accounts.length);
    console.log('加载后的accounts数组:', JSON.stringify(accounts, null, 2));
    
    // 清空表格内容
    tbody.innerHTML = '';
    
    // 检查是否有账户数据
    if (accounts.length === 0) {
      // 清空表格内容
      tbody.innerHTML = '';
      
      // 在表格容器中显示空状态
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        // 移除已存在的空状态
        const existingEmptyState = tableContainer.querySelector('.table-empty-state');
        if (existingEmptyState) {
          existingEmptyState.remove();
        }
        
        // 创建新的空状态元素
        const emptyState = document.createElement('div');
        emptyState.className = 'table-empty-state';
        emptyState.textContent = '空空如也，请添加账户';
        
        // 添加到表格容器
        tableContainer.appendChild(emptyState);
      }
    } else {
      // 移除空状态（如果存在）
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        const existingEmptyState = tableContainer.querySelector('.table-empty-state');
        if (existingEmptyState) {
          existingEmptyState.remove();
        }
      }
      // 使用文档片段提高性能
      const fragment = document.createDocumentFragment();
      
      accounts.forEach((acc, index) => {
        const row = document.createElement('tr');
        
        // 平台单元格
        const platformCell = document.createElement('td');
        platformCell.title = acc.platform;
        platformCell.textContent = acc.platform;
        row.appendChild(platformCell);
        
        // 用户名单元格
        const usernameCell = document.createElement('td');
        usernameCell.title = acc.username;
        usernameCell.textContent = acc.username;
        row.appendChild(usernameCell);
        
        // 密码单元格
        const passwordCell = document.createElement('td');
        passwordCell.className = 'password-cell';
        passwordCell.setAttribute('data-password', acc.password);
        passwordCell.title = acc.password;
        
        const passwordSpan = document.createElement('span');
        passwordSpan.className = 'password-text';
        passwordSpan.textContent = '******';
        passwordCell.appendChild(passwordSpan);
        row.appendChild(passwordCell);
        
        // 操作单元格
        const actionCell = document.createElement('td');
        
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
        row.appendChild(actionCell);
        
        fragment.appendChild(row);
      });
      
      // 一次性添加所有行到DOM
      tbody.appendChild(fragment);
    }

    // 绑定操作按钮事件（委托）
    tbody.removeEventListener('click', handleTableClick);
    tbody.addEventListener('click', handleTableClick);
    
  } catch (err) {
    console.error('加载账户失败:', err);
    
    // 清空表格内容
    tbody.innerHTML = '';
    
    // 显示错误状态
    const errorRow = tbody.insertRow();
    const errorCell = errorRow.insertCell(0);
    errorCell.colSpan = 4;
    errorCell.className = 'empty-state-cell';
    errorCell.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; padding: 40px 20px; color: #e74c3c;">加载失败，请稍后重试</div>';
  }
  
  return accounts;
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
  
  // 检查用户是否已登录且主密码存在
  const currentUser = PassWorld.getCurrentUser();
  const masterPassword = PassWorld.getMasterPassword();
  if (!currentUser || !masterPassword) {
    showModalError('用户未登录或主密码不存在');
    window.location.href = 'login.html';
    return;
  }
  
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

  // 保存原始状态，以便在保存失败时恢复
  const originalAccounts = JSON.parse(JSON.stringify(accounts));
  const originalEditingIndex = editingIndex;

  try {
    // 创建新账户对象
    const newAccount = { platform, username, password };
    
    // 立即更新本地数组和UI（乐观UI）
    if (editingIndex !== null) {
      accounts[editingIndex] = newAccount;
      console.log('编辑账户:', accounts[editingIndex]);
    } else {
      accounts.push(newAccount);
      console.log('添加新账户:', accounts[accounts.length - 1]);
    }
    
    // 立即更新UI（不重新加载整个表格，只更新或添加行）
    updateAccountTable();
    
    // 关闭模态框
    closeModal();
    
    // 在后台保存到数据库（不阻塞UI）
    console.log('开始在后台保存账户数据到数据库...');
    const saveResult = await saveAccountsToDb(accounts);
    console.log('保存结果:', saveResult);
    
    // 保存成功后显示成功消息
    showSuccess('保存成功');
    
  } catch (error) {
    // 保存失败，恢复原始状态
    accounts = originalAccounts;
    editingIndex = originalEditingIndex;
    await loadAccounts(); // 重新加载表格
    
    // 显示错误消息
    console.error('保存账户时发生错误:', error);
    showError('保存失败: ' + error.message);
  } finally {
    // 恢复按钮状态
    const modal = document.getElementById('account-modal');
    if (modal) {
      const saveBtnInModal = modal.querySelector('#save-btn');
      if (saveBtnInModal) {
        saveBtnInModal.innerHTML = originalText;
        saveBtnInModal.disabled = false;
      }
    }
    isSaving = false;
  }
}

// 更新账户表格（只更新或添加行，不重新加载整个表格）
function updateAccountTable() {
  const tbody = document.getElementById('accounts-tbody');
  if (!tbody) return;
  
  // 清空表格内容
  tbody.innerHTML = '';
  
  // 检查是否有账户数据
  if (accounts.length === 0) {
    // 清空表格内容
    tbody.innerHTML = '';
    
    // 在表格容器中显示空状态
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      // 移除已存在的空状态
      const existingEmptyState = tableContainer.querySelector('.table-empty-state');
      if (existingEmptyState) {
        existingEmptyState.remove();
      }
      
      // 创建新的空状态元素
      const emptyState = document.createElement('div');
      emptyState.className = 'table-empty-state';
      emptyState.textContent = '空空如也，请添加账户';
      
      // 添加到表格容器
      tableContainer.appendChild(emptyState);
    }
  } else {
    // 移除空状态（如果存在）
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      const existingEmptyState = tableContainer.querySelector('.table-empty-state');
      if (existingEmptyState) {
        existingEmptyState.remove();
      }
    }
    // 使用文档片段批量添加表格行
    const fragment = document.createDocumentFragment();
    
    accounts.forEach((acc, index) => {
      const row = document.createElement('tr');
      
      // 平台单元格
      const platformCell = document.createElement('td');
      platformCell.title = acc.platform;
      platformCell.textContent = acc.platform;
      row.appendChild(platformCell);
      
      // 用户名单元格
      const usernameCell = document.createElement('td');
      usernameCell.title = acc.username;
      usernameCell.textContent = acc.username;
      row.appendChild(usernameCell);
      
      // 密码单元格
      const passwordCell = document.createElement('td');
      passwordCell.className = 'password-cell';
      passwordCell.setAttribute('data-password', acc.password);
      passwordCell.title = acc.password;
      
      const passwordSpan = document.createElement('span');
      passwordSpan.className = 'password-text';
      passwordSpan.textContent = '******';
      passwordCell.appendChild(passwordSpan);
      row.appendChild(passwordCell);
      
      // 操作单元格
      const actionCell = document.createElement('td');
      
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
      row.appendChild(actionCell);
      
      fragment.appendChild(row);
    });
    
    // 一次性添加所有行到DOM
    tbody.appendChild(fragment);
  }

  // 绑定操作按钮事件（委托）
  tbody.removeEventListener('click', handleTableClick);
  tbody.addEventListener('click', handleTableClick);
}

