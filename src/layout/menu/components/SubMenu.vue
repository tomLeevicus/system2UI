<template>
  <el-menu-item v-if="!menu.children?.length" :index="menu.path">
    <el-icon v-if="menu.meta?.icon">
      <component :is="menu.meta.icon" />
    </el-icon>
    <template #title>{{ menu.meta?.title }}</template>
  </el-menu-item>

  <el-sub-menu v-else :index="menu.path">
    <template #title>
      <el-icon v-if="menu.meta?.icon">
        <component :is="menu.meta.icon" />
      </el-icon>
      <span>{{ menu.meta?.title }}</span>
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
  meta?: {
    title?: string;
    icon?: string;
  };
  children?: MenuItem[];
}

defineProps<{
  menu: MenuItem;
}>();
</script> 