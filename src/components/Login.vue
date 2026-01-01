<template>
  <div class="login-container">
    <div class="login-box">
      <h1>PassWorld 登录</h1>
      
      <div v-if="step === 'authMethod'" class="auth-method">
        <p>请选择验证方式</p>
        <div class="button-group">
          <button @click="step = 'login'" class="auth-btn">登录</button>
          <button @click="step = 'register'" class="auth-btn">注册</button>
        </div>
      </div>
      
      <div v-if="step === 'login'" class="login-step">
        <h2>登录</h2>
        <div class="input-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="请输入用户名" />
        </div>
        <button @click="startFaceAuth" :disabled="loading" class="submit-btn">
          <span v-if="!loading">人脸识别登录</span>
          <span v-else>识别中...</span>
        </button>
        <button @click="step = 'authMethod'" class="back-btn">返回</button>
      </div>
      
      <div v-if="step === 'register'" class="register-step">
        <h2>注册</h2>
        <div v-if="registerStep === 1">
          <div class="input-group">
            <label>用户名</label>
            <input v-model="username" type="text" placeholder="请输入用户名" />
          </div>
          <button @click="checkUsername" :disabled="loading" class="submit-btn">
            <span v-if="!loading">下一步</span>
            <span v-else>检查中...</span>
          </button>
          <button @click="step = 'authMethod'" class="back-btn">返回</button>
        </div>
        <div v-else-if="registerStep === 2">
          <p>请录入您的面部信息</p>
          <div class="video-container">
            <video ref="videoRef" :width="400" :height="300" autoplay muted></video>
          </div>
          <button @click="captureFace" :disabled="loading" class="capture-btn">
            <span v-if="!loading">录入人脸</span>
            <span v-else>录入中...</span>
          </button>
          <button @click="registerStep = 1" class="back-btn">重新输入</button>
        </div>
        <div v-else-if="registerStep === 3">
          <p>人脸录入成功！</p>
          <button @click="completeRegistration" class="submit-btn">完成注册</button>
        </div>
      </div>
      
      <div v-if="message" class="message">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import faceManager from '../utils/faceManager';

// 状态变量
const step = ref('authMethod'); // authMethod, login, register
const registerStep = ref(1); // 1: 输入用户名, 2: 录入人脸, 3: 完成
const username = ref('');
const message = ref('');
const loading = ref(false);
const videoRef = ref(null);
let faceDescriptors = ref([]);

// 检查用户名是否已存在
const checkUsername = async () => {
  if (!username.value.trim()) {
    message.value = '请输入用户名';
    return;
  }
  
  loading.value = true;
  message.value = '检查用户名...';
  
  // 检查本地存储中的账户
  const accounts = JSON.parse(localStorage.getItem('faceAccounts') || '[]');
  const userExists = accounts.some(acc => acc.username === username.value);
  
  if (userExists) {
    message.value = '用户名已存在，请选择其他用户名';
    loading.value = false;
    return;
  }
  
  // 加载模型
  const modelsLoaded = await faceManager.loadModels();
  if (!modelsLoaded) {
    message.value = '人脸识别模型加载失败';
    loading.value = false;
    return;
  }
  
  registerStep.value = 2;
  loading.value = false;
};

// 开始人脸识别登录
const startFaceAuth = async () => {
  if (!username.value.trim()) {
    message.value = '请输入用户名';
    return;
  }
  
  loading.value = true;
  message.value = '加载识别模型...';
  
  // 加载模型
  const modelsLoaded = await faceManager.loadModels();
  if (!modelsLoaded) {
    message.value = '人脸识别模型加载失败';
    loading.value = false;
    return;
  }
  
  // 获取用户摄像头权限
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
    
    message.value = '请看摄像头，正在进行人脸识别...';
    
    // 等待界面更新后再执行识别
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 获取所有账户信息
    const accounts = JSON.parse(localStorage.getItem('faceAccounts') || '[]');
    
    // 尝试识别人脸
    const result = await faceManager.recognizeFace(videoRef.value, accounts);
    
    if (result.success) {
      if (result.username === username.value) {
        // 登录成功
        localStorage.setItem('currentUsername', username.value);
        message.value = '登录成功！';
        
        // 停止摄像头
        stream.getTracks().forEach(track => track.stop());
        
        // 延迟重载页面以显示消息
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        message.value = '用户名与面部不匹配';
      }
    } else {
      message.value = result.message || '人脸识别失败';
    }
    
    // 停止摄像头
    stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    console.error('访问摄像头失败:', error);
    message.value = '无法访问摄像头，请检查权限';
  }
  
  loading.value = false;
};

// 录入人脸
const captureFace = async () => {
  if (!videoRef.value) return;
  
  loading.value = true;
  message.value = '正在录入人脸...';
  
  // 加载模型（以防万一）
  const modelsLoaded = await faceManager.loadModels();
  if (!modelsLoaded) {
    message.value = '人脸识别模型加载失败';
    loading.value = false;
    return;
  }
  
  try {
    // 捕获面部特征
    const result = await faceManager.registerFace(videoRef.value);
    
    if (result.success) {
      // 检查是否超过注册限制
      const accounts = JSON.parse(localStorage.getItem('faceAccounts') || '[]');
      const isOverLimit = await faceManager.isFaceOverLimit(result.descriptor, accounts);
      
      if (isOverLimit) {
        message.value = '该面部已注册超过2个账户，无法继续注册';
        loading.value = false;
        return;
      }
      
      // 保存面部特征
      faceDescriptors.value.push(result.descriptor);
      message.value = '人脸录入成功！';
      registerStep.value = 3;
    } else {
      message.value = result.message || '人脸录入失败';
    }
  } catch (error) {
    console.error('人脸录入失败:', error);
    message.value = '人脸录入失败，请重试';
  }
  
  loading.value = false;
};

// 完成注册
const completeRegistration = () => {
  // 检查是否有面部数据
  if (faceDescriptors.value.length === 0) {
    message.value = '请先录入面部信息';
    return;
  }
  
  // 获取现有的账户数据
  const accounts = JSON.parse(localStorage.getItem('faceAccounts') || '[]');
  
  const newAccount = {
    username: username.value,
    faceDescriptors: faceDescriptors.value
  };
  
  accounts.push(newAccount);
  localStorage.setItem('faceAccounts', JSON.stringify(accounts));
  
  message.value = '注册成功！';
  step.value = 'authMethod';
  registerStep.value = 1;
  username.value = '';
  faceDescriptors.value = [];
};

onMounted(async () => {
  // 加载模型
  await faceManager.loadModels();
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #4285f4, #34a853, #fbbc05, #ea4335);
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

h1 {
  margin-bottom: 1.5rem;
  color: #4285f4;
}

h2 {
  margin-bottom: 1rem;
  color: #555;
}

.auth-method, .login-step, .register-step {
  margin: 1.5rem 0;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.auth-btn {
  flex: 1;
  padding: 12px;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.auth-btn:hover {
  background-color: #3367d6;
}

.input-group {
  margin-bottom: 1rem;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.submit-btn, .capture-btn {
  width: 100%;
  padding: 12px;
  background-color: #34a853;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 1rem;
}

.submit-btn:hover, .capture-btn:hover {
  background-color: #2d8e47;
}

.submit-btn:disabled, .capture-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.back-btn {
  width: 100%;
  padding: 10px;
  background-color: #f1f3f4;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.back-btn:hover {
  background-color: #e8eaed;
}

.video-container {
  margin: 1rem 0;
  display: flex;
  justify-content: center;
}

.message {
  margin-top: 1rem;
  padding: 10px;
  background-color: #f1f3f4;
  border-radius: 4px;
  color: #5f6368;
}
</style>