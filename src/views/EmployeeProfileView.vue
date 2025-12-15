<template>
  <div class="employee-profile-container">
    <h2>员工个人考勤信息查询</h2>
    <div class="search-panel">
      <input
          v-model="searchId"
          @keyup.enter="handleSearch"
          placeholder="请输入员工 ID (例如: 1487)"
          type="text"
          class="search-input"
      />
      <button @click="handleSearch" class="search-button">查询</button>
    </div>

    <div v-if="isLoading" class="info-message loading">正在加载数据...</div>
    <div v-else-if="errorMessage" class="info-message error">{{ errorMessage }}</div>
    <div v-else-if="employeeData && employeeData.profile" class="profile-dashboard">

      <div class="profile-info">
        <h3>员工档案</h3>
        <p><strong>ID:</strong> {{ employeeData.profile.employee_id }}</p>
        <p><strong>部门:</strong> {{ employeeData.profile.department }}</p>
        <p><strong>IP 地址:</strong> {{ employeeData.profile.ip_address }}</p>
        <p><strong>平均签到时间:</strong> {{ employeeData.avgCheckinTimeStr }}</p>
        <p><strong>平均签退时间:</strong> {{ employeeData.avgCheckoutTimeStr }}</p>

        <p v-if="selectedDate">
          <strong>当前选中日期:</strong> {{ selectedDate }}
          <button @click="resetDate" class="reset-button">显示整月数据</button>
        </p>
      </div>

      <div class="charts-section">
        <EmployeeAttendanceChart
            :chart-data="employeeData"
            @dateSelected="handleDateSelected"
        />

        <EmployeeTrafficChart
            :employee-profile="employeeData.profile"
            :selected-date="selectedDate"
            class="traffic-chart-area"
        />

        <EmployeeWeblogChart
            :employee-profile="employeeData.profile"
            :selected-date="selectedDate"
            :weblog-data="employeeData.weblogCountData"
            class="weblog-chart-area"
        />
        <EmployeeLoginChart
            :employee-profile="employeeData.profile"
            :login-error-data="loginErrorData"
            class="login-chart-area"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// 导入现有组件
import EmployeeAttendanceChart from '@/components/EmployeeAttendanceChart.vue';
import EmployeeTrafficChart from '@/components/EmployeeTrafficChart.vue';
// 导入新增组件
import EmployeeWeblogChart from '@/components/EmployeeWeblogChart.vue'; // ⭐️ 导入新增组件
// ⭐️ 新增：导入越权操作日志组件
import EmployeeLoginChart from '@/components/EmployeeLoginChart.vue';
// 导入数据处理逻辑
import { getEmployeeAttendanceData } from '@/utils/employeeDataProcessor.js';
import {
  getEmployeeWeblogData,
  getWeblogDataByEmployeeAndDate, // ⭐️ 导入 Weblog 按日处理函数
} from '@/utils/employeeweblogProcessor.js'; // ⭐️ 导入 Weblog 处理器
// ⭐️ 新增：导入越权操作日志数据处理函数
import { getEmployeeLoginErrorData } from '@/utils/employeeLoginProcessor.js';


const route = useRoute();
const router = useRouter();

// 状态
const searchId = ref(route.query.employeeId || '');
const isLoading = ref(false);
const errorMessage = ref('');
// employeeData 现在会包含 profile, dailyData, avgCheckinTimeStr, avgCheckoutTimeStr, 以及 weblogCountData
const employeeData = ref(null);
const selectedDate = ref(null);

// ⭐️ 新增：用于存储越权操作日志数据
const loginErrorData = ref([]);

// 辅助函数
function parseAndFormatData(id) {
  // 1. 获取考勤数据
  const attendanceData = getEmployeeAttendanceData(id);

  if (!attendanceData.profile) {
    employeeData.value = null;
    loginErrorData.value = [];
    errorMessage.value = '未找到该员工信息或该员工无考勤记录。';
    return;
  }

  const profile = attendanceData.profile;

  // 2. 获取 Weblog 访问次数数据
  const weblogData = getEmployeeWeblogData(profile);

  // 3. ⭐️ 新增：加载越权操作日志数据
  const errorLogs = getEmployeeLoginErrorData(profile.ip_address);
  loginErrorData.value = errorLogs;


  // 整合数据
  employeeData.value = {
    ...attendanceData,
    ...weblogData, // ⭐️ 将 weblogCountData 整合进来
  };
  errorMessage.value = ''; // 清除错误信息
}

// 处理函数
async function handleSearch() {
  if (!searchId.value) {
    errorMessage.value = '请输入员工 ID';
    employeeData.value = null;
    loginErrorData.value = [];
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  selectedDate.value = null; // 每次搜索都重置日期

  try {
    // 模拟异步加载
    await new Promise(resolve => setTimeout(resolve, 500));

    parseAndFormatData(searchId.value);

    // 更新 URL
    if (employeeData.value && employeeData.value.profile) {
      router.push({ query: { employeeId: searchId.value } });
    }
  } catch (err) {
    console.error('搜索失败:', err);
    errorMessage.value = '加载数据时发生错误。';
    employeeData.value = null;
    loginErrorData.value = [];
  } finally {
    isLoading.value = false;
  }
}

// 考勤图点击事件：更新选中日期并重新计算数据
function handleDateSelected(day) {
  selectedDate.value = day;

  if (employeeData.value && employeeData.value.profile) {
    // 1. 重新计算 Weblog 访问次数
    const dailyWeblogCountData = getWeblogDataByEmployeeAndDate({
      profile: employeeData.value.profile,
      selectedDate: day,
    });
    // ⭐️ 增量更新 weblogCountData
    employeeData.value.weblogCountData = dailyWeblogCountData;

    // 2. 越权操作日志数据不随日期变化，保持不变
  }
}

// 重置日期：回到月度视图
function resetDate() {
  selectedDate.value = null;

  // 1. 重新计算 Weblog 访问次数 (回到月度统计)
  if (employeeData.value && employeeData.value.profile) {
    const monthlyWeblogCountData = getWeblogDataByEmployeeAndDate({
      profile: employeeData.value.profile,
      selectedDate: null,
    });
    // ⭐️ 增量更新 weblogCountData
    employeeData.value.weblogCountData = monthlyWeblogCountData;
  }
}

// 初始化加载 (保持不变)
onMounted(() => {
  if (searchId.value) {
    handleSearch();
  }
});

// URL 变化监听 (保持不变)
watch(() => route.query.employeeId, (newId) => {
  if (newId && newId !== searchId.value) {
    searchId.value = newId;
    handleSearch();
  }
});

// 样式 (保持上一步的科技蓝和单列布局不变)
</script>
<style scoped>
/* ⭐️ 科技蓝样式优化 (保持不变) */
.employee-profile-container {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f4f7f9; /* 浅灰色背景 */
  min-height: 100vh;
}

h2 {
  text-align: center;
  color: #007bff; /* 科技蓝主色 */
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 2px solid #007bff;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 搜索面板样式 */
.search-panel {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}
.search-input {
  padding: 12px;
  border: 1px solid #cce5ff; /* 浅蓝色边框 */
  border-right: none;
  border-radius: 6px 0 0 6px;
  width: 350px;
  font-size: 16px;
  transition: all 0.3s;
}
.search-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

.search-button {
  padding: 12px 20px;
  background-color: #007bff;
  color: white;
  border: 1px solid #007bff;
  border-left: none;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s, box-shadow 0.3s;
}
.search-button:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

/* 消息提示样式 */
.info-message {
  text-align: center;
  padding: 18px;
  margin-top: 25px;
  border-radius: 6px;
  font-size: 18px;
  font-weight: bold;
}
.info-message.loading {
  background-color: #e6f7ff;
  color: #007bff;
  border: 1px solid #91d5ff;
}
.info-message.error {
  background-color: #fff0f6;
  color: #fa5252;
  border: 1px solid #ffadd2;
}

/* 仪表板布局 */
.profile-dashboard {
  background-color: #ffffff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 123, 255, 0.1);
}

.profile-info {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px dashed #e9ecef;
}

.profile-info h3 {
  color: #333;
  border-left: 5px solid #007bff;
  padding-left: 12px;
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.5rem;
}

.profile-info p {
  margin: 8px 0;
  color: #495057;
  font-size: 1.05rem;
}

.profile-info strong {
  color: #212529;
  min-width: 150px; /* 帮助对齐 */
  display: inline-block;
}

.reset-button {
  margin-left: 20px;
  padding: 6px 12px;
  background-color: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
  transition: background-color 0.3s;
}

.reset-button:hover {
  background-color: #dee2e6;
}

/* ⭐️ 图表区域布局 (保持单列，确保每个图表占满宽度) */
.charts-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px; /* 增加图表之间的间距 */
  margin-top: 30px;
}
</style>