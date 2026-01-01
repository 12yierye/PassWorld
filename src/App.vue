<script setup>
import { ref, reactive, computed } from 'vue';
import AccountsList from './components/AccountsList.vue';
import AddAccountModal from './components/AddAccountModal.vue';
import EditAccountModal from './components/EditAccountModal.vue';

// 状态管理
const showModal = ref(false);
const showEditModal = ref(false);
const accounts = reactive([]);
const showPasswordMap = ref({}); // 用于跟踪每个密码的显示状态
const activeMenuId = ref(null); // 跟踪当前激活的菜单
const editingAccountId = ref(null); // 跟踪正在编辑的账户ID

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
  showEditModal.value = true;
  activeMenuId.value = null; // 关闭菜单
};

// 保存编辑
const saveEdit = ({ id, username, password }) => {
  const account = accounts.find(acc => acc.id === id);
  if (account) {
    account.username = username;
    account.password = password;
  }
  showEditModal.value = false;
};

// 切换密码显示状态
const togglePasswordVisibility = (id) => {
  if (showPasswordMap.value[id]) {
    showPasswordMap.value[id] = false;
  } else {
    showPasswordMap.value[id] = true;
  }
};

// 切换菜单显示
const toggleMenu = (id) => {
  activeMenuId.value = activeMenuId.value === id ? null : id;
};
</script>

<template>
  <div class="app-container">
    <!-- 账户列表组件 -->
    <AccountsList
      :accounts="accounts"
      :showPasswordMap="showPasswordMap"
      :activeMenuId="activeMenuId"
      @togglePasswordVisibility="togglePasswordVisibility"
      @deleteAccount="deleteAccount"
      @toggleMenu="toggleMenu"
      @startEdit="startEdit"
    />

    <!-- 下方工具栏 -->
    <div class="toolbar-bottom">
      <button @click="showModal = true" class="toolbar-btn">添加</button>
    </div>

    <!-- 添加弹窗 -->
    <AddAccountModal
      :showModal="showModal"
      @update:showModal="showModal = $event"
      @addAccount="addAccount"
    />

    <!-- 编辑弹窗 -->
    <EditAccountModal
      :showEditModal="showEditModal"
      :editingAccount="editingAccount"
      @update:showEditModal="showEditModal = $event"
      @saveEdit="saveEdit"
    />
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
</style>