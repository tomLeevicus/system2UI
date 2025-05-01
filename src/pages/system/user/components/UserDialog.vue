<script setup lang="tsx">
import { ref, watch } from 'vue';

interface Props {
  visible: boolean
  title: string
  formData: {
    username: string
    nickname: string
    mobile: string
    email: string
    gender: string
    status: boolean
    remark: string
    password: string
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
      <el-form-item label="用户账号">
        <el-input v-model="formData.username" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="用户昵称">
        <el-input v-model="formData.nickname" />
      </el-form-item>
      <el-form-item label="密码" v-if="!isEdit">
        <el-input v-model="formData.password" type="password" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="formData.mobile" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="formData.email" />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="formData.gender">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="formData.status" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="formData.remark" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template> 