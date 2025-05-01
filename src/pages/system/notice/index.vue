<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch">
      <el-form-item label="公告标题" prop="noticeTitle">
        <el-input
          v-model="queryParams.noticeTitle"
          placeholder="请输入公告标题"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="公告类型" prop="noticeType">
        <el-select v-model="queryParams.noticeType" placeholder="公告类型" clearable style="width: 200px">
          <el-option
            v-for="dict in noticeTypeOptions"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="公告状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="公告状态" clearable style="width: 200px">
          <el-option
            v-for="dict in statusOptions"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区域 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
        >删除</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="noticeList" @selection-change="handleSelectionChange" @row-click="handleView">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="公告编号" align="center" prop="noticeId" />
      <el-table-column label="公告标题" align="center" prop="noticeTitle" :show-overflow-tooltip="true" />
      <el-table-column label="公告类型" align="center" prop="noticeType">
        <template #default="scope">
          <dict-tag :options="noticeTypeOptions" :value="scope.row.noticeType"/>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="statusOptions" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="创建者" align="center" prop="createByName" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ scope.row.createTime }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            type="text"
            icon="View"
            @click.stop="handleView(scope.row)"
          >查看</el-button>
          <el-button
            type="text"
            icon="Edit"
            @click="handleUpdate(scope.row)"
          >修改</el-button>
          <el-button
            type="text"
            icon="Delete"
            @click="handleDelete(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改公告对话框 -->
    <el-dialog :title="title" v-model="open" width="780px" append-to-body>
      <el-form ref="noticeForm" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="公告标题" prop="noticeTitle">
          <el-input v-model="form.noticeTitle" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告类型" prop="noticeType">
          <el-select v-model="form.noticeType" placeholder="请选择">
            <el-option
              v-for="dict in noticeTypeOptions"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="公告状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="dict in statusOptions"
              :key="dict.value"
              :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="公告内容" prop="noticeContent">
          <Editor
            v-model="form.noticeContent"
            :height="300"
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemove"
            :file-list="fileList"
            multiple
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持任意格式文件上传，单个文件大小不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Notice">
import { ref, reactive, toRefs, onMounted, getCurrentInstance, watch } from 'vue';
import { getNoticeListApi, getNoticeApi, deleteNoticeApi, addNoticeApi, updateNoticeApi, getDictsApi } from "@/api/system";
import Editor from "@/components/Editor/index.vue";
import DictTag from "@/components/DictTag/index.vue";
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';

const { proxy } = getCurrentInstance();
const router = useRouter();

// 字典数据
const noticeTypeOptions = ref([]);
const statusOptions = ref([]);

// 加载字典数据
const loadDictData = async () => {
  try {
    const [err, res] = await getDictsApi(['sys_notice_type', 'sys_normal_disable']);
    if (!err && res && res.data) {
      noticeTypeOptions.value = res.data.sys_notice_type.map(item => {
        return {
          label: item.dictLabel,
          value: item.dictValue
        }
      }) || [];
      statusOptions.value = res.data.sys_normal_disable.map(item => {
        return {
          label: item.dictLabel,
          value: item.dictValue
        }
      }) || [];
    }
  } catch (error) {
    console.error('获取字典数据失败:', error);
  }
};

// 数据列表
const noticeList = ref([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

// 选中数组
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);

// 弹出层标题
const title = ref("");
const open = ref(false);

// 文件上传相关
const fileList = ref([]);
const uploadUrl = import.meta.env.VITE_APP_BASE_API + "/common/upload";

// 表单数据
const data = reactive({
  form: {
    noticeId: undefined,
    noticeTitle: undefined,
    noticeType: undefined,
    noticeContent: undefined,
    status: "0",
    attachments: []
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    noticeTitle: undefined,
    noticeType: undefined,
    status: undefined
  },
  rules: {
    noticeTitle: [
      { required: true, message: "公告标题不能为空", trigger: "blur" }
    ],
    noticeType: [
      { required: true, message: "公告类型不能为空", trigger: "change" }
    ],
    noticeContent: [
      { required: true, message: "公告内容不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询公告列表 */
async function getList() {
  loading.value = true;
  try {
    // Call API using await and destructure the response
    const [error, res] = await getNoticeListApi(queryParams.value);

    if (error) {
      // Handle API call error
      console.error("Get notice list API error:", error);
      ElMessage.error(error.message || "获取公告列表失败");
      return; // Exit if there was an error
    }

    // Destructure data and code from the response
    const { data, code, message } = res;

    if (code !== 200) {
      // Handle non-200 response code
      console.error("Get notice list failed with code:", code, "Message:", message);
      ElMessage.error(message || `获取公告列表失败，错误码: ${code}`);
      return; // Exit if code is not 200
    }

    // Assign data if successful
    if (data) {
        noticeList.value = data.records;
        total.value = data.total;
    } else {
        // Handle case where data is unexpectedly null/undefined even with code 200
        noticeList.value = [];
        total.value = 0;
        console.warn("Get notice list returned code 200 but data object is missing.");
        ElMessage.warn("获取公告列表成功，但未返回有效数据。");
    }

  } catch (err) {
    // Catch any unexpected errors during the process
    console.error("Unexpected error in getList:", err);
    ElMessage.error("处理公告列表时发生意外错误");
  } finally {
    // Ensure loading indicator is turned off
    loading.value = false;
  }
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    noticeId: undefined,
    noticeTitle: undefined,
    noticeType: undefined,
    noticeContent: undefined,
    status: "0",
    attachments: []
  };
  fileList.value = [];
  if (proxy.$refs.noticeForm) {
    proxy.$refs.noticeForm.resetFields();
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  if (proxy.$refs.queryForm) {
    proxy.$refs.queryForm.resetFields();
  }
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.noticeId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 查看操作 */
function handleView(row) {
  const noticeId = row.noticeId || ids.value[0];
  if (!noticeId) {
    ElMessage.warning("请选择要查看的公告");
    return;
  }
  router.push({ path: `/system/notice/detail/${noticeId}` });
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加公告";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const noticeId = row.noticeId || ids.value[0];
  getNoticeApi(noticeId).then(response => {
    form.value = response.data;
    if (form.value.attachments) {
      fileList.value = form.value.attachments.map(item => ({
        name: item.fileName,
        url: item.filePath
      }));
    }
    open.value = true;
    title.value = "修改公告";
  });
}

/** 提交按钮 */
async function submitForm() {
  const currentProxy = proxy;
  try {
    const valid = await currentProxy.$refs["noticeForm"].validate();
    if (valid) {
      const isEdit = form.value.noticeId !== undefined;
      const api = isEdit ? updateNoticeApi : addNoticeApi;
      const loadingInstance = ElLoading.service({ fullscreen: true, text: 'Submitting...' });

      try {
        const response = await api(form.value);
        loadingInstance.close();

        if (response[1].code === 200) {
          ElMessage.success(isEdit ? "修改成功" : "新增成功");
          open.value = false;
          getList();
        } else {
          ElMessage.error(response?.message || (isEdit ? "修改失败" : "新增失败"));
        }
      } catch (apiError) {
        loadingInstance.close();
        console.error(isEdit ? "Update notice API error:" : "Add notice API error:", apiError);
        ElMessage.error(isEdit ? "修改过程中发生错误" : "新增过程中发生错误");
      }
    }
  } catch (validationError) {
    console.log('Form validation failed:', validationError);
  }
}

/** 删除按钮操作 */
function handleDelete(row) {
  const noticeIds = row.noticeId || ids.value;
  proxy.$modal.confirm('是否确认删除公告编号为"' + noticeIds + '"的数据项？').then(function() {
    return deleteNoticeApi(noticeIds);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {});
}

/** 文件上传成功处理 */
function handleUploadSuccess(response, file, fileList) {
  if (!form.value.attachments) {
    form.value.attachments = [];
  }
  form.value.attachments.push({
    fileName: file.name,
    filePath: response.url,
    fileSize: file.size,
    fileType: file.type
  });
}

/** 文件移除处理 */
function handleRemove(file, fileList) {
  const index = form.value.attachments.findIndex(item => item.filePath === file.url);
  if (index !== -1) {
    form.value.attachments.splice(index, 1);
  }
}

onMounted(() => {
  loadDictData();
  getList();
});
</script> 