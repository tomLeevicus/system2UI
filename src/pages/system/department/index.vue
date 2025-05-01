<script setup lang="tsx">
import { ref, onMounted, h } from "vue";
import DepartmentDialog from "./components/DepartmentDialog.vue";
import {
  getDepartmentListApi,
  addDepartmentApi,
  updateDepartmentApi,
  deleteDepartmentApi,
} from "@/api/system";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ApiResponse } from "@/types/api";

interface DepartmentForm {
  deptId?: number;
  deptName: string;
  orderNum: number;
  leader: string;
  phone: string;
  email: string;
  status: string;
  parentId: number;
  remark: string;
}

// 表格数据
const tableData = ref<any[]>([]);

// 弹窗控制
const dialogVisible = ref(false);
const dialogTitle = ref("新增部门");

// 表单数据
const formData = ref<DepartmentForm>({
  deptName: "",
  orderNum: 0,
  leader: "",
  phone: "",
  email: "",
  status: "0",
  parentId: 0,
  remark: "",
});

// 添加父部门名称的引用
const parentDeptName = ref("");

const deptName = ref("");

// 表单规则
const rules = {
  deptName: [{ required: true, message: "请输入部门名称", trigger: "blur" }],
  orderNum: [{ required: true, message: "请输入排序号", trigger: "blur" }],
  leader: [{ required: true, message: "请输入负责人", trigger: "blur" }],
  phone: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
  email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }],
};

const formRef = ref();

const tableHeader = ref([
  {
    label: "部门名称",
    prop: "deptName",
  },
  {
    label: "排序",
    prop: "orderNum",
    width: 80,
  },
  {
    label: "负责人",
    prop: "leader",
    width: 120,
  },
  {
    label: "联系电话",
    prop: "phone",
    width: 120,
  },
  {
    label: "邮箱",
    prop: "email",
    width: 180,
  },
  {
    label: "状态",
    prop: "status",
    width: 100,
    render: (row: any) => {
      // return row.status === "0" ? "正常" : "停用";
      return (
        <el-switch
          active-value={"1"}
          inactive-value={"0"}
          v-model={row.status}
        />
      );
    },
  },
  {
    label: "创建时间",
    prop: "createTime",
    width: 180,
  },
  {
    label: "操作",
    prop: "action",
    width: 200,
    fixed: "right",
    render: ({ row }: { row: any }) => {
      return (
        <>
          <el-button type="primary" link onClick={() => handleAdd(row.deptId)}>
            新增
          </el-button>
          <el-button type="primary" link onClick={() => handleEdit(row)}>
            编辑
          </el-button>
          <el-button
            type="danger"
            link
            onClick={() => handleDelete(row.deptId)}
          >
            删除
          </el-button>
        </>
      );
    },
  },
]);

const searchParams = ref({
  deptName: "",
  status: "",
  leader: "",
});

// 查询部门列表
const search = async () => {
  const params = {
    ...searchParams.value,
  };
  const [error, res] = (await getDepartmentListApi(params)) as [
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
  tableData.value = data;
};

// 添加一个查找部门的辅助函数
const findDepartment = (deptId: number, departments: any[]): any => {
  for (const dept of departments) {
    if (dept.deptId === deptId) {
      return dept;
    }
    if (dept.children) {
      const found = findDepartment(deptId, dept.children);
      if (found) return found;
    }
  }
  return null;
};

// 重置表单
const resetForm = () => {
  formData.value = {
    deptName: "",
    orderNum: 0,
    leader: "",
    phone: "",
    email: "",
    status: "0",
    parentId: 0,
    remark: "",
  };
  parentDeptName.value = "";
};

// 打开新增对话框
const handleAdd = (parentId = 0) => {
  dialogTitle.value = "新增部门";
  resetForm();
  formData.value.parentId = parentId;

  if (parentId) {
    const parent = findDepartment(parentId, tableData.value);
    parentDeptName.value = parent ? parent.deptName : "";
  }

  dialogVisible.value = true;
};

// 打开编辑对话框
const handleEdit = (row: any) => {
  dialogTitle.value = "编辑部门";
  formData.value = { ...row };

  if (row.parentId) {
    const parent = findDepartment(row.parentId, tableData.value);
    parentDeptName.value = parent ? parent.deptName : "";
  } else {
    parentDeptName.value = "";
  }

  dialogVisible.value = true;
};

// 处理表单提交
const handleSubmit = async (formData: DepartmentForm) => {
  console.log(formData.parentId, dialogTitle.value);
  console.log(formData.parentId && dialogTitle.value !== "新增部门");

  const api =
    formData.parentId && dialogTitle.value !== "新增部门"
      ? updateDepartmentApi
      : addDepartmentApi;
  const [error, res] = await api(formData);

  if (error) {
    ElMessage.error(error.message);
    return;
  }

  if (res.code === 200) {
    ElMessage.success(`${formData.deptId ? "更新" : "新增"}成功`);
    dialogVisible.value = false;
    search();
  }
};

// 删除部门
const handleDelete = async (deptId: number) => {
  try {
    await ElMessageBox.confirm("确认要删除该部门吗？", "提示", {
      type: "warning",
    });
    const [error, res] = await deleteDepartmentApi(deptId);

    if (error) {
      ElMessage.error(error.message);
      return;
    }
    const { message } = res;
    ElMessage.success(message);
    search();
  } catch (error) {
    console.log(error, "=====error");
  }
};

onMounted(() => {
  search();
});
</script>

<template>
  <div class="menu-manage">
    <gl-base-header>
      <div class="search-item">
        <label for="deptName">部门名称：</label>
        <el-input
          id="deptName"
          v-model="deptName"
          placeholder="请输入部门名称"
        />
      </div>
      <div class="search-item">
        <label for="leader">负责人：</label>
        <el-input id="leader" v-model="leader" placeholder="请输入负责人" />
      </div>
      <div class="search-item">
        <label for="">状态：</label>
        <el-select
          class="w-100"
          v-model="searchParams.status"
          placeholder="请选择"
        >
          <el-option label="正常" value="1" />
          <el-option label="停用" value="0" />
        </el-select>
      </div>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button type="primary" @click="() => handleAdd(0)">新增</el-button>
    </gl-base-header>

    <div class="table-content">
      <gl-table-jsx
        :tableData="tableData"
        :tableHeader="tableHeader"
        row-key="deptId"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      ></gl-table-jsx>
    </div>

    <!-- 使用抽离的对话框组件 -->
    <department-dialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :form-data="formData"
      :parent-dept-name="parentDeptName"
      @submit="handleSubmit"
      @close="resetForm"
    />
  </div>
</template>

<style scoped>
.search-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: normal;
  label {
    flex-shrink: 0;
  }
}
.menu-manage {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .table-content {
    flex: 1;
    overflow-y: auto;
  }
}
.table-action {
  display: flex;
  gap: 8px;
}
</style>
