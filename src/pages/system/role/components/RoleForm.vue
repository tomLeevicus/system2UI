<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import type { FormInstance } from "element-plus";
import { ElMessage } from "element-plus";
import type { PropType } from "vue";
import { useVModel } from "@vueuse/core";
import {
  addRoleApi,
  updateRoleApi,
  getMenuListApi,
  assignRoleMenusApi,
} from "@/api/system";

interface RoleForm {
  roleId?: number | string;
  roleName: string;
  roleKey: string;
  remark: string;
  roleSort: string;
  menuIds: string | number[];
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "add",
  },
  rowData: {
    type: Object as PropType<Partial<RoleForm>>,
    default: () => ({}),
  },
});

const emit = defineEmits(["update:visible", "success"]);
const selfVisible = useVModel(props, "visible");

const formRef = ref<FormInstance>();
const form = ref<RoleForm>({
  roleName: "",
  roleKey: "",
  remark: "",
  roleSort: "",
  menuIds: [],
});

const rules = {
  roleName: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  roleKey: [{ required: true, message: "请输入角色标识", trigger: "blur" }],
};

const menuTreeData = ref([]);
const menuTreeLoading = ref(false);
const treeRef = ref();

// 添加选中节点的处理方法
const handleCheck = async (nodes: any, { checkedKeys }: any) => {
  form.value.menuIds = treeRef.value.getCheckedKeys();
  const params = {
    roleId: form.value.roleId,
    menuIds: form.value.menuIds,
  };
  const [error, res] = await assignRoleMenusApi(params);
  if (error) {
    ElMessage.error(error.message);
    return;
  }
  ElMessage.success("分配成功");
};

// 添加默认展开所有节点
const defaultExpandAll = ref(true);

watch(
  () => props.rowData,
  async (val) => {
    if (val && Object.keys(val).length > 0) {
      form.value = {
        roleId: val.roleId,
        roleName: val.roleName || "",
        roleKey: val.roleKey || "",
        remark: val.remark || "",
        roleSort: val.roleSort || "",
        menuIds: val.menuIds || [],
      };

      // 等待下一个 tick，确保树组件已经渲染
      await nextTick();
      // 设置选中的节点
      if (treeRef.value && form.value.menuIds.length) {
        treeRef.value.setCheckedKeys(form.value.menuIds);
      }
    } else {
      form.value = {
        roleName: "",
        roleKey: "",
        remark: "",
        roleSort: "",
        menuIds: [],
      };
    }
  },
  { immediate: true, deep: true }
);

const handleClose = () => {
  selfVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      console.log(form, "form=====form");

      if (props.type === "add") {
        await addRoleApi(form.value);
      } else {
        await updateRoleApi(form.value);
      }
      emit("success");
      handleClose();
    }
  });
};

// 获取菜单树数据
const getMenuTree = async () => {
  menuTreeLoading.value = true;
  try {
    const [error, res] = await getMenuListApi({});
    if (!error && res.code === 200) {
      menuTreeData.value = res.data;
    }
  } finally {
    menuTreeLoading.value = false;
  }
};

// 在 onMounted 中调用
onMounted(() => {
  getMenuTree();
});
</script>

<template>
  <el-dialog
    :title="type === 'add' ? '新增角色' : '编辑角色'"
    v-model="selfVisible"
    width="500px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="角色名称" prop="roleName">
        <el-input v-model="form.roleName" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="角色标识" prop="roleKey">
        <el-input v-model="form.roleKey" placeholder="请输入角色标识" />
      </el-form-item>
      <el-form-item label="角色排序" prop="roleSort">
        <el-input v-model="form.roleSort" placeholder="请输入角色排序" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          placeholder="请输入备注"
        />
      </el-form-item>
      <el-form-item label="菜单权限">
        <div class="tree-content">
          <el-tree
            ref="treeRef"
            :data="menuTreeData"
            show-checkbox
            node-key="menuId"
            :props="{
              label: 'menuName',
              children: 'children',
            }"
            :loading="menuTreeLoading"
            @check="handleCheck"
          />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.tree-content {
  width: 100%;
  height: 300px;
  overflow-y: auto;
}
</style>
