<template>
  <el-tag
    :type="tagType"
    :effect="effect"
    :size="size"
  >{{ tagText }}</el-tag>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 字典选项数组
  options: {
    type: Array,
    default: () => []
  },
  // 当前值
  value: {
    type: [String, Number],
    required: true
  },
  // 标签类型
  // primary / success / warning / danger / info
  type: {
    type: String,
    default: ''
  },
  // 标签效果
  // dark / light / plain
  effect: {
    type: String,
    default: 'light'
  },
  // 标签大小
  // large / default / small
  size: {
    type: String,
    default: 'default'
  }
});

// 标签文本
const tagText = computed(() => {
  const item = props.options.find(item => item.value === props.value.toString());
  return item ? item.label : props.value;
});

// 标签类型
const tagType = computed(() => {
  const value = props.value.toString();
  const item = props.options.find(item => item.value === value);
  if (props.type) {
    return props.type;
  }
  
  if (item && item.tagType) {
    return item.tagType;
  }
  
  // 根据特定值映射类型
  if (value === '0') return 'success';
  if (value === '1') return '';
  if (value === '2') return 'warning';
  if (value === '3') return 'danger';
  
  return 'info';
});
</script> 