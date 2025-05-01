<script setup lang="tsx">
withDefaults(
  defineProps<{
    icon: string;
  }>(),
  {
    icon: "User",
  }
);
</script>

<template>
  <el-icon>
    <component :is="icon" />
    <!-- <icon /> -->
  </el-icon>
</template>
