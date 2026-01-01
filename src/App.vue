<script setup>
import { ref, reactive, computed } from 'vue';

// 预设平台名称
const presetPlatforms = [
  'Google', 'Facebook', 'Twitter', 'Instagram', 'TikTok', 
  'GitHub', 'LinkedIn', 'YouTube', 'Netflix', 'Amazon'
];

// 状态管理
const showModal = ref(false);
const platform = ref('');
const username = ref('');
const password = ref('');
const filteredPlatforms = ref([]);
const showSuggestions = ref(false);
const accounts = reactive([]);
const showPasswordMap = ref({}); // 用于跟踪每个密码的显示状态

// 过滤预设平台
const filterPlatforms = () => {
  if (platform.value) {
    filteredPlatforms.value = presetPlatforms.filter(item => 
      item.toLowerCase().includes(platform.value.toLowerCase())
    );
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
      <!-- 显示所有账户 -->
      <div v-for="(platformGroup, platformName) in groupedAccounts" :key="platformName" class="platform-container">
        <div class="platform-header">
          <h3 class="platform-title">{{ platformName }}</h3>
          <button class="menu-btn">⋮</button>
        </div>
        
        <div v-for="(usernameGroup, username) in platformGroup" :key="username" class="username-container">
          <div class="username-header">
            <h4 class="username-title">{{ username }}</h4>
            <button class="menu-btn">⋮</button>
          </div>
          
          <div v-for="account in usernameGroup" :key="account.id" class="account-item">
            <span class="password-display">{{ getPasswordDisplay(account.id, account.password) }}</span>
            <button @click="togglePasswordVisibility(account.id)" class="eye-btn">👁</button>
            <button class="menu-btn">⋮</button>
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
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  min-height: 400px;
  min-width: 300px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background-color: #f8f9fa;
}

.platform-container {
  margin-bottom: 20px;
  border-radius: 10px;
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
  margin-left: 10px;
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
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
  transform: translateY(-1px);
}

.password-display {
  flex: 1;
  margin-right: 10px;
  color: #333;
  font-family: monospace;
  letter-spacing: 1px;
}

.eye-btn, .menu-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  color: #6c757d;
  transition: all 0.2s ease;
}

.eye-btn:hover, .menu-btn:hover {
  background-color: #e9ecef;
  color: #495057;
}

.toolbar-bottom {
  display: flex;
  padding: 15px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.05);
}

.toolbar-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(37, 117, 252, 0.3);
  transition: all 0.3s ease;
  flex: 1;
  max-width: 300px;
  margin: 0 auto;
}

.toolbar-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(37, 117, 252, 0.4);
}

.toolbar-btn:active {
  transform: translateY(0);
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
  border-radius: 12px;
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
  border-radius: 8px;
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
  border-radius: 0 0 8px 8px;
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
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s ease;
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
  transform: translateY(-2px);
}

.cancel-btn:hover {
  background-color: #7f8c8d;
  transform: translateY(-2px);
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