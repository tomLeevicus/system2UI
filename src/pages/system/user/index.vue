<script setup lang="tsx">
import { ref, onMounted } from "vue";
import {
  getUserListApi,
  addUserApi,
  updateUserApi,
  deleteUserApi,
  assignUserToDeptApi,
} from "@/api/system";
import { ElMessage, ElMessageBox } from "element-plus";
import type { ApiResponse } from "@/types/api";
import UserDialog from "./components/user-dialog.vue";
import RoleDialog from "./components/role-dialog.vue";
import DeptAssignDialog from './components/DeptAssignDialog.vue'; // 导入分配部门对话框组件
// 导入头像上传API
import httpInstance from "@/utils/http";

// 头像上传API函数
const uploadAvatarApi = (file: File) => {
  console.log(file,'=======file');
  
  const formData = new FormData();
  formData.append('file', file);
  return httpInstance.post("/system/userInfo/uploadAvatar", formData);
};

const tableData = ref<any[]>([]);
const tableHeader = ref<any[]>([
  {
    label: "用户ID",
    prop: "id",
  },
  {
    label: "用户账号",
    prop: "username",
  },
  {
    label: "用户昵称",
    prop: "nickname",
  },
  {
    label: "头像",
    prop: "avatar",
    render: ({ row }: { row: any }) => {
      if (!row.avatar) {
        return "/";
      }
      return <el-image src={row.avatar} style="width: 50px; height: 50px; border-radius: 50%;" />;
    },
  },
  {
    label: "手机号",
    prop: "mobile",
  },
  {
    label: "邮箱",
    prop: "email",
  },
  {
    label: "性别",
    prop: "gender",
    render: ({ row }: { row: any }) => {
      enum Gender {
        "男" = 0,
        "女" = 1,
        "未知" = 2,
      }
      return Gender[row.gender];
    },
  },
  {
    label: "禁用",
    prop: "status",
    render: ({ row }: { row: any }) => {
      return (
        <el-switch active-value="1" inactive-value="0" v-model={row.status} />
      );
    },
  },
  {
    label: "创建时间",
    prop: "createTime",
  },
  {
    label: "备注",
    prop: "remark",
  },
  {
    label: "操作",
    prop: "operation",
    width: 350,
    render: ({ row }: { row: any }) => {
      return (
        <>
          <el-button type="primary" onClick={() => handleEdit(row)}>
            编辑
          </el-button>
          <el-button type="primary" onClick={() => handleAssignRole(row)}>
            分配角色
          </el-button>
          <el-button type="warning" onClick={() => handleAssignDept(row)}>
            分配部门
          </el-button>
          <el-button type="danger" onClick={() => handleDelete(row)}>
            删除
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
  const [error, res] = (await getUserListApi(params)) as [
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
  nickname: "",
  mobile: "",
});

// 添加表单对话框相关数据
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formData = ref({
  username: "",
  nickname: "",
  mobile: "",
  email: "",
  gender: "",
  status: true,
  remark: "",
  password: "", // 新增时需要密码
  avatar: "",   // 添加头像字段
});

// 角色分配对话框相关数据
const roleDialogVisible = ref(false);
const currentUser = ref<{
  id: string | number;
  username: string;
  roles?: any[];
}>({
  id: "",
  username: "",
  roles: []
});

// 分配部门对话框相关数据
const deptAssignDialogVisible = ref(false);
const currentUserForDeptAssign = ref<{ id: string | number; username: string }>({ id: "", username: "" });

const isEdit = ref(false);

onMounted(() => {
  search();
});

// 打开新增对话框
const handleAdd = () => {
  dialogTitle.value = "新增用户";
  dialogVisible.value = true;
  isEdit.value = false;
  formData.value = {
    username: "",
    nickname: "",
    mobile: "",
    email: "",
    gender: "",
    status: true,
    remark: "",
    password: "",
    avatar: "", // 添加头像字段
  };
};

// 打开编辑对话框
const handleEdit = (row: any) => {
  dialogTitle.value = "编辑用户";
  dialogVisible.value = true;
  isEdit.value = true;
  formData.value = { ...row };
};

// 打开角色分配对话框
const handleAssignRole = (row: any) => {
  roleDialogVisible.value = true;
  currentUser.value = {
    id: row.id,
    username: row.username,
    roles: row.roles || []
  };
};

// 打开分配部门对话框
const handleAssignDept = (row: any) => {
  currentUserForDeptAssign.value = { id: row.id, username: row.username };
  deptAssignDialogVisible.value = true;
  // 在这里可以加载部门树数据
};

// 处理删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm("确认删除该用户吗？", "提示", {
      type: "warning",
    });
    const [error, res] = await deleteUserApi(row.id);
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

// 处理头像上传
const handleUploadAvatar = async (file: File) => {
  console.log(file,'====file');
  
  try {
    const [error, res] = await uploadAvatarApi(file);
    if (error) {
      ElMessage.error(error.message);
      return;
    }
    if (res.code === 200) {
      ElMessage.success("头像上传成功");
      formData.value.avatar = res.data; // 假设返回的是头像URL
    } else {
      ElMessage.error(res.message || "上传失败");
    }
  } catch (err) {
    ElMessage.error("上传过程发生错误");
  }
};

// 处理分配部门提交
const handleDeptAssignSubmit = async (deptId: number | string) => {
  if (!deptId) {
    ElMessage.warning("请选择一个部门");
    return;
  }
  const params = {
    deptId: deptId,
    userIds: [currentUserForDeptAssign.value.id], // 后端接收的是用户ID列表
  };
  const [error, res] = await assignUserToDeptApi(params);
  if (error) {
    ElMessage.error(error.message);
    return;
  }
  if (res.code === 200) {
    ElMessage.success("部门分配成功");
    deptAssignDialogVisible.value = false;
    // 可以选择重新调用 search() 刷新列表，如果需要显示用户的部门信息
    // search(); 
  } else {
    ElMessage.error(res.message);
  }
};

// 提交表单
const handleSubmit = async (formData: any) => {
  const api = isEdit.value ? updateUserApi : addUserApi;
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
        <label for="">账号：</label>
        <el-input
          clearable
          v-model="searchParams.username"
          placeholder="用户账号"
        />
      </div>
      <div class="search-item">
        <label for="">昵称：</label>
        <el-input
          clearable
          v-model="searchParams.nickname"
          placeholder="用户昵称"
        />
      </div>
      <div class="search-item">
        <label for="">手机号：</label>
        <el-input
          clearable
          v-model="searchParams.mobile"
          placeholder="用户手机号"
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
    <user-dialog
      v-model:visible="dialogVisible"
      :title="dialogTitle"
      :form-data="formData"
      :is-edit="isEdit"
      @submit="handleSubmit"
      @upload-avatar="handleUploadAvatar"
    />

    <!-- 角色分配对话框 -->
    <role-dialog
      v-model:visible="roleDialogVisible"
      :userId="currentUser.id"
      :username="currentUser.username"
      :userRoles="currentUser.roles"
      @success="search"
    />

    <!-- 分配部门对话框 -->
    <dept-assign-dialog
      v-model:visible="deptAssignDialogVisible"
      :user-id="currentUserForDeptAssign.id"
      :username="currentUserForDeptAssign.username"
      @submit="handleDeptAssignSubmit"
    /> 
  </div>
</template>
