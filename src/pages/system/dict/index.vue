<script setup lang="tsx">
import { ref, onMounted } from "vue";
import {
  getDictListApi,
  addDictApi,
  updateDictApi,
  deleteDictApi,
  getDictTypeListApi,
} from "@/api/system";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ApiResponse } from "@/types/api";
import DictDialog from "./components/dict-dialog.vue";

const tableData = ref<any[]>([]);
const tableHeader = ref<any[]>([
  {
    label: "字典编号",
    prop: "dictCode",
  },
  {
    label: "字典名称",
    prop: "dictLabel",
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
        </>
      );
    },
  },
]);
const dictTypeOptions = ref<any[]>([]);
// 获取字典类型列表
const getDictTypeOptions = async () => {
  try {
    const [error, res] = await getDictTypeListApi({});
    if (error) {
      ElMessage.error("获取字典类型失败");
      return;
    }

    if (res.code === 200 && res.data) {
      // 转换为下拉选项格式
      dictTypeOptions.value = res.data.records.map((item: any) => ({
        label: `${item.dictName} (${item.dictType})`,
        value: item.dictType,
      }));
    }
  } catch (error) {
    console.error("获取字典类型出错:", error);
  } finally {
  }
};
const search = async () => {
  // const params = {
  //   username: searchParams.value.username,
  // };
  const params = {
    ...searchParams.value,
    dictType: dictType.value
  };
  const [error, res] = (await getDictListApi(params)) as [
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
  dictLabel: "",
  // type: "",
});
const dictType = ref("");

// 添加表单对话框相关数据
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formData = ref({
  dictLabel: "",
  dictType: "",
  status: "0",
  remark: "",
});

const isEdit = ref(false);

onMounted(() => {
  getDictTypeOptions();
  search();
});

// 打开新增对话框
const handleAdd = () => {
  dialogTitle.value = "新增字典";
  dialogVisible.value = true;
  isEdit.value = false;
  formData.value = {
    dictLabel: "",
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

// 处理删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm("确认删除该用户吗？", "提示", {
      type: "warning",
    });
    const [error, res] = await deleteDictApi(row.dictCode);
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
  const api = isEdit.value ? updateDictApi : addDictApi;
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
        <label for="">字典名称：</label>
        <el-input
          clearable
          v-model="searchParams.dictLabel"
          placeholder="字典名称"
        />
      </div>
      <div class="search-item">
        <label for="">字典类型：</label>
        <el-select class="w-150" v-model="dictType" placeholder="请选择字典类型">
          <el-option
            v-for="item in dictTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
  </div>
</template>
