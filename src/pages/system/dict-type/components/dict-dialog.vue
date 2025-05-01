<script setup lang="tsx">
import { ref, watch } from 'vue';

interface Props {
  visible: boolean
  title: string
  formData: {
    dictId?: number
    dictName: string
    dictType: string
    status: string
    remark: string
  }
  isEdit: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', formData: Props['formData']): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)

watch(() => props.visible, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

const handleSubmit = () => {
  emit('submit', props.formData)
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
  >
    <el-form :model="formData" label-width="100px">
      <el-form-item label="字典名称">
        <el-input v-model="formData.dictName" placeholder="请输入字典名称"/>
      </el-form-item>
      <el-form-item label="字典类型">
        <el-input v-model="formData.dictType" placeholder="请输入字典类型" :disabled="isEdit"/>
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
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template> 