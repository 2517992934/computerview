<template>
  <div class="chart-container">
    <h2>{{ departmentNames[department] }} 员工上下班时间分布</h2>
    <div ref="chartRef" class="bar-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { processBarChartData } from '@/utils/attendanceProcessor..js';

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

const renderChart = (dept) => {
  if (!chartRef.value) return;

  const { checkin, checkout, xLabels } = processBarChartData(dept);

  if (myChart) {
    myChart.dispose();
  }
  myChart = echarts.init(chartRef.value);

  const option = {
    title: {
      text: '频率分布',
      left: '2%',
      top: '2%',
      textStyle: {
        fontSize: 12
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        let tooltip = `${params[0].name}<br/>`;
        params.forEach(item => {
          tooltip += `${item.marker} ${item.seriesName}: **${item.value} 次**<br/>`;
        });
        return tooltip;
      },
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['上班 (Check-in) 频率', '下班 (Check-out) 频率'],
      bottom: '5%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      name: '时间 (15分钟/刻度)',
      axisLabel: {
        // 仅显示每小时的标签 (00:00, 01:00, ...)
        interval: 3,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '频率 (打卡次数)'
    },
    series: [
      {
        name: '上班 (Check-in) 频率',
        type: 'bar',
        data: checkin,
        barMaxWidth: '80%',
        itemStyle: {
          color: '#5AD8A6'
        }
      },
      {
        name: '下班 (Check-out) 频率',
        type: 'bar',
        data: checkout,
        barMaxWidth: '80%',
        itemStyle: {
          color: '#F7B74E'
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
  renderChart(props.department);
});

watch(() => props.department, (newDept) => {
  renderChart(newDept);
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
  padding-top: 20px;
}
.bar-chart {
  width: 100%;
  height: 500px;
}
h2 {
  text-align: center;
  margin-bottom: 15px;
}
</style>