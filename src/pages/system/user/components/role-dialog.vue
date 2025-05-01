<script setup lang="tsx">
import { ref, watch, onMounted } from 'vue';
import { getRoleListApi, assignUserRolesApi } from '@/api/system';
import { ElMessage } from 'element-plus';
import type { ApiResponse } from "@/types/api";

interface Props {
  visible: boolean
  userId: string | number
  username: string
  userRoles?: any[] // 新增参数，传入用户角色数据
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(props.visible)
const roleList = ref<any[]>([])
const selectedRoles = ref<(string | number)[]>([])
const loading = ref(false)

// 监听visible属性变化
watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val && props.userId) {
    // 当对话框打开时，初始化用户角色
    initUserRoles()
  }
})

// 监听对话框状态变化
watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

// 获取角色列表
const getRoles = async () => {
  const [error, res] = await getRoleListApi({}) as [Error | null, ApiResponse]
  if (error) {
    ElMessage.error(error.message)
    return
  }
  if (res.code === 200) {
    const data = res.data.records || res.data
    roleList.value = data
  } else {
    ElMessage.error(res.message)
  }
}

// 初始化用户角色
const initUserRoles = () => {
  if (props.userRoles && Array.isArray(props.userRoles)) {
    // 提取角色ID
    selectedRoles.value = props.userRoles.map((role: any) => {
      if (typeof role === 'object') {
        return role.roleId || role.id
      }
      return role
    })
  } else {
    selectedRoles.value = []
  }
}

// 提交分配角色
const handleSubmit = async () => {
  loading.value = true
  try {
    const params = {
      userId: props.userId,
      roleIds: selectedRoles.value.map(id => id)
    }
    const [error, res] = await assignUserRolesApi(params) as [Error | null, ApiResponse]
    if (error) {
      ElMessage.error(error.message)
      return
    }
    if (res.code === 200) {
      ElMessage.success('角色分配成功')
      dialogVisible.value = false
      emit('success')
    } else {
      ElMessage.error(res.message)
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getRoles()
  // 初始化用户角色数据
  if (props.visible && props.userId) {
    initUserRoles()
  }
})
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="分配角色"
    width="500px"
    :close-on-click-modal="false"
  >
    <div v-loading="loading">
      <div class="user-info">
        <div class="label">用户账号：</div>
        <div class="value">{{ username }}</div>
      </div>
      
      <div class="role-list">
        <div class="title">可分配角色：</div>
        <el-checkbox-group v-model="selectedRoles">
          <template v-for="role in roleList" :key="role.id">
            <template v-if="role.roles && role.roles.length">
              <el-checkbox
                v-for="subRole in role.roles"
                :key="subRole.roleId"
                :label="subRole.roleId"
              >
                {{ subRole.roleName }}
              </el-checkbox>
            </template>
            <el-checkbox
              v-else
              :key="role.roleId || role.id"
              :label="role.roleId || role.id"
            >
              {{ role.roleName || role.name }}
            </el-checkbox>
          </template>
        </el-checkbox-group>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="dialogVisible = false" :disabled="loading">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.user-info {
  display: flex;
  margin-bottom: 20px;
}

.label {
  min-width: 80px;
  font-weight: bold;
}

.title {
  font-weight: bold;
  margin-bottom: 10px;
}

.role-list {
  margin-top: 15px;
}

.role-list .el-checkbox {
  margin-right: 15px;
  margin-bottom: 10px;
}
</style> 