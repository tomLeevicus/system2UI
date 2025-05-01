<template>
  <el-menu
    :collapse="isCollapse"
    :default-active="activeMenu"
    class="sidebar-menu"
    background-color="#304156"
    text-color="#fff"
    active-text-color="#409EFF"
    router
  >
    <sub-menu v-for="menu in menus" :key="menu.path" :menu="menu" />
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import SubMenu from "./components/sub-menu.vue";
import { useUserStore } from "@/store/user";

interface Props {
  isCollapse?: boolean;
}

defineProps<Props>();

// 获取路由实例
const route = useRoute();

// 当前激活的菜单
const activeMenu = computed(() => route.path);

interface Menu {
  path: string;
  // 其他属性...
}

// 使用导入的菜单配置
// const menus = computed(() => menuConfig);
const menus = computed<Menu[]>(() => {
  const userStore = useUserStore();
  return userStore.menus;
});
</script>

<style scoped lang="scss">
.sidebar-menu {
  height: 100%;
  overflow-y: auto;
  border: none;

  :deep(.el-menu-item) {
    &.is-active {
      background-color: #263445;
    }
  }

  :deep(.el-sub-menu__title) {
    &:hover {
      background-color: #263445;
    }
  }
}
</style>
