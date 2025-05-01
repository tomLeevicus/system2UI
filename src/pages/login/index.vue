<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { User, Lock, Key } from "@element-plus/icons-vue";
import { loginApi, getCaptchaApi } from "@/api/auth";
import useUserStore from "@/store/user";
import { useRouter } from "vue-router";
const router = useRouter();
const userStore = useUserStore();
const loginForm = ref({
  username: "",
  password: "",
  code: "",
  uuid: ""
});

const captchaImg = ref("");
const loginFormRef = ref<FormInstance>();

const rules = ref<FormRules>({
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      min: 3,
      max: 20,
      message: "用户名长度应在 3 到 20 个字符之间",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    {
      min: 6,
      max: 20,
      message: "密码长度应在 6 到 20 个字符之间",
      trigger: "blur",
    },
  ],
  code: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { min: 4, max: 6, message: "验证码长度不正确", trigger: "blur" },
  ],
});

// 获取验证码
const getCaptcha = async () => {
  const [error, res] = await getCaptchaApi();
  if (error) {
    ElMessage.error("获取验证码失败");
    return;
  }
  console.log(res,'===res.data');
  
  const { img, uuid } = res.data;
  const preUrl = 'data:image/*;base64,'
  captchaImg.value = preUrl + img;
  loginForm.value.uuid = uuid;
};

// 组件挂载时获取验证码
onMounted(() => {
  getCaptcha();
});

const handleLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  const valid = await formEl.validate();
  if (valid) {
    const [error, res] = await loginApi(loginForm.value);
    if (error) {
      ElMessage.error(error);
      // 登录失败时刷新验证码
      getCaptcha();
      return;
    }
    const {
      data: { token },
    } = res as any; // 临时使用 any 类型，最好定义具体的响应类型

    userStore.setToken(token);
    ElMessage.success("验证通过");
    await userStore.getUserInfo();
    await userStore.getMenuList();
    router.push("/home");
  } else {
    ElMessage.error("请正确填写登录信息");
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="@/assets/images/logo.png" alt="Logo" class="logo" />
        <h2>校园固定资产管理系统登录</h2>
      </div>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-width="0"
        size="large"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item prop="code">
          <div class="captcha-container">
            <el-input
              v-model="loginForm.code"
              placeholder="请输入验证码"
              :prefix-icon="Key"
              class="captcha-input"
            />
            <div class="captcha-img-container" @click="getCaptcha">
              <img v-if="captchaImg" :src="captchaImg" alt="验证码" class="captcha-img" />
              <div v-else class="captcha-loading">加载中...</div>
            </div>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="false"
            class="login-button"
            @click="handleLogin(loginFormRef)"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .login-box {
    width: 420px;
    padding: 40px 50px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
    }

    h2 {
      text-align: center;
      margin-bottom: 35px;
      color: #2c3e50;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 1px;
    }

    .login-button {
      width: 100%;
      height: 44px;
      font-size: 16px;
      font-weight: 500;
      letter-spacing: 1px;
      background: linear-gradient(to right, #667eea, #764ba2);
      border: none;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
      }
    }

    :deep(.el-input__wrapper) {
      background-color: rgba(245, 245, 245, 0.6);
      border: 1px solid #e8e8e8;
      transition: all 0.3s ease;
      padding: 8px 15px;

      &.is-focus {
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }
    }

    :deep(.el-input__inner) {
      height: 42px;
      font-size: 15px;
    }

    .el-form-item {
      margin-bottom: 25px;
    }
    
    .captcha-container {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .captcha-input {
        flex: 1;
      }
      
      .captcha-img-container {
        width: 120px;
        height: 60px;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        
        &:hover {
          opacity: 0.8;
        }
        
        .captcha-img {
          width: 100%;
          height: 100%;
          object-fit: fill;
        }
        
        .captcha-loading {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }

  .login-header {
    text-align: center;
    margin-bottom: 35px;

    .logo {
      width: 80px;
      height: auto;
      margin-bottom: 15px;
    }

    h2 {
      margin-bottom: 0;
    }
  }
}
</style>
