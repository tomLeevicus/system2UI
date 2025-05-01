<script setup lang="tsx">
import { ref, onMounted } from "vue";
import {
  getDictTypeListApi,
  addDictTypeApi,
  updateDictTypeApi,
  deleteDictTypeApi,
  getDictListApi,
} from "@/api/system";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ApiResponse } from "@/types/api";
import DictDialog from "./components/dict-dialog.vue";

const tableData = ref<any[]>([]);
const tableHeader = ref<any[]>([
  {
    label: "字典编号",
    prop: "dictId",
  },
  {
    label: "字典名称",
    prop: "dictName",
  },
  {
    label: "字典类型",
    prop: "dictType",
  },
  {
    label: "状态",
    prop: "status",
    render: ({ row }: { row: any }) => {
      return (
        <el-switch active-value="1" inactive-value="0" v-model={row.status} />
      );
    },
  },
  {
    label: "备注",
    prop: "remark",
  },
  {
    label: "创建时间",
    prop: "createTime",
  },
  {
    label: "操作",
    prop: "operation",
    render: ({ row }: { row: any }) => {
      return (
        <>
          <el-button type="primary" onClick={() => handleEdit(row)}>
            编辑
          </el-button>
          <el-button type="danger" onClick={() => handleDelete(row)}>
            删除
          </el-button>
          <el-button type="success" onClick={() => handleViewData(row)}>
            查看详情
          </el-button>
        </>
      );
    },
  },
]);
const search = async () => {
  // const params = {
  //   username: searchParams.value.username,
  // };
  const params = {
    ...searchParams.value,
  };
  const [error, res] = (await getDictTypeListApi(params)) as [
    Error | null,
    ApiResponse
  ];
  if (error) {
    ElMessage.error(error.message);
    return;
  }
  const { data, code } = res;
  if (code !== 200) {
    ElMessage.error(data.message);
    return;
  }
  tableData.value = data.records;
};
const searchParams = ref({
  username: "",
});

// 添加表单对话框相关数据
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formData = ref({
  dictName: "",
  dictType: "",
  status: "0",
  remark: "",
});

// 字典数据相关
const dictDataDialogVisible = ref(false);
const currentDictType = ref("");
const currentDictName = ref("");
const dictDataLoading = ref(false);
const dictDataList = ref<any[]>([]);

const isEdit = ref(false);

onMounted(() => {
  search();
});

// 打开新增对话框
const handleAdd = () => {
  dialogTitle.value = "新增字典";
  dialogVisible.value = true;
  isEdit.value = false;
  formData.value = {
    dictName: "",
    dictType: "",
    status: "0",
    remark: "",
  };
};

// 打开编辑对话框
const handleEdit = (row: any) => {
  dialogTitle.value = "编辑用户";
  dialogVisible.value = true;
  isEdit.value = true;
  formData.value = { ...row };
};

// 查看字典数据
const handleViewData = async (row: any) => {
  currentDictType.value = row.dictType;
  currentDictName.value = row.dictName;
  dictDataDialogVisible.value = true;
  await loadDictData(row.dictType);
};

// 加载字典数据
const loadDictData = async (dictType: string) => {
  dictDataLoading.value = true;
  dictDataList.value = [];
  
  try {
    const [error, res] = await getDictListApi({ dictType });
    if (error) {
      ElMessage.error("获取字典数据失败");
      return;
    }
    
    if (res.code === 200 && res.data) {
      dictDataList.value = res.data.records || [];
    } else {
      ElMessage.error(res.message || "获取字典数据失败");
    }
  } catch (error) {
    console.error("获取字典数据出错:", error);
    ElMessage.error("获取字典数据出错");
  } finally {
    dictDataLoading.value = false;
  }
};

// 处理删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm("确认删除该用户吗？", "提示", {
      type: "warning",
    });
    const [error, res] = await deleteDictTypeApi(row.id);
    if (error) {
      ElMessage.error(error.message);
      return;
    }
    if (res.code === 200) {
      ElMessage.success("删除成功");
      search();
    } else {
      ElMessage.error(res.message);
    }
  } catch {
    // 用户取消删除
  }
};

// 提交表单
const handleSubmit = async (formData: any) => {
  const api = isEdit.value ? updateDictTypeApi : addDictTypeApi;
  const [error, res] = await api(formData);
  if (error) {
    ElMessage.error(error.message);
    return;
  }
  if (res.code === 200) {
    ElMessage.success(isEdit.value ? "更新成功" : "创建成功");
    dialogVisible.value = false;
    search();
  } else {
    ElMessage.error(res.message);
  }
};
</script>

<template>
  <div class="menu-manage">
    <gl-base-header>
      <div class="search-item">
        <label for="">类型名称：</label>
        <el-input
          clearable
          v-model="searchParams.username"
          placeholder="字典名称"
        />
      </div>
      <el-button class="m-l-10" type="primary" @click="search">查询</el-button>
      <el-button type="primary" @click="handleAdd">新增</el-button>
    </gl-base-header>
    <div class="table-content">
      <gl-table-jsx
        :tableData="tableData"
        :tableHeader="tableHeader"
      ></gl-table-jsx>
    </div>

    <!-- 使用用户对话框组件 -->
    <dict-dialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :form-data="formData"
      :is-edit="isEdit"
      @submit="handleSubmit"
    />
    
    <!-- 字典数据弹窗 -->
    <el-dialog
      v-model="dictDataDialogVisible"
      :title="`${currentDictName} - 字典数据列表`"
      width="900px"
    >
      <el-table
        v-loading="dictDataLoading"
        :data="dictDataList"
        style="width: 100%"
        border
      >
        <el-table-column prop="dictCode" label="字典编码" width="100" />
        <el-table-column prop="dictLabel" label="字典标签" width="150" />
        <el-table-column prop="dictValue" label="字典键值" width="100" />
        <el-table-column prop="dictSort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'">
              {{ row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
      </el-table>
      <template #footer>
        <el-button @click="dictDataDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>
