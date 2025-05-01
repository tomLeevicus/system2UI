<template>
  <div class="top-right-btn">
    <el-row>
      <el-tooltip class="item" effect="dark" content="刷新" placement="top">
        <el-button circle icon="Refresh" @click="handleRefresh" />
      </el-tooltip>
      <el-tooltip class="item" effect="dark" :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top">
        <el-button circle icon="Search" @click="toggleSearch" />
      </el-tooltip>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  showSearch: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:showSearch', 'queryTable']);

// 搜索显示/隐藏
function toggleSearch() {
  emit('update:showSearch', !props.showSearch);
}

// 刷新
function handleRefresh() {
  emit('queryTable');
}
</script>

<style scoped>
.top-right-btn {
  position: relative;
  float: right;
  margin-right: 0;
}
</style> 