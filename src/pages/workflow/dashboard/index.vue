<template>
  <div class="workflow-dashboard">
    <!-- 顶部卡片统计 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="(item, index) in statCards" :key="index">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon" :style="{ backgroundColor: item.color }">
              <el-icon>
                <component :is="item.icon"></component>
              </el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-title">{{ item.title }}</div>
              <div class="stat-value">{{ item.value }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>最近7天流程活动</span>
            </div>
          </template>
          <div ref="activityChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>流程状态分布</span>
            </div>
          </template>
          <div ref="statusChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 待办任务和我的任务 -->
    <el-row :gutter="20" class="task-row">
      <el-col :span="12">
        <el-card shadow="hover" class="task-card">
          <template #header>
            <div class="card-header">
              <span>我的待办任务</span>
              <el-button type="primary" link @click="navigateTo('/workflow/todo')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="todoTasks" border style="width: 100%">
            <el-table-column prop="taskName" label="任务名称" />
            <el-table-column prop="processName" label="流程名称" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="primary" link @click="handleTask(scope.row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="task-card">
          <template #header>
            <div class="card-header">
              <span>最近处理的任务</span>
              <el-button type="primary" link @click="navigateTo('/workflow/history')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="historyTasks" border style="width: 100%">
            <el-table-column prop="taskName" label="任务名称" />
            <el-table-column prop="processName" label="流程名称" />
            <el-table-column prop="endTime" label="处理时间" width="180" />
            <el-table-column prop="result" label="处理结果" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.result ? 'success' : 'danger'">
                  {{ scope.row.result ? '同意' : '拒绝' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务处理对话框 (简化版) -->
    <el-dialog
      title="处理任务"
      v-model="taskDialog.visible"
      width="600px"
    >
      <el-form :model="taskForm" label-width="100px" :rules="taskFormRules" ref="taskFormRef">
        <el-form-item label="任务名称">
          <el-input v-model="currentTask.taskName" disabled />
        </el-form-item>
        <el-form-item label="流程名称">
          <el-input v-model="currentTask.processName" disabled />
        </el-form-item>
        <el-form-item label="处理结果" prop="approveResult">
          <el-radio-group v-model="taskForm.approveResult">
            <el-radio :label="true">同意</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理意见" prop="comment">
          <el-input 
            v-model="taskForm.comment" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入处理意见" 
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="taskDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="completeTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import http from '@/utils/http';
import { 
  Histogram, 
  Connection, 
  Timer, 
  UserFilled 
} from '@element-plus/icons-vue';

const router = useRouter();

// 统计数据
const dashboardData = reactive({
  activeProcesses: 0,
  completedProcesses: 0,
  todoTasks: 0,
  avgCompletionTime: 0
});

// 任务列表
const todoTasks = ref([]);
const historyTasks = ref([]);

// 图表引用
const activityChart = ref(null);
const statusChart = ref(null);

// 任务处理相关
const currentTask = ref({});
const taskDialog = reactive({
  visible: false,
});
const taskForm = reactive({
  taskId: '',
  approveResult: true,
  comment: '',
});
const taskFormRules = {
  approveResult: [{ required: true, message: '请选择处理结果', trigger: 'change' }],
  comment: [{ required: true, message: '请输入处理意见', trigger: 'blur' }]
};
const taskFormRef = ref();

// 统计卡片配置
const statCards = computed(() => [
  {
    title: '活跃流程',
    value: dashboardData.activeProcesses,
    icon: 'Connection',
    color: '#409EFF'
  },
  {
    title: '已完成流程',
    value: dashboardData.completedProcesses,
    icon: 'Histogram',
    color: '#67C23A'
  },
  {
    title: '待办任务',
    value: dashboardData.todoTasks,
    icon: 'Timer',
    color: '#E6A23C'
  },
  {
    title: '平均完成时间',
    value: `${dashboardData.avgCompletionTime}小时`,
    icon: 'UserFilled',
    color: '#F56C6C'
  }
]);

onMounted(async () => {
  await loadDashboardData();
  await loadTodoTasks();
  await loadHistoryTasks();
});

// 加载仪表板数据
const loadDashboardData = async () => {
  try {
    const [err, res] = await http.get('/workflow/statistics/dashboard');
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    Object.assign(dashboardData, res.data.overview);
    
    initActivityChart(res.data.activityTrend);
    initStatusChart(res.data.statusDistribution);
  } catch (error) {
    console.error(error);
    ElMessage.error('加载仪表板数据失败');
  }
};

// 加载待办任务
const loadTodoTasks = async () => {
  try {
    const [err, res] = await http.get('/workflow/instance/todo', {
      pageNum: 1,
      pageSize: 5
    });
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    todoTasks.value = res.data.records;
  } catch (error) {
    console.error(error);
    ElMessage.error('加载待办任务失败');
  }
};

// 加载历史任务
const loadHistoryTasks = async () => {
  try {
    const [err, res] = await http.get('/workflow/instance/history-tasks', {
      pageNum: 1,
      pageSize: 5
    });
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    historyTasks.value = res.data.records;
  } catch (error) {
    console.error(error);
    ElMessage.error('加载历史任务失败');
  }
};

// 导航到指定路由
const navigateTo = (path) => {
  router.push(path);
};

// 处理任务
const handleTask = (task) => {
  currentTask.value = task;
  taskForm.taskId = task.taskId;
  taskForm.approveResult = true;
  taskForm.comment = '';
  taskDialog.visible = true;
};

// 完成任务
const completeTask = async () => {
  try {
    await taskFormRef.value.validate();
    
    const params = {
      taskId: taskForm.taskId,
      variables: {
        approved: taskForm.approveResult
      },
      comment: taskForm.comment
    };
    
    const [err] = await http.post('/workflow/instance/completeUserTask', params);
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    ElMessage.success('任务处理成功');
    taskDialog.visible = false;
    await loadTodoTasks();
    await loadDashboardData();
  } catch (error) {
    console.error(error);
    ElMessage.error('任务处理失败');
  }
};

// 初始化活动趋势图表
const initActivityChart = (data) => {
  if (!activityChart.value) return;
  
  const chart = echarts.init(activityChart.value);
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['启动流程', '完成流程', '创建任务']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
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
        name: '启动流程',
        type: 'bar',
        stack: 'total',
        data: data?.startedProcesses || []
      },
      {
        name: '完成流程',
        type: 'bar',
        stack: 'total',
        data: data?.completedProcesses || []
      },
      {
        name: '创建任务',
        type: 'bar',
        stack: 'total',
        data: data?.createdTasks || []
      }
    ]
  };
  
  chart.setOption(option);
};

// 初始化状态分布图表
const initStatusChart = (data) => {
  if (!statusChart.value) return;
  
  const chart = echarts.init(statusChart.value);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: ['运行中', '已挂起', '已完成', '已取消']
    },
    series: [
      {
        name: '流程状态',
        type: 'pie',
        radius: ['50%', '70%'],
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
        data: [
          { value: data?.running || 0, name: '运行中', itemStyle: { color: '#409EFF' } },
          { value: data?.suspended || 0, name: '已挂起', itemStyle: { color: '#E6A23C' } },
          { value: data?.completed || 0, name: '已完成', itemStyle: { color: '#67C23A' } },
          { value: data?.canceled || 0, name: '已取消', itemStyle: { color: '#F56C6C' } }
        ]
      }
    ]
  };
  
  chart.setOption(option);
};
</script>

<style scoped>
.workflow-dashboard {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-card-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
  color: white;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 16px;
  color: #606266;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-top: 5px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-container {
  height: 350px;
}

.task-row {
  margin-bottom: 20px;
}

.task-card {
  height: 350px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 