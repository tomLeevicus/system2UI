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
    avatar: string
  }
  isEdit: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', formData: Props['formData']): void
  (e: 'upload-avatar', file: File): void
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

const handleAvatarUpload = (file: File) => {
  emit('upload-avatar', file)
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="500px"
  >
    <el-form :model="formData" label-width="100px">
      <el-form-item label="用户头像">
        <el-upload
          class="avatar-uploader"
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="(file) => handleAvatarUpload(file.raw)"
        >
          <img v-if="formData.avatar" :src="formData.avatar" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="用户账号">
        <el-input v-model="formData.username" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="用户昵称">
        <el-input v-model="formData.nickname" />
      </el-form-item>
      <!-- <el-form-item label="密码" v-if="!isEdit">
        <el-input v-model="formData.password" type="password" />
      </el-form-item> -->
      <el-form-item label="手机号">
        <el-input v-model="formData.mobile" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="formData.email" />
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="formData.gender">
          <el-option label="男" value="1" />
          <el-option label="女" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch :active-value="'1'" :inactive-value="'0'" v-model="formData.status" />
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

<style scoped>
.avatar-uploader {
  width: 178px;
  height: 178px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style> 