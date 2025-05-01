<template>
  <div class="workflow-analytics">
    <gl-base-header>
      <div class="search-item">
        <label>时间范围：</label>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </div>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </gl-base-header>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>活跃流程实例</span>
              </div>
            </template>
            <div class="card-value">{{ statistics.activeInstances }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>完成流程实例</span>
              </div>
            </template>
            <div class="card-value">{{ statistics.completedInstances }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>待办任务</span>
              </div>
            </template>
            <div class="card-value">{{ statistics.activeTasks }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>平均完成时间</span>
              </div>
            </template>
            <div class="card-value">{{ statistics.avgDuration }}小时</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 统计图表 -->
    <div class="chart-container">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>流程启动趋势</span>
              </div>
            </template>
            <div ref="startTrendChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>流程完成趋势</span>
              </div>
            </template>
            <div ref="completeTrendChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" class="mt-20">
        <el-col :span="12">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>流程类型分布</span>
              </div>
            </template>
            <div ref="processTypeChart" class="chart"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>任务处理人排行</span>
              </div>
            </template>
            <div ref="userTaskChart" class="chart"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 流程性能列表 -->
    <el-card shadow="hover" class="mt-20">
      <template #header>
        <div class="card-header">
          <span>流程性能分析</span>
        </div>
      </template>
      <el-table :data="performanceData" border style="width: 100%">
        <el-table-column prop="processName" label="流程名称" />
        <el-table-column prop="processKey" label="流程标识" />
        <el-table-column prop="instanceCount" label="实例数量" />
        <el-table-column prop="avgDuration" label="平均耗时(小时)" />
        <el-table-column prop="maxDuration" label="最长耗时(小时)" />
        <el-table-column prop="minDuration" label="最短耗时(小时)" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import http from '@/utils/http';
import * as echarts from 'echarts';

// 日期范围
const dateRange = ref([]);

// 统计数据
const statistics = reactive({
  activeInstances: 0,
  completedInstances: 0,
  activeTasks: 0,
  avgDuration: 0
});

// 性能数据
const performanceData = ref([]);

// 图表引用
const startTrendChart = ref(null);
const completeTrendChart = ref(null);
const processTypeChart = ref(null);
const userTaskChart = ref(null);

// 图表实例
let startChart = null;
let completeChart = null;
let processChart = null;
let userChart = null;

onMounted(() => {
  handleQuery();
  
  // 窗口大小变化时重新适应图表大小
  window.addEventListener('resize', handleResize);
});

// 处理窗口大小变化
const handleResize = () => {
  startChart?.resize();
  completeChart?.resize();
  processChart?.resize();
  userChart?.resize();
};

// 查询统计数据
const handleQuery = async () => {
  try {
    const params = {};
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0];
      params.endTime = dateRange.value[1];
    }
    
    const [err, res] = await http.get('/workflow/statistics/overview', params);
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    // 更新统计数据
    Object.assign(statistics, res.data.overview);
    
    // 更新性能数据
    performanceData.value = res.data.performance || [];
    
    // 在DOM更新后初始化图表
    nextTick(() => {
      initStartTrendChart(res.data.startTrend);
      initCompleteTrendChart(res.data.completeTrend);
      initProcessTypeChart(res.data.processTypes);
      initUserTaskChart(res.data.userTasks);
    });
  } catch (error) {
    console.error(error);
    ElMessage.error('获取统计数据失败');
  }
};

// 重置查询
const resetQuery = () => {
  dateRange.value = [];
  handleQuery();
};

// 初始化流程启动趋势图
const initStartTrendChart = (data) => {
  if (!startTrendChart.value) return;
  
  if (!startChart) {
    startChart = echarts.init(startTrendChart.value);
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data?.dates || []
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '流程启动数',
        type: 'line',
        smooth: true,
        data: data?.counts || [],
        itemStyle: {
          color: '#5470c6'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(84, 112, 198, 0.5)' },
            { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
          ])
        }
      }
    ]
  };
  
  startChart.setOption(option);
};

// 初始化流程完成趋势图
const initCompleteTrendChart = (data) => {
  if (!completeTrendChart.value) return;
  
  if (!completeChart) {
    completeChart = echarts.init(completeTrendChart.value);
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data?.dates || []
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '流程完成数',
        type: 'line',
        smooth: true,
        data: data?.counts || [],
        itemStyle: {
          color: '#91cc75'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(145, 204, 117, 0.5)' },
            { offset: 1, color: 'rgba(145, 204, 117, 0.1)' }
          ])
        }
      }
    ]
  };
  
  completeChart.setOption(option);
};

// 初始化流程类型分布图
const initProcessTypeChart = (data) => {
  if (!processTypeChart.value) return;
  
  if (!processChart) {
    processChart = echarts.init(processTypeChart.value);
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: data?.map(item => item.name) || []
    },
    series: [
      {
        name: '流程类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data || []
      }
    ]
  };
  
  processChart.setOption(option);
};

// 初始化任务处理人排行图
const initUserTaskChart = (data) => {
  if (!userTaskChart.value) return;
  
  if (!userChart) {
    userChart = echarts.init(userTaskChart.value);
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data?.map(item => item.name) || []
    },
    series: [
      {
        name: '处理任务数',
        type: 'bar',
        data: data?.map(item => item.value) || [],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        }
      }
    ]
  };
  
  userChart.setOption(option);
};
</script>

<style scoped>
.workflow-analytics {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.search-item label {
  margin-right: 5px;
  white-space: nowrap;
}

.stat-cards {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  text-align: center;
}

.chart-container {
  margin-top: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart {
  height: 300px;
}

.mt-20 {
  margin-top: 20px;
}
</style> 