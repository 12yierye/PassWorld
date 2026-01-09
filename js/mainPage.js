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

// 从 localStorage 获取当前用户信息
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let masterPassword = localStorage.getItem('masterPassword');

// 验证用户是否已登录
if (!currentUser || !masterPassword) {
    alert('请先登录！');
    window.location.href = '../login.html';
    return;
}

document.addEventListener('DOMContentLoaded', async function () {
    // 初始化用户信息
    document.getElementById('user-info').textContent = `Welcome, ${currentUser.username}!`;

    // 初始化窗口拖拽功能
    initWindowDrag();

    // 绑定事件监听器
    bindEventListeners();

    // 加载账户数据
    await loadAccounts();
});

function initWindowDrag() {
    const titleBar = document.querySelector('.title-bar');
    
    let isDragging = false;
    let offsetX, offsetY;

    titleBar.addEventListener('mousedown', (e) => {
        // 检查点击的是否是按钮，如果是则不触发拖拽
        if (e.target.classList.contains('title-bar-btn')) {
            return;
        }
        
        isDragging = true;
        const rect = titleBar.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopDrag);
    });

    function handleMouseMove(e) {
        if (!isDragging) return;
        
        const x = e.screenX - offsetX;
        const y = e.screenY - offsetY;
        
        window.electron.ipcRenderer.invoke('set-position', x, y);
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopDrag);
    }
}

function bindEventListeners() {
    // 登出按钮
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // 最小化按钮
    document.getElementById('minimize-btn').addEventListener('click', () => {
        window.electron.ipcRenderer.invoke('minimize-window');
    });
    
    // 最大化/还原按钮
    document.getElementById('maximize-btn').addEventListener('click', () => {
        window.electron.ipcRenderer.invoke('toggle-maximize-window');
    });
    
    // 关闭按钮
    document.getElementById('close-btn').addEventListener('click', () => {
        window.electron.ipcRenderer.invoke('close-window');
    });

    // 添加账户按钮
    document.getElementById('add-account-btn').addEventListener('click', () => {
        resetModal();
        document.getElementById('account-modal').classList.add('show');
        document.getElementById('modal-title').textContent = '添加账户';
        document.getElementById('save-btn').dataset.id = '';
    });

    // 保存按钮
    document.getElementById('save-btn').addEventListener('click', saveAccount);

    // 取消按钮
    document.getElementById('cancel-btn').addEventListener('click', closeModal);

    // 平台输入框事件
    const platformInput = document.getElementById('platform-input');
    platformInput.addEventListener('input', showPlatformSuggestions);
    platformInput.addEventListener('blur', () => {
        setTimeout(() => {
            document.getElementById('platform-suggestions').classList.add('hidden');
        }, 200);
    });

    // 点击建议选项时填充输入框
    document.getElementById('platform-suggestions').addEventListener('click', function(e) {
        if (e.target.tagName === 'DIV') {
            document.getElementById('platform-input').value = e.target.textContent;
            this.classList.add('hidden');
        }
    });
}

async function handleLogout() {
    // 清除本地存储的用户信息
    localStorage.removeItem('currentUser');
    localStorage.removeItem('masterPassword');
    
    // 跳转到登录页
    window.location.href = '../login.html';
}

async function loadAccounts() {
    try {
        // 显示加载状态
        document.querySelector('.accounts-section').innerHTML = `
            <div class="controls">
                <h2>Accounts List</h2>
                <div>
                    <button type="button" id="add-account-btn" class="btn-add">New</button>
                </div>
            </div>
            <div id="error-message" class="error-message hidden"></div>
            <div class="loading-state">
                <p>正在加载...</p>
            </div>
            <div class="table-container">
                <table id="accounts-table">
                    <thead>
                        <tr>
                            <th>Platform</th>
                            <th>Username</th>
                            <th>Password</th>
                            <th>Operate</th>
                        </tr>
                    </thead>
                    <tbody id="accounts-tbody">
                        <!-- 动态生成 -->
                    </tbody>
                </table>
            </div>
        `;
        
        // 重新绑定添加账户按钮事件
        document.getElementById('add-account-btn').addEventListener('click', () => {
            resetModal();
            document.getElementById('account-modal').classList.add('show');
            document.getElementById('modal-title').textContent = '添加账户';
            document.getElementById('save-btn').dataset.id = '';
        });

        // 获取账户数据
        const response = await window.electron.ipcRenderer.invoke('db-load-accounts', currentUser.username, masterPassword);
        
        if (!response.success) {
            showError(response.error || '加载账户数据失败');
            return;
        }

        const accounts = response.accounts;

        // 获取tbody元素
        const tbody = document.getElementById('accounts-tbody');
        tbody.innerHTML = '';

        if (accounts.length === 0) {
            // 显示空状态
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state-cell">
                        <div class="empty-state-content">空空如也，请添加账户</div>
                    </td>
                </tr>
            `;
        } else {
            // 渲染账户数据
            accounts.forEach(account => {
                const row = document.createElement('tr');
                row.dataset.id = account.id;
                
                row.innerHTML = `
                    <td>${account.platform}</td>
                    <td>${account.username}</td>
                    <td class="password-cell" title="点击显示/隐藏密码">
                        <span class="password-text">${hidePassword(account.password)}</span>
                    </td>
                    <td>
                        <button class="action-btn edit" onclick="editAccount(${account.id})">Edit</button>
                        <button class="action-btn delete" onclick="deleteAccount(${account.id})">Delete</button>
                    </td>
                `;
                
                // 添加密码单元格点击事件
                const passwordCell = row.querySelector('.password-cell');
                passwordCell.addEventListener('click', () => togglePasswordVisibility(passwordCell, account.password));
                
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('加载账户数据时发生错误:', error);
        showError(error.message || '加载账户数据失败');
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

function hidePassword(password) {
    return '••••••••';
}

function togglePasswordVisibility(cell, actualPassword) {
    const passwordText = cell.querySelector('.password-text');
    if (passwordText.textContent.includes('•')) {
        passwordText.textContent = actualPassword;
    } else {
        passwordText.textContent = hidePassword(actualPassword);
    }
}

function editAccount(id) {
    // 查找对应账户
    const row = document.querySelector(`tr[data-id="${id}"]`);
    const cells = row.querySelectorAll('td');
    
    // 获取账户信息
    const platform = cells[0].textContent;
    const username = cells[1].textContent;
    const password = cells[2].querySelector('.password-text').textContent.replace(/•/g, '');
    
    // 填充模态框
    document.getElementById('modal-title').textContent = '编辑账户';
    document.getElementById('platform-input').value = platform;
    document.getElementById('account-username-input').value = username;
    document.getElementById('account-password-input').value = password;
    document.getElementById('save-btn').dataset.id = id;
    
    // 显示模态框
    document.getElementById('account-modal').classList.add('show');
}

async function deleteAccount(id) {
    if (!confirm('确定要删除这个账户吗？')) {
        return;
    }
    
    try {
        // 从数据库删除账户
        const accounts = (await window.electron.ipcRenderer.invoke('db-load-accounts', currentUser.username, masterPassword)).accounts;
        const updatedAccounts = accounts.filter(account => account.id != id);
        
        const saveResponse = await window.electron.ipcRenderer.invoke('db-save-accounts', currentUser.username, masterPassword, updatedAccounts);
        
        if (!saveResponse.success) {
            throw new Error(saveResponse.error || '删除账户失败');
        }
        
        // 重新加载账户列表
        await loadAccounts();
    } catch (error) {
        console.error('删除账户时发生错误:', error);
        showError(error.message || '删除账户失败');
    }
}

async function saveAccount() {
    const platform = document.getElementById('platform-input').value.trim();
    const username = document.getElementById('account-username-input').value.trim();
    const password = document.getElementById('account-password-input').value.trim();
    const accountId = document.getElementById('save-btn').dataset.id;

    // 验证输入
    if (!platform || !username || !password) {
        showValidationError('所有字段都是必填的');
        return;
    }

    try {
        // 获取现有账户数据
        let accounts = (await window.electron.ipcRenderer.invoke('db-load-accounts', currentUser.username, masterPassword)).accounts;
        
        if (accountId) {
            // 编辑现有账户
            const index = accounts.findIndex(acc => acc.id == accountId);
            if (index !== -1) {
                accounts[index] = { id: parseInt(accountId), platform, username, password };
            }
        } else {
            // 添加新账户
            const newId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
            accounts.push({ id: newId, platform, username, password });
        }
        
        // 保存更新后的账户数据
        const response = await window.electron.ipcRenderer.invoke('db-save-accounts', currentUser.username, masterPassword, accounts);
        
        if (!response.success) {
            throw new Error(response.error || '保存账户失败');
        }
        
        // 重新加载账户列表
        await loadAccounts();
        
        // 关闭模态框
        closeModal();
        
        // 重置表单
        resetModal();
    } catch (error) {
        console.error('保存账户时发生错误:', error);
        showValidationError(error.message || '保存账户失败');
    }
}

function showValidationError(message) {
    const errorElement = document.getElementById('modal-error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('account-modal').classList.remove('show');
    
    // 隐藏错误信息
    document.getElementById('modal-error-message').classList.add('hidden');
}

function resetModal() {
    // 清空表单
    document.getElementById('platform-input').value = '';
    document.getElementById('account-username-input').value = '';
    document.getElementById('account-password-input').value = '';
    
    // 隐藏错误信息
    document.getElementById('modal-error-message').classList.add('hidden');
    
    // 隐藏建议列表
    document.getElementById('platform-suggestions').classList.add('hidden');
}

function showPlatformSuggestions() {
    const input = document.getElementById('platform-input');
    const value = input.value.toLowerCase();
    const suggestionsDiv = document.getElementById('platform-suggestions');
    
    if (!value) {
        suggestionsDiv.classList.add('hidden');
        return;
    }
    
    // 预设的平台名称
    const platforms = [
        'Google', 'Facebook', 'Twitter', 'Instagram', 'LinkedIn', 
        'GitHub', 'GitLab', 'Microsoft', 'Apple', 'Amazon',
        'Netflix', 'Spotify', 'YouTube', 'Twitch', 'Discord',
        'Slack', 'Zoom', 'Trello', 'Notion', 'Gmail'
    ];
    
    // 过滤并排序匹配的平台
    const matches = platforms.filter(platform => 
        platform.toLowerCase().includes(value)
    ).sort((a, b) => {
        // 按匹配度排序：完全匹配优先，其次是首字母匹配等
        const aStartsWith = a.toLowerCase().startsWith(value);
        const bStartsWith = b.toLowerCase().startsWith(value);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        return a.localeCompare(b);
    }).slice(0, 5); // 限制最多显示5个建议
    
    if (matches.length === 0) {
        suggestionsDiv.classList.add('hidden');
        return;
    }
    
    // 生成建议列表
    suggestionsDiv.innerHTML = matches.map(platform => 
        `<div>${platform}</div>`
    ).join('');
    
    suggestionsDiv.classList.remove('hidden');
}
