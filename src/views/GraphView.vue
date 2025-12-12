// src/views/GraphView.vue

<template>
  <div class="graph-view">
    <h1>探索部门内部组织结构：节点连接图</h1>

    <div class="tabs">
      <button
          v-for="dept in departments"
          :key="dept.key"
          :class="{ active: currentDepartment === dept.key }"
          @click="selectDepartment(dept.key)"
      >
        {{ dept.name }}
      </button>
    </div>

    <hr>

    <DepartmentGraph :department="currentDepartment" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DepartmentGraph from '@/components/DepartmentGraph.vue';

// 组织结构图模块的私有状态
const currentDepartment = ref('Finance');
const departments = [
  { key: 'Finance', name: '财务部' },
  { key: 'HR', name: '人力资源部' },
  { key: 'R&D',name:'研发部' }
];

const selectDepartment = (deptKey) => {
  currentDepartment.value = deptKey;
};
</script>

<style scoped>
/* 视图内部的样式，避免影响全局 */
.graph-view {
  text-align: center;
  padding-top: 20px;
}
h1 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 24px;
}
.tabs {
  margin-bottom: 20px;
}
.tabs button {
  padding: 10px 20px;
  margin: 0 5px;
  border: 1px solid #ccc;
  background: #f9f9f9;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}
.tabs button.active {
  background: #42b983;
  color: white;
  border-color: #42b983;
  font-weight: bold;
}
hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 20px 0;
}
</style>