<template>
  <div ref="chartRef" class="department-graph"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import * as echarts from 'echarts';

// 导入所有必需数据源
import internalInteractionsData from '@/assets/internal_employee_interactions.json';
import allInteractionsData from '@/assets/email_undirected_interactions.json';
// 核心新增：导入用于计算信息熵（部门内部唯一发件人数）的新数据源
import inDegreeData from '@/assets/employee_same_dept_in_degree.json';

import { processDataForGraph } from '@/utils/dataProcessor';

const departmentNames = {
  'Finance': '财务部',
  'HR': '人力资源部',
  'R&D': '研发部'
};

const props = defineProps({
  department: {
    type: String,
    required: true,
    validator: (value) => ['Finance', 'HR', 'R&D'].includes(value)
  }
});

const chartRef = ref(null);
let myChart = null;

const initChart = (dept) => {
  if (!chartRef.value) return;

  if (myChart) {
    myChart.dispose();
  }
  myChart = echarts.init(chartRef.value);

  // 传递所有数据源，包括新的 inDegreeData
  const graphData = processDataForGraph(internalInteractionsData, allInteractionsData, inDegreeData, dept);
  const departmentName = departmentNames[dept];

  // ⭐️ 核心优化 1: 动态调整斥力值
  // 研发部数据量大，需要更大的斥力值来分散节点，解决拥挤问题。
  const repulsionValue =
      dept === 'R&D' ? 20000 : // 研发部使用最大的斥力
          15000; // HR 和 Finance 使用适中的值

  const option = {
    title: {
      text: null,
      subtext: null,
    },
    tooltip: {
      formatter: function (params) {
        if (params.dataType === 'node') {
          // params.data.value 现在是“部门内部唯一发件人数”
          const contactCount = params.data.value;
          const internalCount = params.data.rawTotalWeight;

          return `
                        **员工 ID: ${params.name}**<br/>
                        部门: ${departmentName}<br/>
                        节点半径 (部门内部邮件总数): ${internalCount} 封<br/>
                        **信息熵 (部门内部唯一发件人数): ${contactCount} 人**<br/>
                        （颜色越橙，联系伙伴越多）
                    `;
        } else if (params.dataType === 'edge') {
          return `
                        ${params.data.source} ↔ ${params.data.target}<br/>
                        **部门内部邮件往来数量: ${params.data.value} 封**
                    `;
        }
      }
    },
    legend: {
      data: graphData.categories.map(c => c.name),
      bottom: 0,
      left: 'left'
    },
    series: [
      {
        name: departmentName,
        type: 'graph',
        layout: 'force',
        data: graphData.nodes,
        links: graphData.links,
        categories: graphData.categories,
        roam: true, // 允许缩放和平移
        // ⭐️ 核心优化 2: 标签配置，解决标签溢出问题
        label: {
          show: true,
          position: 'inside', // 标签显示在圆圈内
          formatter: '{b}', // 显示员工ID
          fontSize: 6, // 字体缩小，防止溢出
          color: '#000',
          fontWeight: 'bold',
          overflow: 'truncate', // 关键：截断溢出标签
        },
        // ⭐️ 核心优化 3: 力导向布局配置
        force: {
          repulsion: repulsionValue, // 使用动态斥力值 (R&D 为 20000)
          edgeLength: [100, 250],
          gravity: 0.05,
          layoutAnimation: true,
        },
        // ⭐️ 核心优化 4: 边线样式配置，减少视觉混乱
        lineStyle: {
          opacity: 0.4, // 降低透明度
          curveness: 0.1
        },
        itemStyle: {
          borderColor: '#333',
          borderWidth: 0.5
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4,
            color: '#333'
          },
          label: {
            show: true,
            position: 'inside',
            fontWeight: 'bold',
            color: '#000',
            fontSize: 10
          }
        }
      }
    ]
  };

  myChart.setOption(option);

  window.addEventListener('resize', () => {
    myChart && myChart.resize();
  });
};

onMounted(() => {
  initChart(props.department);
});

watch(() => props.department, (newDept) => {
  initChart(newDept);
});
</script>

<style scoped>
.department-graph {
  width: 100%;
  height: 1000px;
  min-height: 500px;
}
</style>