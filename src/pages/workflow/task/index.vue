<template>
  <div class="task-management">
    <gl-base-header>
      <div class="search-item">
        <label>流程名称：</label>
        <el-input v-model="queryParams.processName" placeholder="请输入流程名称"/>
      </div>
      <div class="search-item">
        <label>流程状态：</label>
        <el-select v-model="queryParams.status" placeholder="请选择流程状态" clearable>
          <el-option label="进行中" value="running" />
          <el-option label="已挂起" value="suspended" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </div>
      <div class="search-item">
        <label>发起时间：</label>
        <el-date-picker
          v-model="queryParams.dateRange"
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
        :tableData="processList"
        :tableHeader="columns"
        :total="pageTotal"
        :isAutoPagination="false"
        v-model:paginationConfig="paginationConfig"
        @pagination-change="handleQuery"
        @loadTableData="handleQuery"
    />

    <!-- 流程详情对话框 -->
    <el-dialog
        title="流程详情"
        v-model="detailDialog.visible"
        width="750px"
    >
      <el-skeleton :loading="loadingProcessDetail" animated>
        <template #template>
          <el-skeleton-item variant="text" style="width: 100%;"/>
          <el-skeleton-item variant="text" style="width: 100%; margin-top: 16px;"/>
          <el-skeleton-item variant="text" style="width: 100%; margin-top: 16px;"/>
        </template>
        <template #default>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="流程名称">{{ currentProcess.name }}</el-descriptions-item>
            <el-descriptions-item label="流程状态">
              <el-tag :type="getStatusType(currentProcess.status)">
                {{ getStatusText(currentProcess.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发起人">{{ currentProcess.startUser }}</el-descriptions-item>
            <el-descriptions-item label="发起时间">{{ currentProcess.startTime }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ currentProcess.endTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="当前节点">{{ currentProcess.currentNode || '-' }}</el-descriptions-item>
          </el-descriptions>
          
          <!-- 流程图显示区域 -->
          <div class="process-diagram-container" v-if="processDiagram">
            <h3>流程图</h3>
            <div class="process-diagram">
              <el-image 
                :src="processDiagram" 
                :preview-src-list="[processDiagram]"
                fit="contain"
                :loading="loadingProcessDiagram ? 'loading' : ''"
              />
            </div>
          </div>
        </template>
      </el-skeleton>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import {ref, reactive, onMounted} from 'vue';
import {ElMessage} from 'element-plus';
import useTable from '@/components/global/gl-table-jsx/useTable';
import http from '@/utils/http';
import {useRouter} from 'vue-router';
import {getUserTasks, getTaskDetail} from '@/api/workflow';

const {paginationConfig} = useTable();
const router = useRouter();

// 定义流程信息接口
interface ProcessInfo {
  id: string;
  name: string;
  status: 'running' | 'suspended' | 'completed';
  startUser: string;
  startTime: string;
  endTime: string;
  currentNode: string;
}

// 定义查询参数接口
interface QueryParams {
  processName: string;
  status: string;
  dateRange: string[];
}

const queryParams = reactive<QueryParams>({
  processName: '',
  status: '',
  dateRange: [],
});

const processList = ref<ProcessInfo[]>([]);
const pageTotal = ref(0);

// 当前流程信息
const currentProcess = ref<ProcessInfo>({
  id: '',
  name: '',
  status: 'running',
  startUser: '',
  startTime: '',
  endTime: '',
  currentNode: '',
});

// 流程详情对话框
const detailDialog = reactive({
  visible: false,
});

// 加载状态
const loadingProcessDetail = ref(false);

// 流程图相关
const processDiagram = ref('');
const loadingProcessDiagram = ref(false);

onMounted(() => {
  handleQuery();
});

// 获取流程列表
const handleQuery = async () => {
  const {current, size} = paginationConfig.value;
  try {
    const [err, res] = await getUserTasks({
      pageNum: current,
      pageSize: size,
      processName: queryParams.processName,
      status: queryParams.status,
      startTime: queryParams.dateRange?.[0],
      endTime: queryParams.dateRange?.[1],
    });

    if (err) {
      ElMessage.error(err.message);
      return;
    }

    const {data} = res;
    processList.value = data.records;
    pageTotal.value = data.total;
  } catch (error) {
    console.error(error);
    ElMessage.error('获取任务列表失败');
  }
};

// 重置查询条件
const resetQuery = () => {
  queryParams.processName = '';
  queryParams.status = '';
  queryParams.dateRange = [];
  handleQuery();
};

// 查看流程详情
const viewProcessDetail = async (process: ProcessInfo) => {
  if (!process?.id) {
    ElMessage.error('流程信息不完整');
    return;
  }

  currentProcess.value = {
    id: process.id,
    name: process.name,
    status: process.status,
    startUser: process.startUser,
    startTime: process.startTime,
    endTime: process.endTime,
    currentNode: process.currentNode,
  };

  loadingProcessDetail.value = true;
  processDiagram.value = ''; // 重置流程图

  try {
    // 获取带高亮的流程图
    await getProcessDiagram(process.id);
    
    // 打开详情对话框
    detailDialog.visible = true;
  } catch (error) {
    console.error('获取流程详情异常:', error);
    ElMessage.error('获取流程详情失败');
  } finally {
    loadingProcessDetail.value = false;
  }
};

// 获取流程图
const getProcessDiagram = async (processInstanceId: string) => {
  if (!processInstanceId) return;

  loadingProcessDiagram.value = true;
  processDiagram.value = ''; // Clear previous diagram
  try {
    // Call the endpoint, expecting the standard JSON Result<byte[]> (Base64 encoded)
    const [err, res] = await http.get(`/workflow/process/diagram/${processInstanceId}`);

    if (err) {
      // Handle potential errors returned by the interceptor itself
      const errorMsg = typeof err === 'object' && err !== null && 'message' in err ? (err as Error).message : '获取流程图失败';
      ElMessage.error(errorMsg);
      return;
    }

    // Check the structure of the successful response (res)
    if (res && res.code === 200 && typeof res.data === 'string' && res.data.length > 0) {
        // Construct the data URL for the image using the Base64 string from res.data
        processDiagram.value = `data:image/png;base64,${res.data}`;
    } else {
        // Handle cases where code is not 200 or data is invalid/missing
        const errorMsg = res?.message || '未能获取有效的流程图数据';
        ElMessage.error(errorMsg);
    }

  } catch (error) {
    // Catch any unexpected errors during the request/processing
    console.error('获取流程图异常:', error);
    ElMessage.error('获取流程图时发生意外错误');
  } finally {
    loadingProcessDiagram.value = false;
  }
};

// 获取状态类型
const getStatusType = (status: ProcessInfo['status']) => {
  switch (status) {
    case 'running':
      return 'primary';
    case 'completed':
      return 'success';
    case 'suspended':
      return 'warning';
    default:
      return 'info';
  }
};

// 获取状态文本
const getStatusText = (status: ProcessInfo['status']) => {
  switch (status) {
    case 'running':
      return '进行中';
    case 'completed':
      return '已完成';
    case 'suspended':
      return '已挂起';
    default:
      return '未知';
  }
};

// 表格列配置
const columns = [
  {
    label: '流程ID',
    prop: 'id',
    width: 180,
  },
  {
    label: '流程名称',
    prop: 'name',
  },
  {
    label: '状态',
    prop: 'status',
    width: 100,
    render: ({ row }: { row: ProcessInfo }) => {
      return (
        <el-tag type={getStatusType(row.status)}>
          {getStatusText(row.status)}
        </el-tag>
      );
    },
  },
  {
    label: '发起人',
    prop: 'startUser',
    width: 120,
  },
  {
    label: '发起时间',
    prop: 'startTime',
    width: 180,
  },
  {
    label: '当前节点',
    prop: 'currentNode',
    width: 150,
  },
  {
    label: '操作',
    width: 120,
    fixed: 'right',
    render: ({ row }: { row: ProcessInfo }) => {
      return (
        <el-button type="primary" link onClick={() => viewProcessDetail(row)}>
          查看详情
        </el-button>
      );
    },
  },
];
</script>

<style scoped>
.task-management {
  padding: 20px;
}

.search-item {
  display: inline-flex;
  align-items: center;
  margin-right: 20px;
}

.search-item label {
  width: 80px;
  text-align: right;
  margin-right: 10px;
}

.process-diagram-container {
  margin-top: 20px;
}

.process-diagram {
  margin-top: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style> 