<template>
  <div class="layout-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'sidebar-collapse': isCollapse }">
      <div class="logo">
        <img src="@/assets/images/logo.png" alt="Logo" />
        <span v-show="!isCollapse">校园固定资产管理系统</span>
      </div>
      <SidebarMenu :is-collapse="isCollapse" />
    </aside>

    <div class="main-container">
      <!-- 顶部导航栏 -->
      <header class="header">
        <div class="left">
          <el-icon class="collapse-btn" @click="toggleSidebar">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <breadcrumb />
        </div>
        <div class="right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" src="" />
              <span class="username">管理员</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goProfile">个人信息</el-dropdown-item>
                <el-dropdown-item @click="goChangePassword">修改密码</el-dropdown-item>
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 主要内容区域 -->
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HomeFilled, Setting, Fold, Expand } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import SidebarMenu from './menu/index.vue'

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const route = useRoute()
const activeMenu = computed(() => route.path)
const router = useRouter()
const goProfile = () => {
  router.push('/system/user/profile')
}

// 新增：跳转到修改密码页面
const goChangePassword = () => {
  // 您需要确保 '/system/user/change-password' 路由已在您的路由配置中定义
  router.push('/system/user/change-password')
}

const userStore = useUserStore()
const logout = () => {
  userStore.logout()
}

// 切换侧边栏折叠状态
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped lang="scss">
.layout-container {
  display: flex;
  height: 100vh;
  width: 100%;
  
  .sidebar {
    width: 260px;
    height: 100%;
    background-color: #304156;
    transition: width 0.3s;
    overflow: hidden;
    
    &.sidebar-collapse {
      width: 64px;
    }
    
    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      color: #fff;
      
      img {
        width: 32px;
        height: 32px;
        margin-right: 12px;
      }
    }
    
    .sidebar-menu {
      border: none;
    }
  }
  
  .main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    
    .header {
      height: 60px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #dcdfe6;
      background-color: #fff;
      
      .left {
        display: flex;
        align-items: center;
        
        .collapse-btn {
          font-size: 20px;
          cursor: pointer;
          margin-right: 20px;
        }
      }
      
      .right {
        .user-info {
          display: flex;
          align-items: center;
          cursor: pointer;
          
          .username {
            margin-left: 8px;
          }
        }
      }
    }
    
    .main-content {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background-color: #f0f2f5;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
