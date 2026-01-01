<template>
  <Transition name="modal">
    <div v-if="showModal" class="modal-overlay" @click="$emit('update:showModal', false)">
      <div class="modal-content" @click.stop>
        <h3>添加新账户</h3>
        <div class="input-group">
          <label>平台名称</label>
          <div class="autocomplete-container">
            <input 
              v-model="platform" 
              @input="filterPlatforms"
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
          <button @click="$emit('update:showModal', false)" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

// 预设平台名称
const presetPlatforms = [
  'Google', 'Facebook', 'Twitter', 'Instagram', 'TikTok', 
  'GitHub', 'LinkedIn', 'YouTube', 'Netflix', 'Amazon'
];

// 接收父组件传入的属性
const props = defineProps({
  showModal: {
    type: Boolean,
    required: true
  }
});

// 定义向父组件发送的事件
const emit = defineEmits(['update:showModal', 'addAccount']);

// 本地状态
const platform = ref('');
const username = ref('');
const password = ref('');
const filteredPlatforms = ref([]);
const showSuggestions = ref(false);

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
    emit('addAccount', {
      platform: platform.value,
      username: username.value,
      password: password.value
    });
    
    // 重置表单
    platform.value = '';
    username.value = '';
    password.value = '';
    emit('update:showModal', false);
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