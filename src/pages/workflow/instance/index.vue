<template>
  <div class="process-instance">
    <gl-base-header>
      <div class="search-item">
        <label>流程名称：</label>
        <el-input v-model="queryParams.processName" placeholder="请输入流程名称" />
      </div>
      <div class="search-item">
        <label>业务标识：</label>
        <el-input v-model="queryParams.businessKey" placeholder="请输入业务标识" />
      </div>
      <div class="search-item">
        <label>流程状态：</label>
        <el-select v-model="queryParams.status" placeholder="请选择状态">
          <el-option label="全部" value="" />
          <el-option label="运行中" value="running" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="canceled" />
        </el-select>
      </div>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button type="primary" @click="openStartDialog">发起流程</el-button>
    </gl-base-header>

    <gl-table-jsx
      :tableData="instanceList"
      :tableHeader="columns"
      :total="pageTotal"
      :isAutoPagination="false"
      v-model:paginationConfig="paginationConfig"
      @pagination-change="handleQuery"
      @loadTableData="handleQuery"
    />

    <!-- 发起流程对话框 -->
    <el-dialog
      title="发起流程"
      v-model="startDialog.visible"
      width="600px"
    >
      <el-form :model="startForm" label-width="100px" :rules="startFormRules" ref="startFormRef">
        <el-form-item label="流程类型" prop="processName">
          <el-select v-model="startForm.selectedProcess" placeholder="请选择流程类型" @change="handleProcessChange">
            <el-option 
              v-for="proc in deployedProcesses" 
              :key="proc.id" 
              :label="proc.name" 
              :value="proc" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="流程KEY" prop="processKey">
          <el-input v-model="startForm.processKey" placeholder="流程KEY" :disabled="true" />
        </el-form-item>
        <el-form-item label="业务标识" prop="businessKey">
          <el-input v-model="startForm.businessKey" placeholder="请输入业务标识" />
        </el-form-item>
        <el-form-item label="流程名称" prop="processName">
          <el-input v-model="startForm.processName" placeholder="请输入流程名称" />
        </el-form-item>
        <el-form-item label="审批人" prop="leaderId" v-if="showApproverField">
          <el-select v-model="startForm.leaderId" placeholder="请选择审批人">
            <el-option 
              v-for="approver in approvers" 
              :key="approver.userId" 
              :label="approver.userName" 
              :value="approver.userId" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="startDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="startProcess">确定</el-button>
      </template>
    </el-dialog>

    <!-- 流程详情对话框 -->
    <el-dialog
      title="流程详情"
      v-model="detailDialog.visible"
      width="800px"
    >
      <el-descriptions border :column="2">
        <el-descriptions-item label="流程实例ID">{{ currentInstance.id }}</el-descriptions-item>
        <el-descriptions-item label="流程定义ID">{{ currentInstance.processDefinitionId }}</el-descriptions-item>
        <el-descriptions-item label="流程名称">{{ currentInstance.name }}</el-descriptions-item>
        <el-descriptions-item label="业务标识">{{ currentInstance.businessKey }}</el-descriptions-item>
        <el-descriptions-item label="发起人">{{ currentInstance.startUserName }}</el-descriptions-item>
        <el-descriptions-item label="发起时间">{{ currentInstance.startTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentInstance.status)">
            {{ getStatusText(currentInstance.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      
      <div class="instance-tabs">
        <el-tabs>
          <el-tab-pane label="当前任务">
            <div v-if="currentTasks.length">
              <el-table :data="currentTasks" border style="width: 100%">
                <el-table-column prop="taskId" label="任务ID" width="280" />
                <el-table-column prop="taskName" label="任务名称" />
                <el-table-column prop="assignee" label="处理人" />
                <el-table-column prop="createTime" label="创建时间" />
              </el-table>
            </div>
            <el-empty v-else description="暂无任务" />
          </el-tab-pane>
          <el-tab-pane label="流程图">
            <div class="diagram-container">
              <img v-if="processImage" :src="processImage" alt="流程图" class="process-diagram-image" />
              <div v-else class="diagram-loading">
                <el-empty description="加载流程图中..." v-if="loadingProcessImage"></el-empty>
                <el-empty description="无法加载流程图" v-else></el-empty>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="流程变量">
            <el-table :data="variablesList" border style="width: 100%">
              <el-table-column prop="name" label="变量名" />
              <el-table-column prop="value" label="变量值" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="流程历史">
            <el-timeline>
              <el-timeline-item
                v-for="activity in historyActivities"
                :key="activity.id"
                :timestamp="activity.startTime"
                :type="getActivityType(activity.endTime)"
              >
                <div class="timeline-title">{{ activity.activityName }}</div>
                <div v-if="activity.assignee">处理人: {{ activity.assignee }}</div>
                <div v-if="activity.endTime">完成时间: {{ activity.endTime }}</div>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
          <el-tab-pane label="流程评论">
            <div v-if="comments.length">
              <el-card v-for="comment in comments" :key="comment.id" class="comment-card">
                <template #header>
                  <div class="comment-header">
                    <span>{{ comment.userName }}</span>
                    <span>{{ comment.time }}</span>
                  </div>
                </template>
                <div>{{ comment.message }}</div>
              </el-card>
            </div>
            <el-empty v-else description="暂无评论" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import useTable from '@/components/global/gl-table-jsx/useTable';
import http from '@/utils/http';
import { getProcessImage as fetchProcessImage } from '@/api/workflow';

const { paginationConfig } = useTable();

const queryParams = reactive({
  processName: '',
  businessKey: '',
  status: '',
});

const instanceList = ref([]);
const pageTotal = ref(0);
const deployedProcesses = ref([]);
const approvers = ref([]);

// 当前任务
const currentTasks = ref([]);
// 当前实例
const currentInstance = ref({});
// 流程变量
const variablesList = ref([]);

// 发起流程对话框
const startDialog = reactive({
  visible: false,
});

// 详情对话框
const detailDialog = reactive({
  visible: false,
});

// 发起流程表单
const startForm = reactive({
  selectedProcess: null,
  processKey: '',
  businessKey: '',
  processName: '',
  leaderId: ''
});

// 表单校验规则
const startFormRules = {
  selectedProcess: [{ required: true, message: '请选择流程类型', trigger: 'change' }],
  processKey: [{ required: true, message: '流程KEY不能为空', trigger: 'change' }],
  businessKey: [{ required: true, message: '请输入业务标识', trigger: 'blur' }],
  processName: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
  leaderId: [{ required: true, message: '请选择审批人', trigger: 'change' }]
};

const startFormRef = ref(null);
const showApproverField = ref(false);

// 流程图相关
const processImage = ref('');
const loadingProcessImage = ref(false);

onMounted(() => {
  handleQuery();
  getDeployedProcesses();
});

// 获取流程实例列表
const handleQuery = async () => {
  const { current, size } = paginationConfig.value;
  try {
    const [err, res] = await http.get('/workflow/instance/list', {
      pageNum: current,
      pageSize: size,
      processName: queryParams.processName,
      businessKey: queryParams.businessKey,
      status: queryParams.status,
    });
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    const { data } = res;
    instanceList.value = data.records;
    pageTotal.value = data.total;
  } catch (error) {
    console.error(error);
    ElMessage.error('获取流程实例列表失败');
  }
};

// 获取已部署的流程定义
const getDeployedProcesses = async () => {
  try {
    const [err, res] = await http.get('/workflow/process/list');
    
    if (err) {
      ElMessage.error(err.message || '获取流程定义列表失败');
      return;
    }
    
    deployedProcesses.value = res.data.records || [];
  } catch (error) {
    console.error(error);
    ElMessage.error('获取流程定义列表失败');
  }
};

// 获取审批人列表
const getApprovers = async (processKey) => {
  try {
    const [err, res] = await http.get(`/workflow/process/approvers/${processKey}`);
    
    if (err) {
      console.error(err);
      approvers.value = [];
      return;
    }
    
    approvers.value = res.data || [];
  } catch (error) {
    console.error(error);
    approvers.value = [];
  }
};

// 重置查询条件
const resetQuery = () => {
  queryParams.processName = '';
  queryParams.businessKey = '';
  queryParams.status = '';
  handleQuery();
};

// 打开发起流程弹框
const openStartDialog = async () => {
  // 重置表单
  startForm.selectedProcess = null;
  startForm.processKey = '';
  startForm.businessKey = '';
  startForm.processName = '';
  startForm.leaderId = '';
  
  // 获取已部署的流程定义
  await getDeployedProcesses();
  
  // 显示弹框
  startDialog.visible = true;
};

// 处理流程类型变更事件
const handleProcessChange = async (selectedProcess) => {
  if (!selectedProcess) {
    startForm.processKey = '';
    startForm.processName = '';
    return;
  }
  
  // 设置流程KEY
  startForm.processKey = selectedProcess.processKey;
  
  // 默认使用流程类型作为流程名称，用户可以修改
  startForm.processName = selectedProcess.name;
  
  // 获取该流程的审批人列表
  await getApprovers(selectedProcess.processKey);
  
  // 是否显示审批人字段
  showApproverField.value = approvers.value.length > 0;
};

// 启动流程实例
const startProcess = async () => {
  // 表单校验
  await startFormRef.value.validate();
  
  try {
    const variables = {
      processName: startForm.processName
    };
    
    // 如果有审批人，添加到变量中
    if (startForm.leaderId) {
      variables.leaderId = startForm.leaderId;
    }
    
    // 启动流程
    const [err, res] = await http.post(`/workflow/instance/start/${startForm.processKey}`, {
      businessKey: startForm.businessKey,
      variables
    });
    
    if (err) {
      ElMessage.error(err.message || '启动流程失败');
      return;
    }
    
    ElMessage.success('流程启动成功');
    startDialog.visible = false;
    handleQuery(); // 刷新流程实例列表
  } catch (error) {
    console.error(error);
    ElMessage.error('启动流程失败');
  }
};

// 查看流程详情
const handleViewDetail = async (row) => {
  currentInstance.value = row;
  
  // 获取当前任务
  await getInstanceTasks(row.id);
  
  // 获取流程变量
  await getInstanceVariables(row.id);
  
  // 获取流程历史
  await getProcessHistory(row.id);
  
  // 获取流程评论
  await getProcessComments(row.id);
  
  // 获取流程图
  await getProcessImage(row.id);
  
  detailDialog.visible = true;
};

// 获取流程实例历史活动
const getProcessHistory = async (instanceId) => {
  try {
    const [err, res] = await http.get(`/workflow/instance/history/${instanceId}`);
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    historyActivities.value = res.data;
  } catch (error) {
    console.error(error);
    ElMessage.error('获取流程历史失败');
  }
};

// 获取流程实例评论
const getProcessComments = async (instanceId) => {
  try {
    const [err, res] = await http.get(`/workflow/instance/comments/${instanceId}`);
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    comments.value = res.data;
  } catch (error) {
    console.error(error);
    ElMessage.error('获取流程评论失败');
  }
};

// 获取流程图
const getProcessImage = async (instanceId) => {
  processImage.value = '';
  loadingProcessImage.value = true;
  
  try {
    const [err, res] = await fetchProcessImage(instanceId);
    
    if (err) {
      ElMessage.error('获取流程图失败');
      loadingProcessImage.value = false;
      return;
    }
    
    // 将二进制数据转换为 base64
    const reader = new FileReader();
    reader.onload = (e) => {
      processImage.value = e.target.result as string;
      loadingProcessImage.value = false;
    };
    reader.onerror = () => {
      ElMessage.error('流程图解析失败');
      loadingProcessImage.value = false;
    };
    reader.readAsDataURL(res);
  } catch (error) {
    console.error(error);
    ElMessage.error('获取流程图失败');
    loadingProcessImage.value = false;
  }
};

// 获取活动节点状态
const getActivityType = (endTime) => {
  return endTime ? 'success' : 'warning';
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'running': return '运行中';
    case 'completed': return '已完成';
    case 'canceled': return '已取消';
    default: return '未知';
  }
};

// 获取状态标签类型
const getStatusType = (status) => {
  switch (status) {
    case 'running': return 'primary';
    case 'completed': return 'success';
    case 'canceled': return 'info';
    default: return 'info';
  }
};

// 删除流程实例
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该流程实例吗？这将终止流程的执行', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const [err] = await http.del(`/workflow/instance/${row.id}`, {
        deleteReason: '手动删除'
      });
      
      if (err) {
        ElMessage.error(err.message);
        return;
      }
      
      ElMessage.success('删除成功');
      handleQuery();
    } catch (error) {
      console.error(error);
      ElMessage.error('删除失败');
    }
  }).catch(() => {});
};

// 更新流程实例状态（激活/挂起）
const updateInstanceState = async (row) => {
  const newState = !row.suspended;
  const stateText = newState ? '激活' : '挂起';
  
  try {
    const [err] = await http.put(`/workflow/instance/state/${row.id}/${newState}`);
    
    if (err) {
      ElMessage.error(err.message);
      return;
    }
    
    ElMessage.success(`${stateText}成功`);
    handleQuery();
  } catch (error) {
    console.error(error);
    ElMessage.error(`${stateText}失败`);
  }
};

// 表格列配置
const columns = [
  {
    label: '流程实例ID',
    prop: 'id',
    width: 280,
  },
  {
    label: '流程名称',
    prop: 'processName',
  },
  {
    label: '业务标识',
    prop: 'businessKey',
  },
  {
    label: '发起人',
    prop: 'startUserName',
  },
  {
    label: '发起时间',
    prop: 'startTime',
  },
  {
    label: '状态',
    prop: 'status',
    width: 100,
    render: (scope) => (
      <el-tag type={getStatusType(scope.row.status)}>
        {getStatusText(scope.row.status)}
      </el-tag>
    ),
  },
  {
    label: '操作',
    width: 220,
    render: (scope) => (
      <>
        <el-button type="primary" link onClick={() => handleViewDetail(scope.row)}>
          详情
        </el-button>
        {scope.row.status === 'running' && (
          <el-button 
            type={scope.row.suspended ? 'success' : 'warning'} 
            link 
            onClick={() => updateInstanceState(scope.row)}
          >
            {scope.row.suspended ? '激活' : '挂起'}
          </el-button>
        )}
        <el-button type="danger" link onClick={() => handleDelete(scope.row)}>
          删除
        </el-button>
      </>
    ),
  },
];
</script>

<style scoped>
.process-instance {
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

.instance-tabs {
  margin-top: 20px;
}

.diagram-container {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: auto;
  max-height: 500px;
  text-align: center;
}

.diagram-container img {
  max-width: 100%;
}

.comment-card {
  margin-bottom: 10px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-title {
  font-weight: bold;
  margin-bottom: 5px;
}
</style> 