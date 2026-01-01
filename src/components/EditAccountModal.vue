<template>
  <Transition name="modal">
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <h3>编辑账户</h3>
        <div class="input-group">
          <label>平台名称</label>
          <input :value="editingAccount?.platform" class="input-field" disabled />
        </div>
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
          <button @click="$emit('update:showEditModal', false)" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';

// 接收父组件传入的属性
const props = defineProps({
  showEditModal: {
    type: Boolean,
    required: true
  },
  editingAccount: {
    type: Object,
    default: null
  }
});

// 定义向父组件发送的事件
const emit = defineEmits(['update:showEditModal', 'saveEdit']);

// 本地状态
const editUsername = ref('');
const editPassword = ref('');

// 监听编辑账户变化，同步到本地状态
watch(
  () => props.editingAccount,
  (newAccount) => {
    if (newAccount) {
      editUsername.value = newAccount.username;
      editPassword.value = newAccount.password;
    }
  },
  { immediate: true }
);

// 保存编辑
const saveEdit = () => {
  if (props.editingAccount) {
    emit('saveEdit', {
      id: props.editingAccount.id,
      username: editUsername.value,
      password: editPassword.value
    });
  }
};
</script>

<style scoped>
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
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
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

.input-field:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
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

/* 过渡动画 */
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>