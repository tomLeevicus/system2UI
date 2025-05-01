<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 左侧个人信息 -->
      <el-col :span="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
            </div>
          </template>
          <div class="text-center">
            <div class="user-info-head">
              <img
                :src="user.avatar || defaultAvatar"
                class="img-circle img-lg"
              />
            </div>
          </div>
          <ul class="list-group list-group-striped">
            <li class="list-group-item">
              <div class="user-info-item">
                <span class="label">用户名称：</span>
                <span>{{ user.username }}</span>
              </div>
            </li>
            <li class="list-group-item">
              <div class="user-info-item">
                <span class="label">用户昵称：</span>
                <span>{{ user.nickname || "未设置" }}</span>
              </div>
            </li>
            <li class="list-group-item">
              <div class="user-info-item">
                <span class="label">手机号码：</span>
                <span>{{ user.mobile || "未设置" }}</span>
              </div>
            </li>
          </ul>
        </el-card>
      </el-col>

      <!-- 右侧修改密码 -->
      <el-col :span="16">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>修改密码</span>
            </div>
          </template>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="rules"
            label-width="100px"
          >
            <el-form-item label="原始密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                placeholder="请输入原始密码"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                placeholder="请输入新密码"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                placeholder="请确认新密码"
                type="password"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitPassword">保存</el-button>
              <el-button @click="resetPasswordForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getUserInfoApi, changePasswordApi } from "@/api/system";
import { ElMessage } from "element-plus";
import useUserStore from "@/store/user";
import type { FormInstance, FormRules } from 'element-plus';
import { useRouter } from 'vue-router';

// 从用户 store 获取数据
const userStore = useUserStore();
const router = useRouter();

// 默认头像
const defaultAvatar = ref("/src/assets/avatar.png");

// 用户信息对象 (简化版，只显示必要信息)
const user = reactive({
  username: "",
  nickname: "",
  avatar: "",
  mobile: "",
});

// 修改密码表单对象
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// 表单引用
const passwordFormRef = ref<FormInstance>();

// 新密码确认校验
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'));
  } else if (value !== passwordForm.newPassword) {
    callback(new Error("两次输入的新密码不一致!"));
  } else {
    callback();
  }
};

// 表单校验规则
const rules = reactive<FormRules>({
  oldPassword: [{ required: true, message: "原始密码不能为空", trigger: "blur" }],
  newPassword: [
    { required: true, message: "新密码不能为空", trigger: "blur" },
    { min: 6, max: 20, message: "长度在 6 到 20 个字符", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "确认新密码不能为空", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
});

// 获取当前用户信息 (恢复原有逻辑)
const getUserInfo = async () => {
  // 优先从 store 获取，如果 store 没有再请求 API
  if (userStore.userInfo && userStore.userInfo.user) { // 直接访问 userStore.userInfo.user
      initUserData(userStore.userInfo.user);
  } else {
      const [error, res] = await getUserInfoApi();
      if (error) {
          ElMessage.error("获取用户信息失败: " + error);
          return;
      }
      if (res && res.data) { // 直接访问 res.data.user
          userStore.updateUserInfo(res.data); // 更新 store
          initUserData(res.data.user); // 用 API 返回的数据初始化
      } else {
          // 保持原有错误信息
          ElMessage.error("获取用户信息失败：响应数据无效或缺少用户信息");
      }
  }
};


// 初始化用户数据到组件状态
const initUserData = (storeUser: any) => { // 明确参数类型或使用 any
  if (storeUser) {
    Object.assign(user, {
      username: storeUser.username || "",
      nickname: storeUser.nickname || "",
      avatar: storeUser.avatar || defaultAvatar.value, // 使用默认头像
      mobile: storeUser.mobile || "",
    });
  } else {
     console.warn("用户数据在 initUserData 期间未找到");
     // 可以设置默认值或加载状态
     Object.assign(user, { username: "加载中...", nickname: "", avatar: defaultAvatar.value, mobile: "" });
  }
};


// 提交密码修改
const submitPassword = () => {
  // 恢复 validate 回调为 async (如果这是原有逻辑)
  passwordFormRef.value?.validate(async (valid: boolean) => { 
    if (valid) {
      // 获取用户ID (恢复原有逻辑，可能带 linter 警告)
      const userId = userStore.userInfo?.user?.id;
      if (!userId) {
        ElMessage.error("无法获取用户ID，请重新登录后再试");
        return;
      }

      // API 调用逻辑保持不变
      const performSubmit = async () => { 
        try {
          const params = {
            id: userId,
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword,
          };
          const [error, res] = await changePasswordApi(params);
          
          if (error) {
            console.error("修改密码 API 请求失败", error);
            return; 
          }

          if (res && res.code === 200) {
            ElMessage.success("密码修改成功，请重新登录");
            // resetPasswordForm(); // 清空表单意义不大，因为马上要跳转
            // 清除 session 数据并跳转到登录页
            try {
              await userStore.logout(); // 调用 store 中的 logout 方法
              router.push('/login');   // 跳转到登录页
            } catch (e) {
              console.error("退出登录或跳转时出错:", e);
              ElMessage.error("处理退出登录时出错，请手动刷新或重新登录");
            }
          } else {
            ElMessage.error(res?.message || "密码修改失败");
          }
        } catch (err) {
          console.error("修改密码操作异常", err);
          ElMessage.error("修改密码操作失败");
        }
      };
      performSubmit();

    } else {
      console.log('表单验证失败');
    }
  });
};

// 重置密码表单
const resetPasswordForm = () => {
  passwordFormRef.value?.resetFields();
};

// 页面加载时获取用户信息
onMounted(() => {
  getUserInfo();
});
</script>

<style scoped>
/* 复用 profile 页面的样式 */
.app-container {
  padding: 20px;
}

.text-center {
  text-align: center;
}

.user-info-head {
  position: relative;
  margin: 20px auto;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.img-circle {
  border-radius: 50%;
}

.img-lg {
  width: 100px;
  height: 100px;
}

.list-group {
  padding-left: 0;
  margin-bottom: 0;
}

.list-group-item {
  position: relative;
  display: block;
  padding: 10px 0;
  margin-bottom: -1px;
  border-bottom: 1px solid #e8eaec;
}

.list-group-striped .list-group-item:nth-child(odd) {
  background: #f8f8f8;
}

.user-info-item {
  display: flex;
  padding: 0 15px; /* 给列表项增加一些内边距 */
}

.user-info-item .label {
  width: 100px;
  font-weight: bold;
  flex-shrink: 0; /* 防止 label 被压缩 */
}

.card-header {
  font-weight: bold;
  color: #333;
  font-size: 16px;
}
</style> 