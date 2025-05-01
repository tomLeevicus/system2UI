<script setup lang="tsx">
import { ref, onMounted } from "vue";
import { getMenuListApi, deleteMenuApi, updateMenuApi, getRoutersApi } from "@/api/system";
import { ElMessage } from "element-plus";
import type { ApiResponse } from "@/types/api";
import useTable from "@/components/global/gl-table-jsx/useTable";
import { resolveComponent, h } from "vue";
import MenuDialog from "./components/menu-dialog/index.vue";
import { usePermissionStore } from "@/store/modules/permission";
import { ElMessageBox } from "element-plus";

const { paginationConfig } = useTable();

const tableData = ref<any[]>([]);
const tableHeader = ref<any[]>([
  {
    label: "菜单名称",
    prop: "menuName",
    width: 180,
  },
  {
    label: "图标",
    prop: "icon",
    width: 100,
    render: ({ row }: { row: any }) => {
      const { icon } = row;
      const illegalIconList = ["#", "", "undefined"];
      if (illegalIconList.includes(icon)) {
        return icon;
      }
      return <gl-icon icon={icon} />;
      // return <i class={`el-icon-${icon}`}></i>
      // return (
      //   <el-icon>
      //     <i class={`el-icon-${icon}`}></i>
      //   </el-icon>
      // );
      // const IconComponent = h(resolveComponent(icon));
      // return (
      //   <>
      //     <el-icon>
      //       <IconComponent />
      //     </el-icon>
      //   </>
      // );
    },
  },
  {
    label: "排序",
    prop: "orderNum",
    width: 80,
  },
  {
    label: "权限标识",
    prop: "perms",
    width: 180,
  },
  {
    label: "路由地址",
    prop: "path",
    width: 180,
  },
  {
    label: "组件路径",
    prop: "component",
  },
  {
    label: "状态",
    prop: "status",
    render: ({ row }: { row: any }) => {
      return (
        <el-switch
          active-value={"1"}
          inactive-value={"0"}
          v-model={row.status}
          onChange={(newValue: string) => handleStatusChange(row, newValue)}
        />
      );
    },
    width: 80,
  },
  {
    label: "创建时间",
    prop: "createTime",
    width: 180,
  },
  {
    label: "操作",
    width: 180,
    fixed: "right",
    render: ({ row }: { row: any }) => {
      return (
        <>
          <el-button type="primary" link onClick={() => handleEdit(row)}>
            编辑
          </el-button>
          <el-button type="primary" link onClick={() => handleAdd(row)}>
            新增
          </el-button>
          <el-button type="danger" link onClick={() => handleDelete(row)}>
            删除
          </el-button>
        </>
      );
    },
  },
]);

const dialogProps = ref({
  visible: false,
  type: "add",
  data: null,
});

const searchParams = ref({
  menuName: "",
  status: "",
});

const search = async () => {
  const params = {
    ...searchParams.value,
    // menuName: "",
  };
  const [error, res] = (await getMenuListApi(params)) as [
    Error | null,
    ApiResponse
  ];
  if (error) {
    ElMessage.error(error.message);
    return;
  }
  const { data, code } = res;
  console.log(data, "====data");

  if (code !== 200) {
    ElMessage.error(data.message);
    return;
  }
  tableData.value = data;
};

onMounted(() => {
  search();
});

// 处理新增
const handleAdd = (row?: any) => {
  dialogProps.value = {
    visible: true,
    type: "add",
    data: row ? { parentId: row.menuId } : null,
  };
};

// 处理编辑
const handleEdit = (row: any) => {
  dialogProps.value = {
    visible: true,
    type: "edit",
    data: row,
  };
};

// 处理删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm("确认要删除该菜单吗？", "提示", {
      type: "warning",
    });
    await deleteMenuApi(row.menuId);
    ElMessage.success("删除成功");
    search();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除失败");
    }
  }
};

// 处理状态变更
const handleStatusChange = async (row: any, newValue: string) => {
  const statusBeforeChange = newValue === "1" ? "0" : "1";
  const permissionStore = usePermissionStore();

  console.log(`handleStatusChange called for row ID: ${row.menuId}. Attempting to set status to: ${newValue}`);

  try {
    await updateMenuApi({ menuId: row.menuId, status: newValue });
    ElMessage.success("状态更新成功");
    await permissionStore.generateRoutes();
    // 注意：v-model 已经将 row.status 更新为 newValue，所以本地状态已经是新的状态
  } catch (error: any) {
    ElMessage.error(error.message || "状态更新失败");
    // 如果 API 调用失败，将本地数据模型的状态恢复到改变前的状态
    row.status = statusBeforeChange;
  }
};

// 刷新数据
const handleSuccess = () => {
  search();
};
</script>

<template>
  <div class="menu-manage">
    <gl-base-header>
      <div class="search-item">
        <label for="">名称：</label>
        <el-input
          clearable
          v-model="searchParams.menuName"
          placeholder="菜单名称"
        />
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
      <el-button type="primary" @click="handleAdd">新增</el-button>
    </gl-base-header>
    <div class="table-content">
      <gl-table-jsx
        :tableData="tableData"
        :tableHeader="tableHeader"
        v-model:paginationConfig="paginationConfig"
        :isAutoPagination="false"
        row-key="menuId"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      ></gl-table-jsx>
    </div>

    <!-- 新增/编辑弹窗 -->
    <menu-dialog
      v-model:dialogProps="dialogProps"
      :menuOptions="tableData"
      @success="handleSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
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
</style>
