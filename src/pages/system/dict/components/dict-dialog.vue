<script setup lang="tsx">
import { ref, watch, onMounted, reactive } from "vue";
import { getDictTypeListApi } from "@/api/system";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

interface Props {
  visible: boolean;
  title: string;
  formData: {
    dictId?: number;
    dictLabel: string;
    dictType: string;
    status: string;
    remark: string;
  };
  isEdit: boolean;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "submit", formData: Props["formData"]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialogVisible = ref(props.visible);
const dictTypeOptions = ref<{ label: string; value: string }[]>([]);
const loading = ref(false);
const formRef = ref<FormInstance>();

// 表单验证规则
const rules = reactive<FormRules>({
  dictLabel: [
    { required: true, message: "请输入字典名称", trigger: "blur" },
    { required: true, trigger: "blur" },
  ],
  dictType: [{ required: true, message: "请选择字典类型", trigger: "change" }],
});

// 获取字典类型列表
const getDictTypeOptions = async () => {
  if (props.isEdit) return; // 如果是编辑模式，不需要重新获取

  loading.value = true;
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
    loading.value = false;
  }
};

onMounted(() => {
  getDictTypeOptions();
});

watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val;
    // 当对话框打开时，重新获取字典类型选项
    if (val) {
      getDictTypeOptions();
    }
  }
);

watch(dialogVisible, (val) => {
  emit("update:visible", val);
});

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    emit("submit", props.formData);
  } catch (error) {
    console.error("表单验证失败", error);
  }
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      status-icon
    >
      <el-form-item label="字典名称" prop="dictLabel">
        <el-input v-model="formData.dictLabel" placeholder="请输入字典名称" />
      </el-form-item>
      <el-form-item label="字典类型" prop="dictType">
        <el-select
          v-model="formData.dictType"
          placeholder="请选择字典类型"
          :disabled="props.isEdit"
          style="width: 100%"
          filterable
          :loading="loading"
          clearable
        >
          <el-option
            v-for="item in dictTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch
          :active-value="'1'"
          :inactive-value="'0'"
          v-model="formData.status"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="formData.remark"
          type="textarea"
          placeholder="请输入内容"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading"
        >确定</el-button
      >
    </template>
  </el-dialog>
</template>
