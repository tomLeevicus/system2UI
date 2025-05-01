<script setup lang="ts">
// @ts-ignore
import zhCn from 'element-plus/dist/locale/zh-cn'
const size = "small";
</script>

<template>
  <el-config-provider :size="size" :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
