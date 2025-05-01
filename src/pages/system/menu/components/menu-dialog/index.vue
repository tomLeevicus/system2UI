<template>
  <el-dialog
    :title="dialogProps.type === 'add' ? '新增菜单' : '编辑菜单'"
    v-model="dialogVisible"
    width="500px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="上级菜单">
        <el-tree-select
          v-model="formData.parentId"
          :data="menuOptions"
          placeholder="选择上级菜单"
          check-strictly
          :props="{
            label: 'menuName',
            value: 'menuId',
            children: 'children',
          }"
        />
      </el-form-item>
      <el-form-item label="菜单类型" prop="menuType">
        <el-radio-group v-model="formData.menuType">
          <el-radio-button label="M">目录</el-radio-button>
          <el-radio-button label="C">菜单</el-radio-button>
          <el-radio-button label="F">按钮</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="菜单名称" prop="menuName">
        <el-input v-model="formData.menuName" placeholder="请输入菜单名称" />
      </el-form-item>
      <el-form-item label="图标" prop="icon">
        <div style="display: flex; align-items: center">
          <gl-icon
            :icon="formData.icon || 'el-icon-star-on'"
            style="margin-right: 8px"
          />
          <el-popover
            :visible="iconPopoverVisible"
            placement="bottom"
            @close="iconPopoverVisible = false"
            width="400px"
          >
            <template #reference>
              <el-button type="text" @click="toggleIconPopover"
                >选择图标</el-button
              >
            </template>
            <div class="icon-list">
              <div
                v-for="icon in iconList"
                :key="icon.value"
                @click="selectIcon(icon.value)"
                style="
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  border: 1px solid #dcdfe6;
                  border-radius: 4px;
                  padding: 4px;
                  width: 60px;
                  justify-content: center;
                "
              >
                <gl-icon :icon="icon.value" />
              </div>
            </div>
          </el-popover>
        </div>
      </el-form-item>
      <el-form-item label="排序" prop="orderNum">
        <el-input-number v-model="formData.orderNum" :min="0" />
      </el-form-item>
      <el-form-item label="权限标识" prop="perms">
        <el-input v-model="formData.perms" placeholder="请输入权限标识" />
      </el-form-item>
      <el-form-item label="路由地址" prop="path">
        <el-input v-model="formData.path" placeholder="请输入路由地址" />
      </el-form-item>
      <el-form-item label="组件路径" prop="component">
        <el-input v-model="formData.component" placeholder="请输入组件路径" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio label="1">启用</el-radio>
          <el-radio label="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <!-- <el-form-item label="是否是菜单" prop="menu">
        <el-radio-group v-model="formData.menu">
          <el-radio :label="true">是</el-radio>
          <el-radio :label="false">否</el-radio>
        </el-radio-group>
      </el-form-item> -->
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { addMenuApi, updateMenuApi } from "@/api/system";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
console.log(ElementPlusIconsVue, "====ElementPlusIconsVue");

const props = defineProps({
  dialogProps: {
    type: Object,
    default: () => ({
      visible: false,
      type: "add", // 'add' | 'edit'
      data: null,
    }),
  },
  menuOptions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:dialogProps", "success"]);

const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const iconPopoverVisible = ref(false); // 控制图标选择弹窗的显示

// 表单数据
const formData = ref<any>({
  parentId: 0,
  menuName: "",
  icon: "",
  orderNum: 0,
  perms: "",
  path: "",
  component: "",
  status: "1",
  menu: true,
  menuType: "M",
});

// 图标列表
// const iconList = [
//   "el-icon-star-on",
//   "el-icon-star-off",
//   "el-icon-s-tools",
//   "el-icon-s-order",
//   "el-icon-s-claim",
//   "el-icon-s-custom",
//   // 添加更多图标...
// ];
const iconList = Object.entries(ElementPlusIconsVue).map(([key, value]) => ({
  label: key,
  value: key,
}));

// 表单校验规则
const rules = {
  menuName: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  path: [{ required: true, message: "请输入路由地址", trigger: "blur" }],
  component: [{ required: true, message: "请输入组件路径", trigger: "blur" }],
};

// 监听弹窗显示状态
watch(
  () => props.dialogProps.visible,
  (newVal) => {
    dialogVisible.value = newVal;
    console.log(props.dialogProps.data, "=====props.dialogProps.data");
    if (newVal && props.dialogProps.type === "edit") {
      // 编辑时填充表单数据
      Object.assign(formData.value, props.dialogProps.data);
      formData.value.parentId = props.dialogProps.data.parentId;
    }
    if (newVal && props.dialogProps.type === "add") {
      formData.value.parentId = props.dialogProps.data.parentId;
    }
    if (formData.value.parentId == 0) {
      formData.value.parentId = null;
    }
    console.log(formData.value, "=====formData.value");
  }
);

// 关闭弹窗
const handleClose = () => {
  emit("update:dialogProps", { ...props.dialogProps, visible: false });
  formRef.value?.resetFields();
  formData.value = {
    menuType: "M",
    parentId: 0,
    menuName: "",
    icon: "",
    orderNum: 0,
    perms: "",
    path: "",
    component: "",
    status: "1",
    menu: true,
  };
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (props.dialogProps.type === "add") {
          const [error, res] = await addMenuApi(formData.value);
          if (error) {
            ElMessage.error(error.message);
            return;
          }
          if (res.code == 200) {
            ElMessage.success("添加成功");
          }
        } else {
          const [error, res] = await updateMenuApi({
            ...formData.value,
            menuId: props.dialogProps.data?.menuId,
          });
          if (error) {
            ElMessage.error(error.message);
            return;
          }
          if (res.code == 200) {
            ElMessage.success("修改成功");
          }
        }
        emit("success");
        handleClose();
      } catch (error: any) {
        ElMessage.error(error.message || "操作失败");
      }
    }
  });
};

// 处理图标选择变化
const selectIcon = (icon: string) => {
  formData.value.icon = icon;
  iconPopoverVisible.value = false; // 选择后关闭弹窗
};

// 切换图标选择弹窗的显示状态
const toggleIconPopover = () => {
  iconPopoverVisible.value = !iconPopoverVisible.value;
};
</script>

<style scoped>
.dialog-footer {
  padding: 20px 0 0;
  text-align: right;
}
.icon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
