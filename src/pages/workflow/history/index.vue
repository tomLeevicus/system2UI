<template>
  <div class="history-tasks">
    <gl-base-header>
      <div class="search-item">
        <label>流程名称：</label>
        <el-input v-model="queryParams.processName" placeholder="请输入流程名称" />
      </div>
      <div class="search-item">
        <label>任务名称：</label>
        <el-input v-model="queryParams.taskName" placeholder="请输入任务名称" />
      </div>
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

    <gl-table-jsx
      :tableData="historyList"
      :tableHeader="columns"
      :total="pageTotal"
      :isAutoPagination="false"
      v-model:paginationConfig="paginationConfig"
      @pagination-change="handleQuery"
      @loadTableData="handleQuery"
    />

    <!-- 详情对话框 -->
    <el-dialog
      title="任务详情"
      v-model="detailDialog.visible"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务名称">{{ currentTask.taskName }}</el-descriptions-item>
        <el-descriptions-item label="流程名称">{{ currentTask.processName }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentTask.assignee }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentTask.endTime }}</el-descriptions-item>
        <el-descriptions-item label="结果" :span="2">
          <el-tag :type="currentTask.result ? 'success' : 'danger'">
            {{ currentTask.result ? '同意' : '拒绝' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理意见" :span="2">
          {{ currentTask.comment }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="process-diagram" v-if="currentTask.processInstanceId">
        <el-divider content-position="left">流程图</el-divider>
        <img :src="`/api/workflow/process/image/${currentTask.processInstanceId}`" alt="流程图" />
      </div>

      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import useTable from '@/components/global/gl-table-jsx/useTable';
import http from '@/utils/http';

const { paginationConfig } = useTable();

// 查询参数
const queryParams = reactive({
  processName: '',
  taskName: '',
  startTime: '',
  endTime: '',
});

const dateRange = ref([]);

// 监听日期范围变化
const updateDateRange = computed(() => {
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startTime = dateRange.value[0];
    queryParams.endTime = dateRange.value[1];
  } else {
    queryParams.startTime = '';
    queryParams.endTime = '';
  }
  return dateRange.value;
});

const historyList = ref([]);
const pageTotal = ref(0);

// 当前任务信息
const currentTask = ref({
  taskId: '',
  taskName: '',
  processName: '',
  processInstanceId: '',
  assignee: '',
  startTime: '',
  endTime: '',
  result: true,
  comment: '',
});

// 详情对话框
const detailDialog = reactive({
  visible: false,
});

onMounted(() => {
  handleQuery();
});

// 获取历史任务列表
const handleQuery = async () => {
  const { current, size } = paginationConfig.value;
  updateDateRange.value; // 触发计算属性更新日期
  
  try {
    const [err, res] = await http.get('/workflow/instance/history-tasks', {
      pageNum: current,
      pageSize: size,
      processName: queryParams.processName,
      taskName: queryParams.taskName,
      startTime: queryParams.startTime,
      endTime: queryParams.endTime,
    });
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    const { data } = res;
    historyList.value = data.records;
    pageTotal.value = data.total;
  } catch (error) {
    console.error(error);
    ElMessage.error('获取历史任务失败');
  }
};

// 重置查询表单
const resetQuery = () => {
  queryParams.processName = '';
  queryParams.taskName = '';
  dateRange.value = [];
  handleQuery();
};

// 查看任务详情
const handleTaskDetail = (row) => {
  currentTask.value = { ...row };
  detailDialog.visible = true;
};

// 表格列配置
const columns = [
  {
    label: '任务ID',
    prop: 'taskId',
    width: 280,
  },
  {
    label: '任务名称',
    prop: 'taskName',
  },
  {
    label: '流程名称',
    prop: 'processName',
  },
  {
    label: '处理人',
    prop: 'assignee',
  },
  {
    label: '开始时间',
    prop: 'startTime',
  },
  {
    label: '完成时间',
    prop: 'endTime',
  },
  {
    label: '处理结果',
    prop: 'result',
    width: 100,
    render: (scope) => (
      <el-tag type={scope.row.result ? 'success' : 'danger'}>
        {scope.row.result ? '同意' : '拒绝'}
      </el-tag>
    ),
  },
  {
    label: '操作',
    width: 120,
    render: (scope) => (
      <el-button type="primary" link onClick={() => handleTaskDetail(scope.row)}>
        详情
      </el-button>
    ),
  },
];
</script>

<style scoped>
.history-tasks {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
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

.process-diagram {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: auto;
  max-height: 400px;
  text-align: center;
}

.process-diagram img {
  max-width: 100%;
}
</style> 