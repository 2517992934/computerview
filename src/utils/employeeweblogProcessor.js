// src/utils/employeeWeblogProcessor.js

import weblogData from '@/assets/weblog_clean.json';
import profileData from '@/assets/employee_profile.json';

// 建立 IP 到 员工ID 的映射
const ipToEmployeeIdMap = new Map();
profileData.forEach(p => {
    ipToEmployeeIdMap.set(p.ip_address, p.employee_id);
});


// 辅助函数：根据员工IP和日期/月份筛选并统计网站访问次数
export function getWeblogDataByEmployeeAndDate({ profile, selectedDate }) {
    if (!profile) return [];

    const employeeIp = profile.ip_address;
    const isMonthly = !selectedDate;

    // 1. 筛选出该员工的日志记录
    const employeeLogs = weblogData.filter(log => log.sip === employeeIp);

    // 2. 进一步按日期筛选 (如果是按天查询)
    let filteredLogs = employeeLogs;
    if (!isMonthly) {
        const datePrefix = selectedDate.substring(0, 10); // 格式 'YYYY-MM-DD'
        filteredLogs = employeeLogs.filter(log => log.time.startsWith(datePrefix));
    }

    // 3. 统计网站访问次数
    const hostCounts = new Map();
    filteredLogs.forEach(log => {
        const host = log.host || 'UnknownHost';
        hostCounts.set(host, (hostCounts.get(host) || 0) + 1);
    });

    // 4. 转换成数组并排序
    const sortedCounts = Array.from(hostCounts.entries())
        .map(([host, count]) => ({ host, count }))
        .sort((a, b) => b.count - a.count); // 降序排列

    // 5. 取 Top 10
    return sortedCounts.slice(0, 10);
}

// 注意: 由于你提到 EmployeeProfileView.vue 依赖了 trafficData 的 weblogData，
// 这里提供一个简单的结构，方便 EmployeeProfileView 整合数据
export function getEmployeeWeblogData(employeeProfile) {
    // 默认获取整月 Top 10
    const monthlyWeblogData = getWeblogDataByEmployeeAndDate({
        profile: employeeProfile,
        selectedDate: null
    });

    return {
        // ... 其他 weblog 数据，这里仅返回访问次数
        weblogCountData: monthlyWeblogData,
    };
}