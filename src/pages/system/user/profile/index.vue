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
            <div class="user-info-head" @click="handleAvatar">
              <img
                :src="user.avatar || defaultAvatar"
                class="img-circle img-lg"
              />
            </div>
            <input
              type="file"
              ref="avatarRef"
              hidden
              @change="uploadAvatar"
              accept="image/*"
            />
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
                <span class="label">部门：</span>
                <span>{{ user.deptName || "未设置" }}</span>
              </div>
            </li>
            <li class="list-group-item">
              <div class="user-info-item">
                <span class="label">手机号码：</span>
                <span>{{ user.mobile || "未设置" }}</span>
              </div>
            </li>
            <li class="list-group-item">
              <div class="user-info-item">
                <span class="label">用户邮箱：</span>
                <span>{{ user.email || "未设置" }}</span>
              </div>
            </li>
            <li class="list-group-item">
              <div class="user-info-item">
                <span class="label">创建时间：</span>
                <span>{{ user.createTime || "未设置" }}</span>
              </div>
            </li>
          </ul>
        </el-card>
      </el-col>

      <!-- 右侧基本资料 -->
      <el-col :span="16">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>基本资料</span>
            </div>
          </template>
          <el-form
            ref="userFormRef"
            :model="userForm"
            :rules="rules"
            label-width="100px"
          >
            <el-form-item label="用户昵称" prop="nickname">
              <el-input
                v-model="userForm.nickname"
                placeholder="请输入用户昵称"
              />
            </el-form-item>
            <el-form-item label="手机号码" prop="mobile">
              <el-input
                v-model="userForm.mobile"
                placeholder="请输入手机号码"
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="userForm.gender">
                <el-radio label="0">男</el-radio>
                <el-radio label="1">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submit">保存</el-button>
              <el-button @click="reset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { uploadAvatarApi, updateUserApi, getUserInfoApi } from "@/api/system";
import { ElMessage } from "element-plus";
import useUserStore from "@/store/user";

// 从用户 store 获取数据
const userStore = useUserStore();

// 默认头像
const defaultAvatar = ref("/src/assets/avatar.png");

// 用户信息对象
const user = reactive({
  username: "",
  nickname: "",
  avatar: "",
  deptName: "",
  mobile: "",
  email: "",
  createTime: "",
  gender: "0",
});

// 用户表单对象
const userForm = reactive({
  nickname: "",
  mobile: "",
  email: "",
  gender: "0",
});

// 表单校验规则
const rules = reactive({
  nickname: [{ required: true, message: "用户昵称不能为空", trigger: "blur" }],
  mobile: [
    { required: true, message: "手机号码不能为空", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号码",
      trigger: "blur",
    },
  ],
  email: [
    { required: true, message: "邮箱不能为空", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" },
  ],
});

// 表单引用
const userFormRef = ref();
// 头像上传引用
const avatarRef = ref();

// 点击头像触发上传
const handleAvatar = () => {
  avatarRef.value.click();
};

// 上传头像
const uploadAvatar = async (e: any) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const response = await uploadAvatarApi(file);
    // 确保响应格式符合预期，避免 linter 错误
    if (response && response[1].code === 200) {
      user.avatar = response[1].data;
      ElMessage.success("头像上传成功");
    } else {
      ElMessage.error("头像上传失败");
    }
  } catch (error) {
    console.error("上传头像失败", error);
    ElMessage.error("头像上传失败");
  }
};

// 提交表单
const submit = () => {
  userFormRef.value.validate(async (valid: boolean) => {
    let userid = "";
    if (userStore.userInfo && userStore.userInfo.user) {
      userid = userStore.userInfo.user.id;
    } else {
      ElMessage.error("无法获取用户ID");
      return;
    }
    if (valid) {
      try {
        const params = {
          nickname: userForm.nickname,
          mobile: userForm.mobile,
          email: userForm.email,
          gender: userForm.gender,
          id: userid,
        };
        const [error, res] = await updateUserApi(params);
        if (res && res.code === 200) {
          ElMessage.success("修改成功");
          await getUserInfo();
        } else {
          ElMessage.error(res?.message || "修改失败");
        }
      } catch (error) {
        console.error("保存用户信息失败", error);
        ElMessage.error("保存失败");
      }
    }
  });
};

// 重置表单
const reset = () => {
  if (userStore.userInfo && userStore.userInfo.user) {
    const storeUser = userStore.userInfo.user;
    Object.assign(userForm, {
      nickname: storeUser.nickname || "",
      mobile: storeUser.mobile || "",
      email: storeUser.email || "",
      gender: storeUser.gender || "0",
    });
  }
  userFormRef.value.clearValidate();
};

const getUserInfo = async () => {
  const [error, res] = await getUserInfoApi();
  if (error) {
    ElMessage.error("获取用户信息失败: " + error);
    return;
  }
  if (res && res.data) {
    const { data } = res;
    console.log(data,'====data');
    try {
      userStore.updateUserInfo(data);
      initUserData();
    } catch (storeError) {
      console.error("更新用户 Store 出错:", storeError);
      ElMessage.error("更新用户信息状态时出错");
    }
  } else {
    ElMessage.error("获取用户信息失败：响应数据无效");
  }
};

// 初始化用户数据
const initUserData = () => {
  if (userStore.userInfo && userStore.userInfo.user) {
    const storeUser = userStore.userInfo.user;

    Object.assign(user, {
      username: storeUser.username || "",
      nickname: storeUser.nickname || "",
      avatar: storeUser.avatar || "",
      deptName: storeUser.deptName || "",
      mobile: storeUser.mobile || "",
      email: storeUser.email || "",
      createTime: storeUser.createTime || "",
      gender: storeUser.gender || "0",
    });

    Object.assign(userForm, {
      nickname: storeUser.nickname || "",
      mobile: storeUser.mobile || "",
      email: storeUser.email || "",
      gender: storeUser.gender || "0",
    });
  } else {
    console.warn("用户数据在 initUserData 期间未在 Store 中找到");
    Object.assign(user, { username: "加载中...", nickname: "", avatar: "", deptName: "", mobile: "", email: "", createTime: "", gender: "0" });
    Object.assign(userForm, { nickname: "", mobile: "", email: "", gender: "0" });
  }
};

// 页面加载时获取用户信息
onMounted(() => {
  getUserInfo();
});
</script>

<style scoped>
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
  cursor: pointer;
  overflow: hidden;
}

.user-info-head:hover::after {
  content: "点击上传";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
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
}

.user-info-item .label {
  width: 100px;
  font-weight: bold;
}

.card-header {
  font-weight: bold;
  color: #333;
  font-size: 16px;
}
</style>
