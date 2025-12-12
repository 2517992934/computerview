// src/utils/attendanceProcessor.js

// ✅ 使用相对路径修复 JSON 文件导入
import profileData from '../assets/employee_profile.json';
import checkingData from '../assets/checking_clean.json';

const MS_PER_HOUR = 60 * 60 * 1000;
// 定义部门的显示顺序：财务部（上） -> 人力资源部（中） -> 研发部（下）
const DEPT_ORDER = ['Finance', 'HR', 'R&D'];

// 预处理员工部门信息和排序
const employeeDeptMap = new Map();
const deptEmployeeIds = {
    'Finance': [],
    'HR': [],
    'R&D': []
};

profileData.forEach(p => {
    const id = String(p.employee_id);
    const dept = p.department;
    employeeDeptMap.set(id, dept);
    if (DEPT_ORDER.includes(dept)) {
        deptEmployeeIds[dept].push(id);
    }
});

// 2. 排序员工ID (按部门内部ID升序排列，保持一致性)
Object.keys(deptEmployeeIds).forEach(dept => {
    deptEmployeeIds[dept].sort();
});

// 3. 生成全局排序后的员工ID列表
let sortedEmployeeIds = [];
DEPT_ORDER.forEach(dept => {
    sortedEmployeeIds = sortedEmployeeIds.concat(deptEmployeeIds[dept]);
});
const uniqueEmployeeIds = new Set(sortedEmployeeIds);


// 供柱形图使用的函数 (保持不变)
export function processBarChartData(department) {
    const TIME_BINS = 24 * 4;
    const BIN_SIZE_MS = 15 * 60 * 1000;
    const targetEmployeeIds = Array.from(employeeDeptMap.entries())
        .filter(([id, dept]) => dept === department)
        .map(([id]) => id);
    const checkinFreq = new Array(TIME_BINS).fill(0);
    const checkoutFreq = new Array(TIME_BINS).fill(0);
    checkingData.forEach(item => {
        const id = String(item.id);
        if (targetEmployeeIds.includes(id)) {
            if (item.checkin) {
                const checkinDate = new Date(item.checkin);
                const totalMs = checkinDate.getHours() * MS_PER_HOUR + checkinDate.getMinutes() * 60 * 1000 + checkinDate.getSeconds() * 1000;
                const binIndex = Math.floor(totalMs / BIN_SIZE_MS);
                if (binIndex >= 0 && binIndex < TIME_BINS) { checkinFreq[binIndex]++; }
            }
            if (item.checkout) {
                const checkoutDate = new Date(item.checkout);
                const totalMs = checkoutDate.getHours() * MS_PER_HOUR + checkoutDate.getMinutes() * 60 * 1000 + checkoutDate.getSeconds() * 1000;
                const binIndex = Math.floor(totalMs / BIN_SIZE_MS);
                if (binIndex >= 0 && binIndex < TIME_BINS) { checkoutFreq[binIndex]++; }
            }
        }
    });
    const xLabels = [];
    for (let i = 0; i < TIME_BINS; i++) {
        if (i % 4 === 0) {
            const hour = Math.floor(i / 4);
            xLabels.push(hour.toString().padStart(2, '0') + ':00');
        } else {
            xLabels.push('');
        }
    }
    return { checkin: checkinFreq, checkout: checkoutFreq, xLabels: xLabels };
}


/**
 * 1. 处理全员工考勤热力图数据 (图 2-1)
 * 重点：返回部门标记点和分界线数据
 */
export function processHeatmapData() {
    const allWorkDays = new Set();
    const employeeDailyStats = new Map();

    checkingData.forEach(item => {
        const id = String(item.id);
        const day = item.day;

        if (!uniqueEmployeeIds.has(id)) return;

        allWorkDays.add(day);

        let workDuration = 0;
        if (item.checkin && item.checkout) {
            const checkinTime = new Date(item.checkin).getTime();
            const checkoutTime = new Date(item.checkout).getTime();
            workDuration = checkoutTime - checkinTime;
            if (workDuration < 0 || workDuration > 14 * MS_PER_HOUR) {
                workDuration = 0;
            }
        }
        const workDurationHours = workDuration / MS_PER_HOUR;

        if (!employeeDailyStats.has(id)) {
            employeeDailyStats.set(id, new Map());
        }
        employeeDailyStats.get(id).set(day, workDurationHours);
    });

    const sortedDays = Array.from(allWorkDays).sort();

    let maxWorkHours = 0;
    const seriesData = [];

    sortedDays.forEach((day, dayIndex) => {
        sortedEmployeeIds.forEach((id, empIndex) => {
            const workHours = employeeDailyStats.get(id)?.get(day) || 0;
            seriesData.push([dayIndex, empIndex, parseFloat(workHours.toFixed(2))]);
            if (workHours > maxWorkHours) {
                maxWorkHours = workHours;
            }
        });
    });

    // ⭐️ 生成部门标记点数据 (MarkPoint for Left Label)
    const deptNames = { 'Finance': '财务部', 'HR': '人力资源部', 'R&D': '研发部' };
    const deptMarkPoints = [];
    let cumulativeCount = 0;

    DEPT_ORDER.forEach(dept => {
        const count = deptEmployeeIds[dept].length;
        if (count > 0) {
            // 计算部门名称应该放在 Y 轴上的员工索引中点
            const midpointIndex = cumulativeCount + Math.floor(count / 2);
            deptMarkPoints.push({
                name: deptNames[dept],
                coord: [0, midpointIndex], // 坐标：X轴选择 0 索引，Y轴选择员工索引中点
            });
            cumulativeCount += count;
        }
    });

    // ⭐️ 生成部门分界线数据 (MarkLine)
    const deptMarkLines = [];
    let lineIndex = 0;

    // Finance/HR 分界线
    lineIndex = deptEmployeeIds['Finance'].length;
    if (lineIndex > 0 && deptEmployeeIds['HR'].length > 0) {
        // ECharts 类别轴分界线位置
        deptMarkLines.push({ yAxis: lineIndex - 0.5 });
    }

    // HR/R&D 分界线
    lineIndex += deptEmployeeIds['HR'].length;
    if (lineIndex > 0 && deptEmployeeIds['R&D'].length > 0) {
        deptMarkLines.push({ yAxis: lineIndex - 0.5 });
    }

    return {
        seriesData,
        xAxisData: sortedDays,
        yAxisData: sortedEmployeeIds,
        maxValue: Math.ceil(maxWorkHours),
        deptMarkPoints,
        deptMarkLines,
    };
}