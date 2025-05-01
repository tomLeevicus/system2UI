<script setup lang="tsx">
import { ref, computed } from "vue";
import type { FormInstance } from "element-plus";

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

const props = defineProps<{
  visible: boolean;
  title: string;
  formData: DepartmentForm;
  parentDeptName: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  submit: [formData: DepartmentForm];
  close: [];
}>();

const formRef = ref<FormInstance>();

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

// 计算属性处理 visible
const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  },
});

// 提交表单
const submitForm = async () => {
  console.log(props.formData);

  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      emit("submit", props.formData);
    }
  });
};

// 关闭对话框
const handleClose = () => {
  emit("close");
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(value: boolean) => emit('update:visible', value)"
    :title="title"
    width="500px"
    destroy-on-close
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item v-if="parentDeptName" label="上级部门">
        <el-input :model-value="parentDeptName" disabled />
      </el-form-item>
      <el-form-item label="部门名称" prop="deptName">
        <el-input v-model="formData.deptName" placeholder="请输入部门名称" />
      </el-form-item>
      <el-form-item label="显示排序" prop="orderNum">
        <el-input-number v-model="formData.orderNum" :min="0" />
      </el-form-item>
      <el-form-item label="负责人" prop="leader">
        <el-input v-model="formData.leader" placeholder="请输入负责人" />
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="部门状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio label="0">正常</el-radio>
          <el-radio label="1">停用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="submitForm">确定</el-button>
    </template>
  </el-dialog>
</template>
