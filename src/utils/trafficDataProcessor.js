// src/utils/trafficDataProcessor.js (最终修正)

import tpcLogData from '@/assets/tcplog_clean.json';

/**
 * 辅助函数：将完整时间字符串 ('YYYY-MM-DD HH:mm:ss') 截断为小时时间键 ('YYYY-MM-DD HH')
 */
function toHourlyKey(stime) {
    if (!stime) return null;
    return stime.substring(0, 13); // 例如 '2017-11-01 02'
}

/**
 * 辅助函数：生成一天内从 00到 23 的小时时间戳键 (YYYY-MM-DD HH)
 */
function generateHourlyKeys(date) {
    const keys = [];
    for (let i = 0; i < 24; i++) {
        keys.push(`${date} ${String(i).padStart(2, '0')}`);
    }
    return keys;
}


/**
 * 处理单个员工的上下行流量数据
 * @param {string} employeeIp 要搜索的员工 IP 地址
 * @param {string | null} selectedDate 可选，YYYY-MM-DD 格式，用于查询单日数据
 */
export function getEmployeeTrafficData(employeeIp, selectedDate = null) {
    if (!employeeIp) {
        return { timestamps: [], upstreamData: [], downstreamData: [] };
    }

    // 1. 过滤出该员工 IP 的所有流量记录
    let employeeTrafficRecords = tpcLogData.filter(r => r.sip === employeeIp);

    // ⭐️ 关键：如果提供了日期，进一步过滤到该日期
    if (selectedDate) {
        employeeTrafficRecords = employeeTrafficRecords.filter(r =>
            r.stime.startsWith(selectedDate)
        );
    }

    // 2. 按小时聚合流量数据
    const hourlyTrafficMap = new Map();

    employeeTrafficRecords.forEach(record => {
        const hourlyKey = toHourlyKey(record.stime); // YYYY-MM-DD HH
        if (!hourlyKey) return;

        const uplink = record.uplink_length || 0;
        const downlink = record.downlink_length || 0;

        if (!hourlyTrafficMap.has(hourlyKey)) {
            hourlyTrafficMap.set(hourlyKey, { uplink: 0, downlink: 0 });
        }

        const current = hourlyTrafficMap.get(hourlyKey);
        current.uplink += uplink;
        current.downlink += downlink;
    });

    let dataKeys;
    let timestamps; // ECharts X 轴标签


    // 3. 根据是否选择日期，决定 X 轴标签和填充逻辑
    if (selectedDate) {
        // 如果是单日查询，生成 00 到 23 小时的完整时间轴键 (YYYY-MM-DD HH)
        dataKeys = generateHourlyKeys(selectedDate);
        // X 轴标签显示 HH:00
        timestamps = dataKeys.map(key => key.substring(11) + ':00');

    } else {
        // 否则，按月查询，只使用有数据的记录时间键，并排序 (YYYY-MM-DD HH)
        dataKeys = Array.from(hourlyTrafficMap.keys()).sort();
        // X 轴标签显示 MM-DD HH:00
        timestamps = dataKeys.map(key => key.substring(5) + ':00');
    }

    const upstreamData = [];
    const downstreamData = [];

    // 4. 填充数据
    dataKeys.forEach(key => {
        const data = hourlyTrafficMap.get(key);

        if (data) {
            upstreamData.push(data.uplink);
            downstreamData.push(-data.downlink); // 下行流量取负值
        } else {
            upstreamData.push(null);
            downstreamData.push(null);
        }
    });

    return {
        timestamps, // ECharts X 轴标签数组 (MM-DD HH:00 或 HH:00)
        upstreamData,
        downstreamData
    };
}