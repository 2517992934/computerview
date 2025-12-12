// src/main.js (示例，确保你的文件中有类似代码)

import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // 导入路由实例

const app = createApp(App);
app.use(router); // 启用 Vue Router
app.mount('#app');