<template>
  <div class="chart-wrapper">
    <div ref="trafficChartDom" class="traffic-chart"></div>
    <div v-if="loading" class="chart-message">正在加载流量数据...</div>
    <div v-else-if="!hasData" class="chart-message">
      该员工（{{ employeeProfile.ip_address }}）在
      <span v-if="selectedDate">{{ selectedDate }}</span>
      <span v-else>记录期内</span>
      无网络流量记录。
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick, computed } from 'vue';
import * as echarts from 'echarts';
import { getEmployeeTrafficData } from '@/utils/trafficDataProcessor.js';

const props = defineProps({
  employeeProfile: {
    type: Object,
    required: true
  },
  selectedDate: {
    type: String, // YYYY-MM-DD
    default: null
  }
});

const trafficChartDom = ref(null);
let myChart = null;
const chartData = ref(null);
const loading = ref(false);

// 检查是否有任何非零数据
const hasData = computed(() => {
  if (!chartData.value || chartData.value.timestamps.length === 0) return false;
  const allData = [...chartData.value.upstreamData, ...chartData.value.downstreamData];
  // 只要有一个数据点不是 null 且不为 0，就认为有数据
  return allData.some(v => v !== null && v !== 0);
});

const loadDataAndRender = () => {
  loading.value = true;

  // ⭐️ 关键：将 selectedDate 正确传递给数据处理器
  const data = getEmployeeTrafficData(props.employeeProfile.ip_address, props.selectedDate);
  chartData.value = data;

  nextTick(() => {
    renderChart(data);
    loading.value = false;
  });
};

const getOption = (data) => {
  if (!data || data.timestamps.length === 0) return {};

  const maxAbsValue = Math.max(
      ...data.upstreamData.filter(v => v !== null),
      ...data.downstreamData.filter(v => v !== null).map(v => Math.abs(v))
  );
  const yMax = (maxAbsValue || 0) * 1.1;

  let xAxisData = data.timestamps;

  let titleText = props.selectedDate
      ? `${props.selectedDate} 上下行流量 (Upstream and Downstream Traffic)`
      : `整月上下行流量 (Upstream and Downstream Traffic)`;

  // 动态计算 X 轴间隔
  const dataLength = data.timestamps.length;
  let interval = 0;
  if (props.selectedDate) {
    // 单日视图 (24点), 每 4 小时显示一次
    interval = 3;
  } else if (dataLength > 0) {
    // 整月视图，动态计算间隔
    interval = Math.floor(dataLength / 15);
    if (interval < 1) interval = 0;
  }

  return {
    title: {
      text: titleText,
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        let timeLabel = params[0].name;

        let tooltip = `时间: ${timeLabel}<br/>`;
        params.forEach(item => {
          if (item.value === null || item.value === 0) return;

          const value = Math.abs(item.value);
          const formattedValue = value.toLocaleString();
          const direction = item.seriesName === '上行' ? '⬆️' : '⬇️';
          tooltip += `<span style="color:${item.color}">${direction} ${item.seriesName}流量: ${formattedValue}</span><br/>`;
        });
        return tooltip;
      }
    },
    legend: {
      data: ['上行', '下行'],
      top: 40
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData, // 使用已格式化的时间轴
      axisLabel: {
        rotate: props.selectedDate ? 0 : 45,
        interval: interval // 动态间隔
      },
      name: props.selectedDate ? '时刻 (HH:mm)' : '时间 (小时)'
    },
    yAxis: {
      type: 'value',
      name: '流量值 (Byte)',
      min: -yMax,
      max: yMax,
      axisLabel: {
        formatter: function (value) {
          return Math.abs(value).toLocaleString();
        }
      }
    },
    series: [
      {
        name: '上行',
        type: 'bar',
        stack: 'traffic',
        data: data.upstreamData,
        itemStyle: {
          color: '#FF9933'
        }
      },
      {
        name: '下行',
        type: 'bar',
        stack: 'traffic',
        data: data.downstreamData,
        itemStyle: {
          color: '#4B8BBE'
        }
      }
    ]
  };
};


const renderChart = (data) => {
  if (myChart) {
    myChart.dispose();
  }
  if (!data || data.timestamps.length === 0) {
    myChart = null;
    return;
  }

  myChart = echarts.init(trafficChartDom.value);
  const option = getOption(data);
  myChart.setOption(option, true);
};

const handleResize = () => {
  if (myChart) {
    myChart.resize();
  }
};

onMounted(() => {
  loadDataAndRender();
  window.addEventListener('resize', handleResize);
});

// ⭐️ 关键：监听员工 IP 或日期变化，重新加载数据
watch(() => [props.employeeProfile.ip_address, props.selectedDate], () => {
  loadDataAndRender();
}, { deep: true });

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (myChart) {
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
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  position: relative;
  min-height: 400px;
}
.traffic-chart {
  height: 450px;
  width: 100%;
}
.chart-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  color: #888;
}
</style>