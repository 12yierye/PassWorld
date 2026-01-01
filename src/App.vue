<script setup>
import { ref, reactive, computed } from 'vue';

// 预设平台名称
const presetPlatforms = [
  'Google', 'Facebook', 'Twitter', 'Instagram', 'TikTok', 
  'GitHub', 'LinkedIn', 'YouTube', 'Netflix', 'Amazon'
];

// 状态管理
const showModal = ref(false);
const showEditModal = ref(false);
const platform = ref('');
const username = ref('');
const password = ref('');
const editUsername = ref('');
const editPassword = ref('');
const filteredPlatforms = ref([]);
const showSuggestions = ref(false);
const accounts = reactive([]);
const showPasswordMap = ref({}); // 用于跟踪每个密码的显示状态
const activeMenuId = ref(null); // 跟踪当前激活的菜单
const editingAccountId = ref(null); // 跟踪正在编辑的账户ID

// 过滤预设平台，按相似度排序
const filterPlatforms = () => {
  if (platform.value) {
    const input = platform.value.toLowerCase();
    
    // 按相似度排序：首字母匹配 > 包含在开头 > 包含在中间 > 其他
    filteredPlatforms.value = [...presetPlatforms].sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // 首字母完全匹配
      const aStartsWith = aLower.startsWith(input) ? 1 : 0;
      const bStartsWith = bLower.startsWith(input) ? 1 : 0;
      
      if (aStartsWith !== bStartsWith) {
        return bStartsWith - aStartsWith; // 首字母匹配的优先
      }
      
      // 如果都不是首字母匹配，比较是否包含
      const aIncludes = aLower.includes(input) ? 1 : 0;
      const bIncludes = bLower.includes(input) ? 1 : 0;
      
      if (aIncludes !== bIncludes) {
        return bIncludes - aIncludes; // 包含的优先
      }
      
      // 都包含的情况下，比较位置，越靠前越优先
      const aIndex = aLower.indexOf(input);
      const bIndex = bLower.indexOf(input);
      
      return aIndex - bIndex;
    });
    
    showSuggestions.value = filteredPlatforms.value.length > 0;
  } else {
    filteredPlatforms.value = [];
    showSuggestions.value = false;
  }
};

// 选择预设平台
const selectPreset = (preset) => {
  platform.value = preset;
  showSuggestions.value = false;
};

// 添加账户
const addAccount = () => {
  if (platform.value && username.value && password.value) {
    const newAccount = {
      id: Date.now(),
      platform: platform.value,
      username: username.value,
      password: password.value
    };
    
    accounts.push(newAccount);
    
    // 重置表单
    platform.value = '';
    username.value = '';
    password.value = '';
    showModal.value = false;
  }
};

// 删除账户
const deleteAccount = (id) => {
  const index = accounts.findIndex(acc => acc.id === id);
  if (index !== -1) {
    accounts.splice(index, 1);
  }
  activeMenuId.value = null; // 关闭菜单
};

// 开始编辑账户
const startEdit = (account) => {
  editingAccountId.value = account.id;
  editUsername.value = account.username;
  editPassword.value = account.password;
  showEditModal.value = true;
  activeMenuId.value = null; // 关闭菜单
};

// 保存编辑
const saveEdit = () => {
  if (editingAccountId.value) {
    const account = accounts.find(acc => acc.id === editingAccountId.value);
    if (account) {
      account.username = editUsername.value;
      account.password = editPassword.value;
    }
    showEditModal.value = false;
  }
};

// 切换密码显示状态
const togglePasswordVisibility = (id) => {
  if (showPasswordMap.value[id]) {
    showPasswordMap.value[id] = false;
  } else {
    showPasswordMap.value[id] = true;
  }
};

// 获取密码显示文本
const getPasswordDisplay = (id, password) => {
  if (showPasswordMap.value[id]) {
    return password;
  }
  return '••••••••';
};

// 切换菜单显示
const toggleMenu = (id) => {
  activeMenuId.value = activeMenuId.value === id ? null : id;
};

// 按平台和用户名分组账户
const groupedAccounts = computed(() => {
  const grouped = {};
  
  accounts.forEach(account => {
    if (!grouped[account.platform]) {
      grouped[account.platform] = {};
    }
    
    if (!grouped[account.platform][account.username]) {
      grouped[account.platform][account.username] = [];
    }
    
    grouped[account.platform][account.username].push(account);
  });
  
  return grouped;
});
</script>

<template>
  <div class="app-container">
    <!-- 中间内容区域 -->
    <div class="main-content">
      <div v-if="accounts.length === 0" class="empty-state">
        <h1>空空如也，请添加密码</h1>
      </div>
      <!-- 显示所有账户 -->
      <div v-else v-for="(platformGroup, platformName) in groupedAccounts" :key="platformName" class="platform-container">
        <div class="platform-header">
          <h3 class="platform-title">{{ platformName }}</h3>
        </div>
        
        <div v-for="(usernameGroup, username) in platformGroup" :key="username" class="username-container">
          <div class="username-header">
            <h4 class="username-title">{{ username }}</h4>
            <button 
              @click="toggleMenu(usernameGroup[0].id)" 
              class="menu-btn"
              :class="{ 'active': activeMenuId === usernameGroup[0].id }"
            >
              ⋮
            </button>
            
            <!-- 菜单 -->
            <div 
              v-if="activeMenuId === usernameGroup[0].id" 
              class="menu-dropdown"
              @click="activeMenuId = null"
            >
              <button @click.stop="startEdit(usernameGroup[0])" class="menu-option">编辑</button>
              <button @click.stop="deleteAccount(usernameGroup[0].id)" class="menu-option">删除</button>
            </div>
          </div>
          
          <div v-for="account in usernameGroup" :key="account.id" class="account-item">
            <span class="password-display">{{ getPasswordDisplay(account.id, account.password) }}</span>
            <button @click="togglePasswordVisibility(account.id)" class="eye-btn">👁</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 下方工具栏 -->
    <div class="toolbar-bottom">
      <button @click="showModal = true" class="toolbar-btn">添加</button>
    </div>

    <!-- 添加弹窗 -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>添加新账户</h3>
        <div class="input-group">
          <label>平台名称</label>
          <div class="autocomplete-container">
            <input 
              v-model="platform" 
              @input="filterPlatforms" 
              @focus="filterPlatforms"
              @keyup.enter="selectPreset(filteredPlatforms[0])"
              placeholder="输入平台名称"
              class="input-field"
            />
            <ul v-if="showSuggestions" class="suggestions-list">
              <li 
                v-for="preset in filteredPlatforms" 
                :key="preset"
                @click="selectPreset(preset)"
              >
                {{ preset }}
              </li>
            </ul>
          </div>
        </div>
        <div class="input-group">
          <label>用户名</label>
          <input v-model="username" placeholder="输入用户名" class="input-field" />
        </div>
        <div class="input-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="输入密码" class="input-field" />
        </div>
        <div class="modal-buttons">
          <button @click="addAccount" class="confirm-btn">确认</button>
          <button @click="showModal = false" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <h3>编辑账户</h3>
        <div class="input-group">
          <label>用户名</label>
          <input v-model="editUsername" placeholder="输入用户名" class="input-field" />
        </div>
        <div class="input-group">
          <label>密码</label>
          <input v-model="editPassword" type="password" placeholder="输入密码" class="input-field" />
        </div>
        <div class="modal-buttons">
          <button @click="saveEdit" class="confirm-btn">确认</button>
          <button @click="showEditModal = false" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  min-height: 500px;
  min-width: 800px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.main-content {
  flex: 1;
  padding: 25px;
  overflow: auto;
  background-color: #f8f9fa;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70vh;
  color: #adb5bd;
  font-size: 20px;
}

.empty-state h1 {
  font-weight: 400;
  margin: 0;
}

.platform-container {
  margin-bottom: 20px;
  border-radius: 8px;
  padding: 15px;
  background-color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.platform-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.platform-title {
  margin: 0;
  padding: 0;
  font-size: 18px;
  color: #2c3e50;
  font-weight: 600;
}

.username-container {
  position: relative;
  margin-left: 10px;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.username-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.username-title {
  margin: 0;
  font-size: 16px;
  color: #34495e;
  font-weight: 500;
}

.account-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin: 8px 0;
  background-color: #ffffff;
  border-radius: 6px;
  border: 1px solid #eef2f7;
  transition: all 0.2s ease;
}

.account-item:hover {
  background-color: #f1f5f9;
}

.password-display {
  flex: 1;
  margin-right: 10px;
  color: #333;
  font-family: monospace;
  letter-spacing: 1px;
}

.eye-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: #6c757d;
  transition: all 0.2s ease;
}

.eye-btn:hover {
  background-color: #e9ecef;
  color: #495057;
}

.menu-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: #6c757d;
  transition: all 0.3s ease;
  position: relative;
  z-index: 10;
}

.menu-btn::after {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border-radius: 8px;
  background: inherit;
  filter: blur(8px);
  opacity: 0;
  transition: all 0.3s ease;
  z-index: -1;
}

.menu-btn:hover {
  background-color: #e9ecef;
  color: #495057;
}

.menu-btn.active,
.menu-btn:hover {
  animation: glow 0.5s ease-in-out infinite alternate;
}

.menu-btn.active::after,
.menu-btn:hover::after {
  opacity: 0.6;
  transform: scale(1.2);
}

@keyframes glow {
  from {
    box-shadow: 0 0 4px rgba(108, 117, 125, 0.4);
  }
  to {
    box-shadow: 0 0 12px rgba(108, 117, 125, 0.8);
  }
}

.menu-dropdown {
  position: absolute;
  right: 12px;
  top: 40px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 100px;
  padding: 5px 0;
}

.menu-option {
  display: block;
  width: 100%;
  padding: 10px 15px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
  transition: background-color 0.2s;
}

.menu-option:hover {
  background-color: #f8f9fa;
}

.toolbar-bottom {
  display: flex;
  padding: 20px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
}

.toolbar-btn {
  padding: 12px 20px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s ease;
  flex: 1;
  max-width: 300px;
  margin: 0 auto;
}

.toolbar-btn:hover {
  background-color: #3367d6;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  font-weight: 600;
  text-align: center;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #34495e;
}

.input-field {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e1e5eb;
  border-radius: 6px;
  font-size: 15px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.input-field:focus {
  outline: none;
  border-color: #3498db;
}

.autocomplete-container {
  position: relative;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1001;
  margin: 0;
  padding: 0;
  list-style: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.suggestions-list li {
  padding: 12px 15px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.suggestions-list li:hover {
  background-color: #f8f9fa;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
}

.confirm-btn, .cancel-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: background-color 0.2s ease;
  width: 120px;
}

.confirm-btn {
  background-color: #2ecc71;
  color: white;
}

.cancel-btn {
  background-color: #95a5a6;
  color: white;
}

.confirm-btn:hover {
  background-color: #27ae60;
}

.cancel-btn:hover {
  background-color: #7f8c8d;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>