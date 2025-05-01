<script setup lang="tsx">
import { ref, onMounted } from "vue";
import { getRoleListApi, deleteRoleApi } from "@/api/system";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ApiResponse } from "@/types/api";
import RoleForm from "./components/RoleForm.vue";
import useTable from "@/components/global/gl-table-jsx/useTable";

const { paginationConfig } = useTable();
console.log(paginationConfig, "=====paginationConfigddddddddd");

const tableData = ref<any[]>([]);
const tableHeader = ref<any[]>([
  {
    label: "角色名称",
    prop: "roleName",
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
    label: "角色key",
    prop: "roleKey",
  },
  {
    label: "角色状态",
    prop: "status",
    render: ({ row }: { row: any }) => {
      // return row.status === 1 ? "正常" : "停用";
      return (
        <el-switch
          active-value={1}
          inactive-value={0}
          v-model={row.status}
        />
      );
    },
  },
  {
    label: "操作",
    width: "200",
    // slot: "operation",
    render: ({ row }: { row: any }) => {
      return (
        <>
          <el-button type="primary" link onClick={() => handleEdit(row)}>
            编辑
          </el-button>
          <el-button type="danger" link onClick={() => handleDelete(row)}>
            删除
          </el-button>
        </>
      );
    },
  },
]);

const searchParams = ref({
  roleName: "",
  status: "",
});

const search = async () => {
  const params = {
    ...searchParams.value,
    pageNum: 1,
    pageSize: 10,
  };
  const [error, res] = (await getRoleListApi(params)) as [
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
  console.log(data.records, "===records");

  tableData.value = data?.records;
};
onMounted(() => {
  search();
});

const dialogVisible = ref(false);
const dialogType = ref("add");
const currentRow = ref({});

const handleAdd = () => {
  dialogType.value = "add";
  currentRow.value = {};
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  dialogType.value = "edit";
  currentRow.value = {
    roleId: row.roleId,
    roleName: row.roleName,
    roleKey: row.roleKey,
    remark: row.remark,
    roleSort: row.roleSort,
    menuIds: row.menuIds || [],
  };
  dialogVisible.value = true;
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm("确认删除该角色吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    // TODO: 调用删除API
    const [error, res] = (await deleteRoleApi(row.roleId)) as [
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
    ElMessage.success("删除成功");
    search();
  });
};

const handleSuccess = () => {
  search();
};
</script>

<template>
  <div class="menu-manage">
    <gl-base-header>
      <div class="search-item">
        <label for="">角色名称：</label>
        <el-input
          clearable
          v-model="searchParams.roleName"
          placeholder="角色名称"
          class="w-150"
        />
      </div>
      <div class="search-item">
        <label for="">状态：</label>
        <el-select class="w-100" v-model="searchParams.status" placeholder="请选择">
          <el-option label="正常" value="1" />
          <el-option label="停用" value="0" />
        </el-select>
      </div>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button type="primary" @click="handleAdd">新增</el-button>
    </gl-base-header>
    <div class="table-content">
      <gl-table-jsx
        :tableData="tableData"
        :tableHeader="tableHeader"
        v-model:paginationConfig="paginationConfig"
      >
        <!-- <template #operation="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button type="danger" link @click="handleDelete(row)">
            删除
          </el-button>
        </template> -->
      </gl-table-jsx>
    </div>

    <role-form
      v-model:visible="dialogVisible"
      :type="dialogType"
      :row-data="currentRow"
      @success="handleSuccess"
    />
  </div>
</template>
