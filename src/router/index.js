// src/router/index.js (最终修正版本)

import { createRouter, createWebHashHistory } from 'vue-router';

// 导入主视图组件
import GraphView from '@/views/GraphView.vue';
import AttendanceView from '@/views/AttendanceView.vue';
import LogAnalysisView from '@/views/LogAnalysisView.vue';
import AnomalyAnalysisView from '@/views/AnomalyAnalysisView.vue'; // ⭐️ 新增：异常分析模块的主视图
import EmployeeProfileView from '@/views/EmployeeProfileView.vue'; // ⭐️ 新增: 员工个人信息视图
import EmployeeTrafficChart from '@/components/EmployeeTrafficChart.vue'; // ⭐️ 新增: 员工流量图表组件
// 导入图表组件
import AttendanceBarChart from '@/components/AttendanceBarChart.vue';
import AttendanceHeatmap from '@/components/AttendanceHeatmap.vue';
import AttendanceAnomalyChart from '@/components/AttendanceAnomalyChart.vue'; // 考勤异常图表组件
import ParallelLogChart from '@/components/ParallelLogChart.vue';
import EmployeeAttendanceChart from '@/components/EmployeeAttendanceChart.vue'; // ⭐️ 新增: 员工考勤图表组件

import EmployeeWeblogChart from '@/components/EmployeeWeblogChart.vue'; // ⭐️ 新增: 员工网站访问次数图表组件
// ⭐️ 新增：导入越权操作日志图表组件
import EmployeeLoginChart from '@/components/EmployeeLoginChart.vue';
const routes = [
    {
        path: '/',
        redirect: '/graph'
    },
    {
        path: '/graph',
        name: 'Graph',
        component: GraphView,
        meta: { title: '部门组织结构图' }
    },
    {
        path: '/attendance',
        name: 'Attendance',
        component: AttendanceView,
        meta: { title: '员工考勤时间分析' },
        children: [
            {
                path: 'heatmap', // 路径: /attendance/heatmap
                name: 'AttendanceHeatmap',
                component: AttendanceHeatmap,
                meta: { title: '考勤热力概览' }
            },
            // ⭐️ 已移除考勤异常分析子路由
            {
                // 注意：这里使用动态参数 :dept
                path: 'time-distribution/:dept',
                name: 'TimeDistribution',
                component: AttendanceBarChart,
                props: true,
                meta: { title: '上下班时间分布' }
            },
            {
                path: '',
                redirect: { name: 'AttendanceHeatmap' }
            }
        ]
    },
    // ⭐️ 新增：考勤异常分析模块 (使用独立顶级结构)
    {
        path: '/anomaly-analysis',
        name: 'AnomalyAnalysis',
        component: AnomalyAnalysisView,
        meta: { title: '员工异常情况分析' },
        children: [
            {
                path: 'attendance-anomaly', // 路径: /anomaly-analysis/attendance-anomaly
                name: 'AttendanceAnomaly',
                component: AttendanceAnomalyChart,
                meta: { title: '考勤异常详情' }
            },
            // 默认子路由
            {
                path: '',
                redirect: { name: 'AttendanceAnomaly' }
            }
        ]
    },
    // ⭐️ 新增：员工个人信息分析模块
    {
        path: '/employee-profile',
        name: 'EmployeeProfile',
        component: EmployeeProfileView, // 主视图
        meta: { title: '员工个人信息分析' },
        children: [
            {
                path: 'attendance-chart', // 路径: /employee-profile/attendance-chart
                name: 'EmployeeAttendanceChart',
                component: EmployeeAttendanceChart, // 图表组件
                meta: { title: '员工每日考勤图' }
            },
            {
                path: 'traffic-chart', // ⭐️ 新增：流量图
                name: 'EmployeeTrafficChart',
                component: EmployeeTrafficChart,
                meta: { title: '员工上下行流量图' }
            },
            {
                path: 'weblog-chart', // ⭐️ 新增：网站访问次数图
                name: 'EmployeeWeblogChart',
                component: EmployeeWeblogChart,
                meta: { title: '员工网站访问次数图' }
            },
            // ⭐️ 新增：越权操作日志图表路由
            {
                path: 'login-chart',
                name: 'EmployeeLoginChart',
                component: EmployeeLoginChart,
                meta: { title: '员工越权操作日志图' }
            },

            // 默认子路由
            {
                path: '',
                redirect: { name: 'EmployeeAttendanceChart' }
            }
        ]
    },
    // ⭐️ 保留：网络日志分析模块
    {
        path: '/log-analysis',
        name: 'LogAnalysis',
        component: LogAnalysisView,
        meta: { title: '网络日志分析' },
        children: [
            {
                path: 'parallel-coord',
                name: 'ParallelCoord',
                component: ParallelLogChart,
                meta: { title: '日志平行坐标图' }
            },
            {
                path: '',
                redirect: { name: 'ParallelCoord' }
            }
        ]
    }
];

// 使用 createWebHashHistory 模式
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