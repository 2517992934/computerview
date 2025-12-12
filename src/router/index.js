// src/router/index.js

import { createRouter, createWebHashHistory } from 'vue-router';
// 导入两个视图组件
import GraphView from '@/views/GraphView.vue';
import AttendanceView from '@/views/AttendanceView.vue';

const routes = [
    {
        path: '/',
        redirect: '/graph' // 设置默认路径重定向到组织结构图
    },
    {
        path: '/graph',
        name: 'Graph',
        component: GraphView, // 对应组织结构图模块
        meta: { title: '部门组织结构图' }
    },
    {
        path: '/attendance',
        name: 'Attendance',
        component: AttendanceView, // 对应考勤分析模块
        meta: { title: '员工考勤时间分析' }
    }
];

// 使用 createWebHashHistory 模式 (适用于本地文件部署或简单应用)
const router = createRouter({
    history: createWebHashHistory(),
    routes
});

// 可选：每次路由跳转后更新页面标题
router.beforeEach((to, from, next) => {
    if (to.meta.title) {
        document.title = to.meta.title;
    }
    next();
});

export default router;