<template>
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
</template>

<script setup>
import { computed } from 'vue';

// 定义组件的 props
const props = defineProps({
  accounts: {
    type: Array,
    required: true
  },
  showPasswordMap: {
    type: Object,
    required: true
  },
  activeMenuId: {
    type: Number,
    default: null
  }
});

// 定义组件的事件
const emit = defineEmits(['togglePasswordVisibility', 'deleteAccount', 'toggleMenu', 'startEdit']);

// 按平台和用户名分组账户
const groupedAccounts = computed(() => {
  const grouped = {};
  
  props.accounts.forEach(account => {
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

// 获取密码显示文本
const getPasswordDisplay = (id, password) => {
  if (props.showPasswordMap[id]) {
    return password;
  }
  return '••••••••';
};

// 切换密码显示状态
const togglePasswordVisibility = (id) => {
  emit('togglePasswordVisibility', id);
};

// 删除账户
const deleteAccount = (id) => {
  emit('deleteAccount', id);
};

// 切换菜单显示
const toggleMenu = (id) => {
  emit('toggleMenu', id);
};

// 开始编辑账户
const startEdit = (account) => {
  emit('startEdit', account);
};
</script>

<style scoped>
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
</style>