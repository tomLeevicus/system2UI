<template>
  <div class="process-definition">
    <gl-base-header>
      <div class="search-item">
        <label>流程名称：</label>
        <el-input v-model="queryParams.processName" placeholder="请输入流程名称" />
      </div>
      <div class="search-item">
        <label>流程分类：</label>
        <el-input v-model="queryParams.category" placeholder="请输入流程分类" />
      </div>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <el-button type="primary" @click="openDeployDirectDialog">部署流程</el-button>
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

    <!-- 直接部署流程对话框 -->
    <el-dialog
      title="部署流程"
      v-model="deployDirectDialog.visible"
      width="500px"
    >
      <el-form :model="deployDirectForm" label-width="100px">
        <el-form-item label="流程分类">
          <el-input v-model="deployDirectForm.category" placeholder="请输入流程分类" />
        </el-form-item>
        <el-form-item label="流程文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :multiple="false"
            :limit="1"
            accept=".bpmn,.bpmn20.xml"
            :on-change="handleFileChange"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .bpmn 或 .bpmn20.xml 格式的流程文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deployDirectDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload">立即上传</el-button>
      </template>
    </el-dialog>

    <!-- 查看XML对话框 -->
    <el-dialog
      title="流程XML"
      v-model="xmlDialog.visible"
      width="800px"
    >
      <pre v-if="xmlDialog.content" class="xml-content">{{ xmlDialog.content }}</pre>
      <div v-else class="loading">加载中...</div>
    </el-dialog>

    <!-- 流程图预览对话框 -->
    <el-dialog
      title="流程图预览"
      v-model="imageDialog.visible"
      width="800px"
    >
      <div class="diagram-container">
        <img :src="imageDialog.url" alt="流程图" style="max-width: 100%;" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import useTable from '@/components/global/gl-table-jsx/useTable';
import http from '@/utils/http.ts';
import { getProcessDeployGetImage } from '@/api/workflow';

const { paginationConfig } = useTable();

const queryParams = reactive({
  processName: '',
  category: '',
});

const processList = ref([]);
const pageTotal = ref(0);

// 直接部署对话框状态
const deployDirectDialog = reactive({
  visible: false,
});

// 直接部署表单
const deployDirectForm = reactive({
  category: 'default',
});

// XML查看对话框状态
const xmlDialog = reactive({
  visible: false,
  content: '',
});

// 流程图对话框状态
const imageDialog = reactive({
  visible: false,
  url: '',
});

const fileList = ref([]);

onMounted(() => {
  handleQuery();
});

// 获取流程定义列表
const handleQuery = async () => {
  const { current, size } = paginationConfig.value;
  try {
    // 确保请求中附带了token
    console.log('Authorization:', localStorage.getItem('token')); // 调试token

    const [err, res] = await http.get('/workflow/process/list', {
      pageNum: current, 
      pageSize: size,
      processName: queryParams.processName,
      category: queryParams.category,
    });
    
    if (err) {
      ElMessage.error(err.message || '获取流程列表失败');
      return;
    }
    
    // 确保数据提取方式与instance/index.vue一致
    processList.value = res.data.records || [];
    pageTotal.value = res.data.total || 0;
  } catch (error) {
    console.error('获取流程列表出错:', error);
    ElMessage.error('获取流程列表失败');
  }
};

// 重置查询条件
const resetQuery = () => {
  queryParams.processName = '';
  queryParams.category = '';
  handleQuery();
};

// 打开直接部署对话框
const openDeployDirectDialog = () => {
  deployDirectDialog.visible = true;
};

// 文件上传前的验证
const beforeDirectUpload = (file) => {
  const isValid = file.name.endsWith('.bpmn') || file.name.endsWith('.bpmn20.xml');
  if (!isValid) {
    ElMessage.error('只能上传 .bpmn 或 .bpmn20.xml 格式的文件!');
    return false;
  }
  return true;
};

// 直接部署流程
const deployProcessDirect = async (options) => {
  const { file } = options;
  const formData = new FormData();
  formData.append('file', file);
  
  if (deployDirectForm.category) {
    formData.append('category', deployDirectForm.category);
  }
  
  try {
    // 使用专用的上传方法
    const [err, res] = await http.upload('/workflow/process/deploy/direct', formData);
    
    if (err) {
      ElMessage.error(err.message || '部署失败');
      return;
    }
    
    ElMessage.success('部署成功');
    deployDirectDialog.visible = false;
    handleQuery();
  } catch (error) {
    console.error('部署过程发生错误:', error);
    ElMessage.error('部署失败');
  }
};

// 查看流程XML
const viewProcessXml = async (processDefinitionId) => {
  try {
    const [err, res] = await http.get(`/workflow/process/xml/${processDefinitionId}`);
    
    if (err) {
      ElMessage.error(err.message || '获取XML失败');
      return;
    }
    
    xmlDialog.content = res.data || '';
    xmlDialog.visible = true;
  } catch (error) {
    console.error('获取XML出错:', error);
    ElMessage.error('获取XML失败');
  }
};

// 删除流程定义
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该流程定义吗？这可能会影响正在运行的实例', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const [err] = await http.del(`/workflow/process/${row.deploymentId}`);
      
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

// 更新流程状态（激活/挂起）
const updateProcessState = async (row) => {
  const newState = !row.suspended;
  const stateText = newState ? '激活' : '挂起';
  
  try {
    const [err] = await http.put(`/workflow/process/state/${row.id}/${newState}`);
    
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

// 查看流程图
const viewProcessImage = async (id) => {
  const [error, res] = await getProcessDeployGetImage(id)
  console.log(res,'=====res');
  const {code, data} = res
  imageDialog.url = `data:image/png;base64,${data}`
  // imageDialog.url = `/api/workflow/process/deployGetImage/${id}`;
  imageDialog.visible = true;
};

// 表格列配置
const columns = [
  {
    label: 'ID',
    prop: 'id',
    width: 280,
  },
  {
    label: '流程名称',
    prop: 'name',
  },
  {
    label: '流程KEY',
    prop: 'processKey',
  },
  {
    label: '流程版本',
    prop: 'version',
    width: 80,
  },
  {
    label: '分类',
    prop: 'category',
  },
  {
    label: '部署时间',
    prop: 'deployTime',
  },
  {
    label: '状态',
    prop: 'suspended',
    width: 80,
    render: (scope) => (
      <el-tag type={scope.row.suspended ? 'warning' : 'success'}>
        {scope.row.suspended ? '已挂起' : '已激活'}
      </el-tag>
    ),
  },
  {
    label: '操作',
    width: 280,
    render: (scope) => (
      <>
        <el-button type="primary" link onClick={() => viewProcessXml(scope.row.id)}>
          查看XML
        </el-button>
        <el-button type="success" link onClick={() => viewProcessImage(scope.row.id)}>
          查看流程图
        </el-button>
        <el-button 
          type={scope.row.suspended ? 'success' : 'warning'} 
          link 
          onClick={() => updateProcessState(scope.row)}
        >
          {scope.row.suspended ? '激活' : '挂起'}
        </el-button>
        <el-button type="danger" link onClick={() => handleDelete(scope.row)}>
          删除
        </el-button>
      </>
    ),
  },
];

const handleFileChange = (file, selfFileList) => {
  console.log('file', file, selfFileList);
  // 确保 fileList 存在
  if (!selfFileList) {
    selfFileList = [];
  }
  
  // 只保留最后上传的文件
  fileList.value = selfFileList.slice(-1);
};

const submitUpload = async () => {
  console.log('fileList',fileList);
  // 检查是否有文件
  if (!fileList.value || fileList.value.length === 0) {
    ElMessage.warning('请先选择文件');
    return;
  }
  
  const file = fileList.value[0];
  if (!file || !file.raw) {
    ElMessage.warning('文件无效，请重新选择');
    return;
  }
  
  const formData = new FormData();
  formData.append('file', file.raw);
  
  if (deployDirectForm.category) {
    formData.append('category', deployDirectForm.category);
  }
  
  try {
    const [err, res] = await http.upload('/workflow/process/deploy/direct', formData);
    
    if (err) {
      ElMessage.error(err.message || '部署失败');
      return;
    }
    
    ElMessage.success('部署成功');
    deployDirectDialog.visible = false;
    fileList.value = [];
    handleQuery();
  } catch (error) {
    console.error('部署过程发生错误:', error);
    ElMessage.error('部署失败');
  }
};
</script>

<style scoped>
.process-definition {
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

.xml-content {
  max-height: 500px;
  overflow: auto;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
}
</style> 