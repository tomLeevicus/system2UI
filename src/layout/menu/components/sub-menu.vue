<template>
  <el-menu-item v-if="!menu.children?.length" :index="menu.path">
    <el-icon v-if="menu.icon">
      <component :is="menu.icon" />
    </el-icon>
    <template #title>{{ menu.menuName }}</template>
  </el-menu-item>

  <el-sub-menu v-else :index="menu.path">
    <template #title>
      <el-icon v-if="menu.icon">
        <component :is="menu.icon" />
      </el-icon>
      <span>{{ menu.menuName }}</span>
    </template>
    <sub-menu
      v-for="subMenu in menu.children"
      :key="subMenu.path"
      :menu="subMenu"
    />
  </el-sub-menu>
</template>

<script setup lang="ts">
interface MenuItem {
  path: string;
  icon?: string;
  menuName?: string;
  children?: MenuItem[];
}

defineProps<{
  menu: MenuItem;
}>();
</script>
