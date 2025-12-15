<template>
  <div class="chart-wrapper">
    <h4>
      该员工 {{ employeeProfile.employee_id }}
      <span :style="{ color: loginErrorData.length > 0 ? '#dc3545' : '#28a745' }">
        {{ loginErrorData.length > 0 ? '存在越权操作' : '无越权操作' }}
      </span>
    </h4>
    <div class="login-table-container">
      <table class="login-table">
        <thead>
        <tr>
          <th class="table-header">Protocol</th>
          <th class="table-header">DIP</th>
          <th class="table-header count-col">DPORT</th>
          <th class="table-header">SIP</th>
          <th class="table-header count-col">SPORT</th>
          <th class="table-header">State</th>
          <th class="table-header time-col">Time</th>
          <th class="table-header count-col">User</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="!loginErrorData || loginErrorData.length === 0">
          <td colspan="8" class="no-data">无越权操作记录</td>
        </tr>
        <tr v-for="(item, index) in loginErrorData" :key="index">
          <td class="log-data">{{ item.proto }}</td>
          <td class="log-data">{{ item.dip }}</td>
          <td class="log-data count-col">{{ item.dport }}</td>
          <td class="log-data">{{ item.sip }}</td>
          <td class="log-data count-col">{{ item.sport }}</td>
          <td class="log-data state-error">{{ item.state }}</td>
          <td class="log-data time-col">{{ item.time }}</td>
          <td class="log-data count-col">{{ item.user }}</td>
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
    default: () => ({ employee_id: 'N/A' }),
  },
  loginErrorData: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
/* 保持与 EmployeeProfileView.vue 科技蓝样式一致 */
.chart-wrapper {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1); /* 科技蓝阴影 */
  margin-top: 0;
}

h4 {
  margin-top: 0;
  color: #333;
  text-align: center;
  border-bottom: 2px solid #007bff; /* 科技蓝强调 */
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.login-table-container {
  max-height: 400px; /* 限制高度，使其可滚动 */
  overflow-y: auto;
}

.login-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table-header {
  background-color: #e6f7ff; /* 浅科技蓝 */
  color: #007bff;
  font-weight: bold;
  padding: 10px 8px;
  text-align: left;
  border-bottom: 2px solid #ddd;
  position: sticky;
  top: 0;
  z-index: 10;
}

.count-col {
  text-align: center;
  width: 8%;
}

.time-col {
  width: 180px;
}

.login-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.login-table td {
  padding: 8px 8px;
  border-bottom: 1px solid #eee;
  color: #2c3e50;
}

.log-data {
  word-break: break-all;
}

.state-error {
  font-weight: bold;
  color: #dc3545; /* 醒目的红色表示错误 */
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>