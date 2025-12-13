<template>
  <div class="chart-container">
    <h2>全员工考勤热力概览图 (工作时长)</h2>

    <div class="filter-controls">
      <label for="dept-select">部门筛选：</label>
      <select id="dept-select" v-model="selectedDepartment" @change="updateChart">
        <option
            v-for="(range, dept) in departmentRanges"
            :key="dept"
            :value="dept"
        >
          {{ dept }}
        </option>
      </select>
    </div>

    <div class="heatmap-wrapper">
      <div
          ref="chartRef"
          class="heatmap-chart"
          :style="{ height: `${CHART_FIXED_HEIGHT}px` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import {
  processHeatmapData,
  employeeDeptNameMap
} from '../utils/attendanceProcessor.js';

const chartRef = ref(null);
let myChart = null;

const {
  seriesData,
  xAxisData,
  yAxisData,
  maxValue,
  deptMarkLines,
  deptMarkPoints,
  departmentRanges,
  dateRange,
  attendanceDetailMap
} = processHeatmapData();
const totalEmployees = yAxisData.length;

const selectedDepartment = ref('全部');
const CHART_FIXED_HEIGHT = 800;
const GRID_TOP_PX = 50;
const GRID_BOTTOM_PX = 80;


const updateChart = () => {
  if (!myChart) return;

  const currentDept = selectedDepartment.value;
  const range = departmentRanges[currentDept];

  let startValue = 0;
  let endValue = totalEmployees - 1;

  if (currentDept !== '全部') {
    startValue = range.startIndex;
    endValue = range.endIndex;
  }

  const option = {
    // Tooltip: 鼠标悬浮提示
    tooltip: {
      position: 'top',
      formatter: function (params) {
        const workingHours = params.value[2]; // 工作时长 (数值)
        const day = xAxisData[params.value[0]]; // 日期
        const employeeId = yAxisData[params.value[1]]; // 员工 ID

        // 查找部门信息
        const department = employeeDeptNameMap.get(employeeId) || '未知';

        // 查找详细考勤信息 (checkin, checkout)
        const detailKey = `${employeeId}_${day}`;
        const detail = attendanceDetailMap.get(detailKey);

        let checkinTime = 'N/A';
        let checkoutTime = 'N/A';
        let formattedHours = 'N/A';

        if (detail && detail.checkin) {
          checkinTime = detail.checkin;
          checkoutTime = detail.checkout || 'N/A';
          formattedHours = `${workingHours.toFixed(2)} 小时`;
        } else if (workingHours === 0) {
          formattedHours = '缺勤/未打卡 (0.00 小时)';
        }

        // 返回包含五行信息的 HTML 字符串, 移除了 **
        return `
            <div style="font-weight: bold; margin-bottom: 5px; color: #333;">考勤详情</div>
            员工 ID: ${employeeId}<br/>
            所在部门: ${department}<br/>
            From (上班): ${checkinTime}<br/>
            To (下班): ${checkoutTime}<br/>
            总工作时间: <span style="font-weight: bold; color: ${workingHours > 8 ? 'red' : '#5AD8AA'};">${formattedHours}</span>
        `;
      }
    },

    // DataZoom 配置 (保持不变)
    dataZoom: [
      {
        type: 'slider', // X 轴保留底部滚动条
        xAxisIndex: 0,
        bottom: '0%',
        height: 20,
        start: 0,
        end: 100,
        show: true
      },
      {
        type: 'inside', // Y 轴使用区域缩放 (鼠标滚轮/拖拽)
        yAxisIndex: 0,
        startValue: startValue,
        endValue: endValue,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: true
      }
    ],

    // Grid 配置 (保持不变)
    grid: {
      left: '2%',
      right: '10%',
      bottom: GRID_BOTTOM_PX,
      top: GRID_TOP_PX,
      containLabel: true,
    },

    // Y轴配置 (保持不变)
    yAxis: [
      {
        type: 'category',
        data: yAxisData,
        position: 'right',
        axisLabel: {
          show: true,
          fontSize: 8,
          interval: 'auto',
          formatter: function (value) { return `${value}`; },
          inside: false,
          margin: 5
        },
        axisTick: { show: false },
        axisLine: { show: false },
        splitLine: { show: false },
        splitArea: { show: true },
      }
    ],

    // X轴配置 (保持不变)
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

    // VisualMap (保持不变)
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
        yAxisIndex: 0,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 0.1
        },
        markPoint: { symbol: 'none', data: [] },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#2c3e50', type: 'solid', width: 2 },
          label: { show: false },
          data: deptMarkLines
        },
      }
    ]
  };

  myChart.setOption(option, { replaceMerge: ['dataZoom', 'grid', 'yAxis', 'tooltip'] });
};


const renderChart = () => {
  if (!chartRef.value) return;

  if (myChart) {
    myChart.dispose();
  }
  myChart = echarts.init(chartRef.value);

  updateChart();
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

/* 筛选控制区域居中显示 */
.filter-controls {
  text-align: center;
  margin-bottom: 20px;
  padding-left: 0;
}
.filter-controls label, .filter-controls select {
  font-size: 14px;
  margin-right: 15px;
}

.heatmap-wrapper {
  position: relative;
  width: 100%;
  min-width: 800px;
}

.heatmap-chart {
  width: 100%;
  min-width: 800px;
}
h2 {
  text-align: center;
  margin-bottom: 15px;
}
</style>