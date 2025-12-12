<template>
  <div class="chart-container">
    <h2>全员工考勤热力概览图 (工作时长)</h2>
    <div ref="chartRef" class="heatmap-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { processHeatmapData } from '../utils/attendanceProcessor..js';

const chartRef = ref(null);
let myChart = null;

const renderChart = () => {
  if (!chartRef.value) return;

  const { seriesData, xAxisData, yAxisData, maxValue, deptMarkPoints, deptMarkLines } = processHeatmapData();

  if (myChart) {
    myChart.dispose();
  }
  myChart = echarts.init(chartRef.value);

  const totalEmployees = yAxisData.length;
  const dynamicHeight = Math.max(800, totalEmployees * 20);
  chartRef.value.style.height = `${dynamicHeight}px`;

  const option = {
    tooltip: {
      position: 'top',
      formatter: function (params) {
        const hours = params.value[2];
        const day = xAxisData[params.value[0]];
        const employeeId = yAxisData[params.value[1]];
        if (hours > 0) {
          return `
                **员工ID: ${employeeId}**<br/>
                日期: ${day}<br/>
                **工作时长: ${hours.toFixed(2)} 小时**
            `;
        } else {
          return `员工ID: ${employeeId}<br/>日期: ${day}<br/>未打卡/缺勤`;
        }
      }
    },
    // ⭐️ 修正 1: grid.left 保持在 12%，为 MarkPoint 留出 Y 轴标签的空间
    grid: {
      left: '12%',
      right: '10%',
      bottom: '15%',
      top: '5%',
      containLabel: true,
    },

    // Y轴配置：Y轴 0 (左侧，用于 MarkPoint 定位)
    yAxis: [
      {
        type: 'category',
        data: yAxisData,
        // 隐藏标签，只留下轴线和网格线
        axisLabel: { show: false },
        axisTick: { show: false },
        axisLine: { show: false },
        splitArea: { show: true },
      },
      // Y轴 1: 辅助 Y 轴，用于在右侧显示员工编号 (最右边)
      {
        type: 'category',
        data: yAxisData,
        position: 'right', // 放在右侧
        axisLabel: {
          show: true,
          fontSize: 8,
          interval: Math.ceil(totalEmployees / 30),
          formatter: function (value) {
            return `${value}`;
          },
          inside: false,
          margin: 5
        },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { show: false }
      }
    ],

    // X轴配置 (平铺不倾斜)
    xAxis: {
      type: 'category',
      data: xAxisData,
      splitArea: { show: true },
      axisLabel: {
        rotate: 0,
        interval: Math.ceil(xAxisData.length / 10),
        margin: 10,
      }
    },

    // VisualMap (筛选条) 位置
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '2%',
      text: ['高工作时长 (小时)', '未打卡/缺勤 (0)'],
      inRange: {
        color: ['#eee', '#5AD8AA', '#F7B74E', '#FA8072']
      }
    },
    series: [
      {
        name: '工作时长',
        type: 'heatmap',
        data: seriesData,
        progressive: 500,
        yAxisIndex: 0, // 绑定到第一个 Y 轴
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 0.1
        },
        // MarkLine 隐藏标签 (解决数字显示问题)
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: '#2c3e50',
            type: 'solid',
            width: 2
          },
          label: {
            show: false
          },
          data: deptMarkLines
        },
        // ⭐️ 核心修正 2: MarkPoint 标签定位到 Y 轴标签区域
        markPoint: {
          symbol: 'none',
          data: deptMarkPoints.map(point => ({
            name: point.name,
            coord: [0, point.coord[1]],
            label: {
              show: true,
              // 修正：position: 'left' 将标签放在 MarkPoint (0, Y) 左侧
              position: 'left',
              formatter: `{b|${point.name}}`,
              // 修正：distance 负值将标签拉近 Y 轴，正值推远
              // -25 使标签紧贴 Y 轴左侧（即在 Y 轴标签区域）
              distance: -25,
              rich: {
                b: {
                  color: '#2c3e50',
                  fontWeight: 'bold',
                  fontSize: 16,
                  verticalAlign: 'middle',
                  // 移除负值 padding，因为 distance 负责定位到 Y 轴旁边
                }
              }
            }
          }))
        }
      }
    ]
  };

  myChart.setOption(option);
  window.addEventListener('resize', resizeChart);
};

const resizeChart = () => {
  myChart && myChart.resize();
};

onMounted(() => {
  renderChart();
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart);
  if (myChart) {
    myChart.dispose();
  }
});
</script>

<style scoped>
.chart-container {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 40px;
}
.heatmap-chart {
  width: 100%;
  min-height: 800px;
  min-width: 800px;
}
h2 {
  text-align: center;
  margin-bottom: 15px;
}
</style>