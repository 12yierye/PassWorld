import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// 在Electron环境中直接创建应用
const app = createApp(App)

// 挂载应用到DOM
app.mount('#app')