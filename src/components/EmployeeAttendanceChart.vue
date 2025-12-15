<template>
  <div class="chart-wrapper">
    <h4>员工 {{ chartData.profile.employee_id }} 11月考勤情况</h4>
    <div ref="chartDom" class="attendance-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick, defineEmits } from 'vue';
import * as echarts from 'echarts';

// 定义自定义事件
const emit = defineEmits(['dateSelected']);

const props = defineProps({
  chartData: {
    type: Object,
    default: () => null
  }
});


const chartDom = ref(null);
let myChart = null;

// --- 辅助函数 (保持不变) ---
function formatSecondsToTime(value) {
  if (value === null || isNaN(value)) return '';
  const totalSeconds = Math.round(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function tooltipFormatter(params, dailyData) {
  const durationItem = params.find(p => p.seriesName === '工作时长');
  if (!durationItem) return;

  const day = durationItem.name;
  const originalItem = dailyData.find(d => d.name === day);

  if (!originalItem || originalItem.tooltipData.isAbsent) {
    return `日期: ${day}<br/><strong>无有效打卡记录/旷工</strong>`;
  }

  const checkinTime = originalItem.tooltipData.checkinFullTime.replace(/ /g, ', ');
  const checkoutTime = originalItem.tooltipData.checkoutFullTime.replace(/ /g, ', ');

  const checkinDisplay = checkinTime.substring(0, checkinTime.length - 3);
  const checkoutDisplay = checkoutTime.substring(0, checkoutTime.length - 3);

  return `
        上班时间: ${checkinDisplay}<br/>
        下班时间: ${checkoutDisplay}
    `;
}

// --- 核心点击处理函数 (接受 Click Layer) ---
const handleChartClick = (params) => {
  // 调试日志
  console.log("ECharts Click Event Fired. Raw Params:", params);

  // 1. 检查点击的是否是柱形图的某个系列
  if (params.componentType !== 'series' || params.seriesType !== 'bar') {
    // 备用：检查是否通过 X 轴类别命中
    if (params.name) {
      const fullDate = params.name;
      emit('dateSelected', fullDate);
      console.log("Attendance date selected via X-axis category (FALLBACK SUCCESS):", fullDate);
      return;
    }
    console.log("Click ignored: Not on a bar series and no category name found.");
    return;
  }

  // ⭐️ 核心修正：允许点击 Click Layer, 签到基线, 或 工作时长
  const validSeriesNames = ['Click Layer', '工作时长', '签到基线'];
  if (!validSeriesNames.includes(params.seriesName)) {
    console.log("Click ignored: Series name not in valid list.", params.seriesName);
    return;
  }

  // 2. 检查数据点是否存在
  if (!params.data || !params.data.name) {
    console.log("Click ignored: Data point name is missing.");
    return;
  }

  // 3. 触发事件
  const fullDate = params.data.name;
  emit('dateSelected', fullDate);
  console.log(`Attendance date selected via ${params.seriesName} (SUCCESS):`, fullDate);
};


/**
 * 获取 ECharts 配置项
 */
const getOption = (data) => {
  if (!data || !data.dailyData || data.dailyData.length === 0) return {};

  const days = data.dailyData.map(item => item.name);
  const maxSeconds = 24 * 3600; // 一天的最大秒数

  const dailyBarData = data.dailyData;

  // 签到基线系列数据
  const checkinBaseData = dailyBarData.map(item => ({
    name: item.name,
    value: item.value[1], // 签到秒数
  }));

  // 工作时长系列数据
  const durationData = dailyBarData.map(item => ({
    name: item.name,
    value: item.value[2], // 工作时长（秒数）
    itemStyle: {
      opacity: item.value[2] > 0 ? 1 : 0
    }
  }));

  // ⭐️ 新增：透明点击层数据
  const clickData = days.map(day => ({
    name: day,
    value: maxSeconds // 24小时的秒数，用于覆盖整个Y轴高度
  }));


  return {
    title: {
      text: '考勤情况',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', link: false },
      formatter: (params) => tooltipFormatter(params, data.dailyData),
      backgroundColor: 'rgba(50,50,50,0.8)',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '8%',
      right: '8%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: days,
      name: '日期',
      nameLocation: 'middle',
      nameTextStyle: {
        padding: [10, 0, 0, 0],
        fontWeight: 'bold'
      },
      axisLabel: {
        rotate: 45,
        formatter: function(value) {
          return value.substring(8);
        },
        interval: 0,
        fontWeight: 'normal'
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: maxSeconds,
      interval: 3600,
      name: '时刻 (HH:mm)',
      nameTextStyle: {
        padding: [0, 0, 0, 50],
        fontWeight: 'bold'
      },
      axisLabel: {
        formatter: formatSecondsToTime
      }
    },
    series: [
      // 0. ⭐️ 核心修正：透明点击层 (Click Layer)
      {
        name: 'Click Layer',
        type: 'bar',
        data: clickData,
        itemStyle: {
          // 确保完全不可见
          color: 'transparent',
          opacity: 0
        },
        tooltip: {
          show: false
        },
        // 强制设置鼠标为手形并允许触发事件
        cursor: 'pointer',
        triggerEvent: true,
        z: 0, // 放在最底层
        barCategoryGap: '20%'
      },
      // 1. 隐藏的基线柱形 (Series 0) - z: 1
      {
        name: '签到基线',
        type: 'bar',
        stack: 'attendance',
        data: checkinBaseData,
        itemStyle: {
          color: 'transparent' // 透明
        },
        tooltip: {
          show: false // 不显示 Tooltip
        },
        z: 1, // 在 Click Layer 上方
        barCategoryGap: '20%'
      },
      // 2. 可见的工作时长柱形 (Series 1) - z: 2
      {
        name: '工作时长',
        type: 'bar',
        stack: 'attendance',
        data: durationData,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#6DABFF'
        },
        // 确保有数据的柱形也能触发事件，并显示指针
        cursor: 'pointer',
        triggerEvent: true,
        z: 2, // 在最上方
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: {
            type: 'solid',
            width: 2,
            opacity: 0.8
          },
          data: [
            {
              yAxis: data.avgCheckinSeconds,
              name: '平均签到',
              label: {
                formatter: `平均签到: ${data.avgCheckinTimeStr}`,
                position: 'insideStartBottom',
                distance: 8,
                color: '#dc3545',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: [3, 5],
                borderWidth: 1,
                borderColor: '#dc3545',
                opacity: 1,
                fontWeight: 'bold'
              },
              lineStyle: { color: '#dc3545' }
            },
            {
              yAxis: data.avgCheckoutSeconds,
              name: '平均签退',
              label: {
                formatter: `平均签退: ${data.avgCheckoutTimeStr}`,
                position: 'insideEndTop',
                distance: 8,
                color: '#28a745',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: [3, 5],
                borderWidth: 1,
                borderColor: '#28a745',
                opacity: 1,
                fontWeight: 'bold'
              },
              lineStyle: { color: '#28a745' }
            }
          ]
        }
      }
    ]
  };
};

// --- ECharts 渲染和生命周期 (保持稳定) ---
const renderChart = () => {
  if (!props.chartData || !props.chartData.dailyData || props.chartData.dailyData.length === 0) {
    if (myChart) myChart.clear();
    return;
  }

  // 确保 myChart 只在 chartDom 存在时初始化
  if (chartDom.value && !myChart) {
    myChart = echarts.init(chartDom.value);
    // 绑定事件确保只执行一次
    myChart.on('click', handleChartClick);
  }

  if (myChart) {
    const option = getOption(props.chartData);
    myChart.setOption(option, true);
  }
};

const handleResize = () => {
  if (myChart) {
    myChart.resize();
  }
};

onMounted(() => {
  nextTick(() => {
    if (chartDom.value && !myChart) {
      myChart = echarts.init(chartDom.value);
      myChart.on('click', handleChartClick);
    }

    if (props.chartData) {
      renderChart();
    }
  });
  window.addEventListener('resize', handleResize);
});

watch(() => props.chartData, () => {
  nextTick(() => {
    renderChart();
  });
}, { deep: true });

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (myChart) {
    myChart.off('click', handleChartClick);
    myChart.dispose();
  }
});
</script>

<style scoped>
.chart-wrapper {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
h4 {
  text-align: center;
  color: #007bff;
  margin-bottom: 20px;
}
.attendance-chart {
  height: 450px;
  width: 100%;
}
</style>