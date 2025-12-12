// src/utils/dataProcessor.js

/**
 * 颜色插值函数 (保持不变)
 */
function interpolateColor(colorA, colorB, fraction) {
    const f = Math.max(0, Math.min(1, fraction));

    const rA = parseInt(colorA.substring(1, 3), 16);
    const gA = parseInt(colorA.substring(3, 5), 16);
    const bA = parseInt(colorA.substring(5, 7), 16);

    const rB = parseInt(colorB.substring(1, 3), 16);
    const gB = parseInt(colorB.substring(3, 5), 16);
    const bB = parseInt(colorB.substring(5, 7), 16);

    const r = Math.round(rA + (rB - rA) * f);
    const g = Math.round(gA + (gB - gA) * f);
    // 修正了上一个回复中 b 分量计算的小错误
    const b = Math.round(bA + (bB - bA) * f);


    const toHex = c => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


/**
 * 核心数据处理函数
 * ⭐️ 签名更新：新增 inDegreeData 参数
 */
export function processDataForGraph(internalInteractions, allInteractions, inDegreeData, department) {

    // 1. 构建信息熵（In-Degree）映射表 (核心修改)
    const entropyMap = new Map();
    const employeeEntropies = [];

    // ⭐️ 使用新的 inDegreeData 文件来确定信息熵 H
    const filteredInDegree = inDegreeData.filter(item => item.department === department);

    // 填充 entropyMap 和 employeeEntropies 数组
    filteredInDegree.forEach(item => {
        // same_dept_sender_count 即为部门内部的唯一发件人数量，用作“信息熵”
        const entropyValue = item.same_dept_sender_count;
        entropyMap.set(item.employee_id, entropyValue);
        employeeEntropies.push(entropyValue);
    });

    // 2. 筛选部门内部交互 (用于节点半径和链接)
    const filteredInteractions = internalInteractions.filter(item =>
        item.dept_a === department && item.dept_b === department
    );

    const emailCounts = {};
    const uniqueEmployees = new Set();

    // ... (内部邮件总数计算，用于节点大小) ...
    let maxInternalEmailCount = 0;
    filteredInteractions.forEach(item => {
        // 确保所有在内部有交互的员工都被包含在 uniqueEmployees 中
        uniqueEmployees.add(item.node_a);
        uniqueEmployees.add(item.node_b);
        emailCounts[item.node_a] = (emailCounts[item.node_a] || 0) + item.weight;
        emailCounts[item.node_b] = (emailCounts[item.node_b] || 0) + item.weight;
    });

    // 确保 inDegreeData 中有数据但 internalInteractions 中没有交互的员工也被加入节点列表
    filteredInDegree.forEach(item => {
        // 如果该员工在内部交互数据中不存在，也要将其 ID 加入
        if (!uniqueEmployees.has(item.employee_id)) {
            uniqueEmployees.add(item.employee_id);
            // 如果在内部交互中没有，则邮件总数设为 0
            emailCounts[item.employee_id] = 0;
        }
    });


    // 重新计算 maxInternalEmailCount (确保包含所有节点)
    for (const id of uniqueEmployees) {
        if (emailCounts[id] > maxInternalEmailCount) {
            maxInternalEmailCount = emailCounts[id];
        }
        // 如果该员工在 inDegreeData 中没有记录，则其熵值应该为 0。
        if (!entropyMap.has(id)) {
            entropyMap.set(id, 0);
            employeeEntropies.push(0);
        }
    }


    const counts = Object.values(emailCounts);
    const minInternalCount = counts.length > 0 ? Math.min(...counts) : 0;
    const maxInternalCount = maxInternalEmailCount;

    // 确定当前部门的局部信息熵（唯一发件人数量）范围
    const minEntropy = employeeEntropies.length > 0 ? Math.min(...employeeEntropies) : 0;
    const maxEntropy = employeeEntropies.length > 0 ? Math.max(...employeeEntropies) : 0;

    // 节点尺寸设置 (保持不变)
    const MIN_SIZE = 25;
    const MAX_SIZE = 50;

    // 定义颜色范围 (保持不变)
    const LOW_ENTROPY_COLOR = '#5AD8A6'; // 绿色 (少联系)
    const HIGH_ENTROPY_COLOR = '#F7B74E'; // 橙色 (多联系)

    // 边宽设置 (保持不变)
    const maxWeight = filteredInteractions.length > 0 ? Math.max(...filteredInteractions.map(i => i.weight)) : 0;
    const MAX_EDGE_WIDTH = 3;

    // 3. 构建节点 (Nodes) 数据
    const nodes = Array.from(uniqueEmployees).map(employeeId => {

        // 从新的 entropyMap 获取熵值
        const entropyValue = entropyMap.get(employeeId) || 0;
        const internalCount = emailCounts[employeeId] || 0;

        let size = MIN_SIZE;
        let color = LOW_ENTROPY_COLOR;

        // 节点尺寸 (基于内部邮件总数)
        if (maxInternalCount > minInternalCount) {
            const sizeScale = (internalCount - minInternalCount) / (maxInternalCount - minInternalCount);
            size = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * sizeScale;
        }

        // 颜色映射 (基于唯一发件人数量)
        if (maxEntropy > minEntropy) {
            let colorFraction = (entropyValue - minEntropy) / (maxEntropy - minEntropy);

            // 平方根校准，保持不变
            const CALIBRATION_FACTOR = 0.5;
            const calibratedFraction = Math.pow(colorFraction, CALIBRATION_FACTOR);

            color = interpolateColor(LOW_ENTROPY_COLOR, HIGH_ENTROPY_COLOR, calibratedFraction);
        }

        return {
            id: employeeId,
            name: employeeId,
            symbolSize: size,
            // value 现为部门内部唯一发件人数量
            value: entropyValue,
            rawTotalWeight: internalCount,
            category: 0,
            itemStyle: {
                color: color
            }
        };
    });

    // 4. 构建边 (Links) 数据 (保持不变)
    const links = filteredInteractions.map(item => ({
        source: item.node_a,
        target: item.node_b,
        value: item.weight,
        lineStyle: {
            width: maxWeight > 0 ? Math.max(0.5, (item.weight / maxWeight) * MAX_EDGE_WIDTH) : 0.5,
            opacity: 0.6,
            curveness: 0.1
        }
    }));

    // 5. 定义类别 (更新toFixed(0)以匹配整数联系人数)
    const categories = [
        { name: `低信息熵(${minEntropy.toFixed(0)})/少联系`, itemStyle: { color: LOW_ENTROPY_COLOR } },
        { name: `高信息熵(${maxEntropy.toFixed(0)})/多联系`, itemStyle: { color: HIGH_ENTROPY_COLOR } }
    ];

    return { nodes, links, categories, maxCount: maxInternalCount };
}