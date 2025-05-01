<template>
  <div class="todo-tasks">
    <gl-base-header>
      <div class="search-item">
        <label>任务名称：</label>
        <el-input v-model="queryParams.taskName" placeholder="请输入任务名称"/>
      </div>
      <div class="search-item">
        <label>流程名称：</label>
        <el-input v-model="queryParams.processName" placeholder="请输入流程名称"/>
      </div>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
    </gl-base-header>

    <!-- 添加批量处理按钮 -->
    <el-button
        type="primary"
        :disabled="!selectedTasks.length"
        @click="openBatchDialog"
        style="margin-left: 10px;"
    >
      批量处理
    </el-button>

    <gl-table-jsx
        :tableData="todoList"
        :tableHeader="columns"
        :total="pageTotal"
        :isAutoPagination="false"
        v-model:paginationConfig="paginationConfig"
        @pagination-change="handleQuery"
        @loadTableData="handleQuery"
        @selection-change="handleSelectionChange"
    />

    <!-- 任务处理对话框 -->
    <el-dialog
        title="处理任务"
        v-model="handleDialog.visible"
        width="600px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
    >
      <el-skeleton :loading="loadingTaskDetail" animated>
        <template #template>
          <el-skeleton-item variant="text" style="width: 100%;"/>
          <el-skeleton-item variant="text" style="width: 100%; margin-top: 16px;"/>
          <el-skeleton-item variant="text" style="width: 100%; margin-top: 16px;"/>
        </template>
        <template #default>
          <el-form :model="taskForm" label-width="100px" ref="taskFormRef">
            <el-form-item label="任务名称">
              <el-input v-model="currentTask.name" disabled/>
            </el-form-item>
            <el-form-item label="流程实例">
              <el-input v-model="currentTask.processInstanceName" disabled/>
            </el-form-item>
            <el-form-item label="审批结果" prop="approveResult">
              <el-radio-group v-model="taskForm.approveResult">
                <el-radio :value="true">同意</el-radio>
                <el-radio :value="false">拒绝</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="审批人" prop="leaderId" v-if="!needNextApprover">
              <el-select v-model="taskForm.leaderId" placeholder="请选择下一步审批人">
                <el-option
                    v-for="approver in approvers"
                    :key="approver.id"
                    :label="approver.username"
                    :value="approver.id"
                />
              </el-select>
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
        </template>
      </el-skeleton>
      <template #footer>
        <el-button @click="handleDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="completeTask" :loading="submittingTask">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量处理对话框 -->
    <el-dialog
        title="批量处理任务"
        v-model="batchDialog.visible"
        width="500px"
    >
      <el-form :model="batchForm" label-width="100px" :rules="batchFormRules" ref="batchFormRef">
        <el-form-item label="处理结果" prop="approveResult">
          <el-radio-group v-model="batchForm.approveResult">
            <el-radio :value="true">同意</el-radio>
            <el-radio :value="false">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理意见" prop="comment">
          <el-input
              v-model="batchForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入处理意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="completeBatchTasks">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import {ref, reactive, onMounted, computed} from 'vue';
import {ElMessage} from 'element-plus';
import useTable from '@/components/global/gl-table-jsx/useTable';
import http from '@/utils/http';
import {useRouter} from 'vue-router';
import {
  getTaskDetail,
  checkTaskHasNextGateway,
  getTaskApprovers,
  completeUserTask,
  completeGatewayTask,
  completeBatchTasks as apiBatchComplete
} from '@/api/workflow';

const {paginationConfig} = useTable();
const router = useRouter();

const queryParams = reactive({
  processName: '',
  taskName: '',
});

const todoList = ref([]);
const pageTotal = ref(0);
const approvers = ref([]);

// 当前任务信息
const currentTask = ref({
  taskId: '',
  taskName: '',
  processName: '',
  processInstanceId: '',
  processDefinitionKey: '',
});

// 任务处理对话框
const handleDialog = reactive({
  visible: false,
  hasNextGateway: false,
  showAttachment: true
});

// 任务处理表单
const taskForm = reactive({
  approveResult: true, // 审批结果
  leaderId: null, // 下一步审批人
  comment: '', // 处理意见
});

const taskFormRef = ref(null);

// 是否需要选择下一步审批人
const needNextApprover = computed(() => {
  // 如果同意并且不是网关任务，需要选择下一步审批人
  return !handleDialog.hasNextGateway;
});

// 添加多选功能
const selectedTasks = ref([]);

// 批量处理对话框
const batchDialog = reactive({
  visible: false,
});

// 批量处理表单
const batchForm = reactive({
  approveResult: true,
  comment: '',
});

// 批量处理表单规则
const batchFormRules = {
  approveResult: [{required: true, message: '请选择处理结果', trigger: 'change'}],
  comment: [{required: true, message: '请输入处理意见', trigger: 'blur'}],
};

const batchFormRef = ref();

// 添加加载状态跟踪
const loadingTaskDetail = ref(false);
const submittingTask = ref(false);

onMounted(() => {
  handleQuery();
});

// 获取待办任务列表
const handleQuery = async () => {
  const {current, size} = paginationConfig.value;
  try {
    const [err, res] = await http.get('/workflow/process/tasks/todo', {
      pageNum: current,
      pageSize: size,
      processName: queryParams.processName,
      taskName: queryParams.taskName,
    });

    if (err) {
      ElMessage.error(err.message);
      return;
    }

    const {data} = res;
    todoList.value = data.records;
    pageTotal.value = data.total;
  } catch (error) {
    console.error(error);
    ElMessage.error('获取待办任务失败');
  }
};

// 重置查询条件
const resetQuery = () => {
  queryParams.processName = '';
  queryParams.taskName = '';
  handleQuery();
};

// 处理任务
const handleTask = async (task) => {
  console.log('处理任务:', task);
  if (!task?.id) {
    ElMessage.error('任务信息不完整');
    return;
  }

  // 设置当前任务
  currentTask.value = {
    id: task.id,
    name: task.name,
    processInstanceName: task.processInstanceName,
    processInstanceId: task.processInstanceId,
    processDefinitionKey: task.processDefinitionKey || '',
  };

  loadingTaskDetail.value = true;

  try {
    // 获取任务详情
    const [err, taskDetail] = await getTaskDetail(task.id);
    if (err) {
      ElMessage.error(err.message || '获取任务详情失败');
      return;
    }

    // 重置表单数据
    taskForm.approveResult = true;
    taskForm.leaderId = null;
    taskForm.comment = '';

    // 检查是否有下一个网关
    const [gatewayErr, hasNextGateway] = await checkTaskHasNextGateway(task.id);
    if (gatewayErr) {
      ElMessage.error(gatewayErr.message || '检查任务网关失败');
      return;
    }

    // 更新网关状态
    handleDialog.hasNextGateway = hasNextGateway;
    console.log('是否存在网关:', hasNextGateway);

    // 获取下一步审批人列表 (如果同意且不是网关任务则需要选择审批人)
    if (!hasNextGateway.data) {
      console.log('需要选择审批人，获取审批人列表');
      const [approversErr, approversRes] = await getTaskApprovers(task.id);
      if (approversErr) {
        ElMessage.error(approversErr.message || '获取审批人列表失败');
        return;
      }
      // 使用API返回的数据结构
      approvers.value = approversRes.data || [];
      console.log('审批人列表:', approvers.value);
    }

    // 打开处理对话框
    handleDialog.visible = true;
    console.log('任务处理对话框已打开');
  } catch (error) {
    console.error('处理任务异常:', error);
    ElMessage.error('获取任务信息失败');
  } finally {
    loadingTaskDetail.value = false;
  }
};

// 完成任务
const completeTask = async () => {
  if (!currentTask.value?.id) {
    ElMessage.error('当前任务ID不存在');
    return;
  }

  // 表单验证
  if (!needNextApprover.value && taskForm.leaderId == null) {
    ElMessage.warning('请选择下一步审批人');
    return;
  }

  submittingTask.value = true;

  try {
    // 构建任务完成参数
    const variables = {
      approveResult: taskForm.approveResult,
      comment: taskForm.comment,
    };

    // 如果需要下一步审批人，添加到变量中
    if (!needNextApprover.value) {
      variables.leaderId = taskForm.leaderId;
    }

    // 调用接口完成任务
    const [err] = await http.post('/workflow/instance/completeUserTask', {
      taskId: currentTask.value.id,
      variables,
    });

    if (err) {
      ElMessage.error(err.message || '处理任务失败');
      return;
    }

    ElMessage.success('任务处理成功');
    handleDialog.visible = false;
    handleQuery(); // 刷新任务列表
  } catch (error) {
    console.error('提交任务异常:', error);
    ElMessage.error('处理任务失败');
  } finally {
    submittingTask.value = false;
  }
};

// 表格多选变化
const handleSelectionChange = (selection) => {
  selectedTasks.value = selection;
};

// 打开批量处理对话框
const openBatchDialog = () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请选择至少一个任务');
    return;
  }
  batchDialog.visible = true;
};

// 批量完成任务
const completeBatchTasks = async () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请选择至少一个任务');
    return;
  }
  try {
    await batchFormRef.value.validate();

    const taskIds = selectedTasks.value.map(task => task.id);

    const [err] = await apiBatchComplete(
        taskIds,
        batchForm.approveResult,
        batchForm.comment
    );

    if (err) {
      ElMessage.error(err.message || '批量处理失败');
      return;
    }

    ElMessage.success('批量处理成功');
    batchDialog.visible = false;
    handleQuery();
  } catch (error) {
    console.error(error);
    ElMessage.error('批量处理失败');
  }
};

// 表格列配置
const columns = [
  {
    type: 'selection',
    width: 55,
  },
  {
    label: '任务ID',
    prop: 'id',
    width: 280,
  },
  {
    label: '任务名称',
    prop: 'name',
  },
  {
    label: '流程名称',
    prop: 'processInstanceName',
  },
  {
    label: '流程实例ID',
    prop: 'processInstanceId',
    width: 280,
  },
  {
    label: '创建时间',
    prop: 'createTime',
  },
  {
    label: '操作',
    width: 180,
    render: (scope) => (
        <>
          <el-button type="primary" link onClick={() => handleTask(scope.row)}>
            处理
          </el-button>
          <el-button type="info" link onClick={() => viewDetail(scope.row)}>
            详情
          </el-button>
        </>
    ),
  },
];

// 查看流程详情
const viewDetail = (task) => {
  // 跳转到流程实例详情页面
  router.push(`/workflow/instance/detail?id=${task.processInstanceId}`);
};
</script>

<style scoped>
.todo-tasks {
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

.process-info {
  margin-top: 20px;
}

.process-diagram {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  text-align: center;
}

.process-diagram img {
  max-width: 100%;
}
</style> 