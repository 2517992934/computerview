// src/utils/employeeDataProcessor.js (完整替换)

import checkingData from '@/assets/checking_clean.json';
import profileData from '@/assets/employee_profile.json';

// 1. 定义工作时间 (虽然在这个视图中不直接用于异常判断，但保留)
const WORK_HOURS = {
    'Finance': { start: '08:00:00', end: '17:00:00' },
    'HR': { start: '09:00:00', end: '18:00:00' },
    'R&D': { start: '09:00:00', end: '18:00:00' }
};

// 2. 建立员工ID到部门的映射
const employeeIdToDeptMap = new Map();
profileData.forEach(p => {
    employeeIdToDeptMap.set(Number(p.employee_id), p.department);
});

// 辅助函数：将 HH:mm:ss 格式的时间转换为从午夜开始的秒数
function timeToSeconds(timeString) {
    if (!timeString) return NaN;
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2] || 0, 10);
    return hours * 3600 + minutes * 60 + seconds;
}

// 辅助函数：将秒数转换回 HH:mm:ss 格式的时间字符串
function secondsToTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) return 'N/A';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(seconds).padStart(2, '0')
    ].join(':');
}

/**
 * 处理单个员工的考勤数据
 */
export function getEmployeeAttendanceData(employeeId) {
    const id = Number(employeeId);

    const employeeProfile = profileData.find(p => Number(p.employee_id) === id);
    if (!employeeProfile) return null;

    const employeeRecords = checkingData.filter(r => Number(r.id) === id);

    // 建立 [day] -> record 的映射，方便快速查找和填充日期
    const recordMap = new Map();
    employeeRecords.forEach(r => recordMap.set(r.day, r));

    // 4. 生成 11 月完整的 1 号到 30 号日期列表
    const allDays = Array.from({ length: 30 }, (_, i) => `2017-11-${String(i + 1).padStart(2, '0')}`);

    let totalCheckinSeconds = 0;
    let totalCheckoutSeconds = 0;
    let validDays = 0;

    const dailyData = [];

    allDays.forEach(day => {
        const record = recordMap.get(day);

        let checkinSeconds = NaN;
        let checkoutSeconds = NaN;
        let durationSeconds = NaN;
        let checkinFullTime = null;
        let checkoutFullTime = null;
        let isAbsence = true;

        if (record && record.is_absence !== 1) {
            checkinFullTime = record.checkin;
            checkoutFullTime = record.checkout;
            isAbsence = false;

            const checkinTimeStr = checkinFullTime ? checkinFullTime.split(' ')[1] : null;
            const checkoutTimeStr = checkoutFullTime ? checkoutFullTime.split(' ')[1] : null;

            checkinSeconds = checkinTimeStr ? timeToSeconds(checkinTimeStr) : NaN;
            checkoutSeconds = checkoutTimeStr ? timeToSeconds(checkoutTimeStr) : NaN;

            if (!isNaN(checkinSeconds) && !isNaN(checkoutSeconds)) {
                durationSeconds = Math.max(0, checkoutSeconds - checkinSeconds);

                totalCheckinSeconds += checkinSeconds;
                totalCheckoutSeconds += checkoutSeconds;
                validDays++;
            }
        }

        // 收集 ECharts 需要的数据点
        dailyData.push({
            day: day,
            // 柱形图起点 (签到秒数)
            checkinSec: isNaN(checkinSeconds) ? null : checkinSeconds,
            // 柱形图高度 (工作时长秒数)
            durationSec: isNaN(durationSeconds) ? null : durationSeconds,
            // 完整的签到/签退时间字符串，用于 Tooltip
            checkinFullTime: checkinFullTime,
            checkoutFullTime: checkoutFullTime,
            isAbsent: isAbsence || isNaN(durationSeconds)
        });
    });

    // 5. 计算平均值
    const avgCheckinSeconds = validDays > 0 ? totalCheckinSeconds / validDays : NaN;
    const avgCheckoutSeconds = validDays > 0 ? totalCheckoutSeconds / validDays : NaN;

    // 6. 组装最终结果给 ECharts
    const barData = dailyData.map(d => ({
        // ECharts 堆叠图数据：[X轴标签, 堆叠基线高度, 堆叠可见高度]
        name: d.day, // 用于 Tooltip
        value: [d.day.substring(8), d.checkinSec || 0, d.durationSec || 0],
        // 存储完整的打卡信息，供 Tooltip 查找
        tooltipData: {
            checkinFullTime: d.checkinFullTime,
            checkoutFullTime: d.checkoutFullTime,
            isAbsent: d.isAbsent
        }
    }));

    return {
        profile: employeeProfile,
        dailyData: barData,
        avgCheckinSeconds: avgCheckinSeconds,
        avgCheckoutSeconds: avgCheckoutSeconds,
        avgCheckinTimeStr: secondsToTime(avgCheckinSeconds),
        avgCheckoutTimeStr: secondsToTime(avgCheckoutSeconds)
    };
}