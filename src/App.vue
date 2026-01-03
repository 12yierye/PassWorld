<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import AccountsList from './components/AccountsList.vue';
import AddAccountModal from './components/AddAccountModal.vue';
import EditAccountModal from './components/EditAccountModal.vue';
import Login from './components/Login.vue';

// 检查用户是否已登录
const isLoggedIn = ref(false);
const currentUsername = ref('');

// 状态管理
const showModal = ref(false);
const showEditModal = ref(false);
const accounts = reactive([]);
const showPasswordMap = ref({}); // 用于跟踪每个密码的显示状态
const activeMenuId = ref(null); // 跟踪当前激活的菜单
const editingAccountId = ref(null); // 跟踪正在编辑的账户ID

// 检查登录状态
onMounted(() => {
  const username = localStorage.getItem('currentUsername');
  if (username) {
    isLoggedIn.value = true;
    currentUsername.value = username;
  }
  
  // 加载账户数据
  const storedAccounts = JSON.parse(localStorage.getItem('accounts') || '[]');
  storedAccounts.forEach(account => accounts.push(account));
});

// 监听登录状态变化
const handleLogin = (username) => {
  isLoggedIn.value = true;
  currentUsername.value = username;
};

// 监听登出状态变化
const handleLogout = () => {
  isLoggedIn.value = false;
  currentUsername.value = '';
  localStorage.removeItem('currentUsername');
};

// 获取正在编辑的账户
const editingAccount = computed(() => {
  if (editingAccountId.value) {
    return accounts.find(acc => acc.id === editingAccountId.value);
  }
  return null;
});

// 添加账户
const addAccount = ({ platform, username, password }) => {
  const newAccount = {
    id: Date.now(),
    platform,
    username,
    password
  };
  
  accounts.push(newAccount);
  saveAccounts();
};

// 更新账户
const updateAccount = (updatedAccount) => {
  const index = accounts.findIndex(acc => acc.id === updatedAccount.id);
  if (index !== -1) {
    accounts[index] = { ...updatedAccount };
    saveAccounts();
  }
};

// 删除账户
const deleteAccount = (id) => {
  const index = accounts.findIndex(acc => acc.id === id);
  if (index !== -1) {
    accounts.splice(index, 1);
    saveAccounts();
  }
};

// 保存账户到本地存储
const saveAccounts = () => {
  // 创建一个不包含响应性的副本
  const plainAccounts = accounts.map(acc => ({...acc}));
  localStorage.setItem('accounts', JSON.stringify(plainAccounts));
};

// 切换密码可见性
const togglePasswordVisibility = (id) => {
  showPasswordMap.value = {
    ...showPasswordMap.value,
    [id]: !showPasswordMap.value[id]
  };
};

// 打开编辑模态框
const startEdit = (account) => {
  editingAccountId.value = account.id;
  showEditModal.value = true;
  activeMenuId.value = null;
};

// 关闭编辑模态框
const closeEditModal = () => {
  showEditModal.value = false;
  editingAccountId.value = null;
};

// 切换菜单
const toggleMenu = (id) => {
  activeMenuId.value = activeMenuId.value === id ? null : id;
};

// 保存编辑的账户
const saveEditedAccount = (updatedAccount) => {
  updateAccount(updatedAccount);
  closeEditModal();
};
</script>

<template>
  <div class="app-container">
    <header v-if="isLoggedIn" class="header">
      <h1>PassWorld - 密码管理器</h1>
      <div class="user-info">
        <span>欢迎, {{ currentUsername }}</span>
        <button @click="handleLogout" class="logout-btn">登出</button>
      </div>
    </header>
    
    <main v-if="isLoggedIn" class="main">
      <div class="toolbar">
        <button @click="showModal = true" class="add-btn">+ 添加账户</button>
      </div>
      
      <AccountsList 
        :accounts="accounts"
        :showPasswordMap="showPasswordMap"
        :activeMenuId="activeMenuId"
        @togglePasswordVisibility="togglePasswordVisibility"
        @deleteAccount="deleteAccount"
        @toggleMenu="toggleMenu"
        @startEdit="startEdit"
      />
      
      <AddAccountModal 
        v-if="showModal"
        @add-account="addAccount"
        @close="showModal = false"
      />
      
      <EditAccountModal
        v-if="showEditModal && editingAccount"
        :account="editingAccount"
        @update-account="saveEditedAccount"
        @close="closeEditModal"
      />
    </main>
    
    <Login 
      v-else 
      @login="handleLogin"
      @logout="handleLogout"
    />
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background-color: #c0392b;
}

.main {
  flex: 1;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.toolbar {
  margin-bottom: 1rem;
  text-align: right;
}

.add-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.add-btn:hover {
  background-color: #2980b9;
}

body {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
}
</style>