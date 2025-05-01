<template>
  <div class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="pageSizes"
      :small="small"
      :disabled="disabled"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';

const props = defineProps({
  total: {
    type: Number,
    required: true
  },
  page: {
    type: Number,
    default: 1
  },
  limit: {
    type: Number,
    default: 10
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 30, 50]
  },
  small: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  background: {
    type: Boolean,
    default: true
  },
  autoScroll: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:page', 'update:limit', 'pagination']);

const currentPage = computed({
  get: () => props.page,
  set: (val) => {
    emit('update:page', val);
  }
});

const pageSize = computed({
  get: () => props.limit,
  set: (val) => {
    emit('update:limit', val);
  }
});

function handleSizeChange(val) {
  emit('pagination', { page: currentPage.value, limit: val });
}

function handleCurrentChange(val) {
  emit('pagination', { page: val, limit: pageSize.value });
}

watch(
  () => props.page + props.limit,
  () => {
    emit('pagination', { page: props.page, limit: props.limit });
  }
);
</script>

<style scoped>
.pagination-container {
  background: #fff;
  padding: 10px;
  text-align: right;
}
</style> 