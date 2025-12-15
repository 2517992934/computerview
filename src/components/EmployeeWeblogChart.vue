<template>
  <div class="chart-wrapper">
    <h4>
      员工 {{ employeeProfile.employee_id }}
      {{ selectedDate ? selectedDate.substring(5) : '11月' }} 网站访问次数 Top 10
    </h4>
    <div class="weblog-table-container">
      <table class="weblog-table">
        <thead>
        <tr>
          <th class="table-header">Website</th>
          <th class="table-header count-col">Count</th>
        </tr>
        </thead>

        <tbody>
        <tr v-if="!weblogData || weblogData.length === 0">
          <td colspan="2" class="no-data">无访问记录</td>
        </tr>
        <tr v-for="(item, index) in weblogData" :key="index">
          <td class="website-name">{{ item.host }}</td>
          <td class="website-count count-col">{{ item.count }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  employeeProfile: {
    type: Object,
    default: () => null,
  },
  selectedDate: {
    type: String,
    default: null,
  },
  weblogData: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
/* 保持与 EmployeeProfileView.vue 中现有图表样式一致的最小修改 */
.chart-wrapper {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

h4 {
  margin-top: 0;
  color: #333;
  text-align: center;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.weblog-table-container {
  max-height: 400px; /* 限制高度，使其可滚动 */
  overflow-y: auto;
}

.weblog-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background-color: #f4f4f4;
  color: #555;
  font-weight: bold;
  padding: 12px 8px;
  text-align: left;
  border-bottom: 2px solid #ddd;
  position: sticky; /* 表头固定 */
  top: 0;
  z-index: 10;
}

.count-col {
  width: 80px;
  text-align: center;
}

.weblog-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.weblog-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
  color: #2c3e50;
}

.website-name {
  word-break: break-all;
}

.website-count {
  font-weight: bold;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>