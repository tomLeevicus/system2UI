<template>
  <div class="gl-base-header">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
const props = withDefaults(
  defineProps<{
    flexWrap: boolean;
  }>(),
  {
    flexWrap: () => false,
  },
);
const flexWrapText = computed(() => {
  return props.flexWrap ? 'wrap' : 'nowrap';
});
</script>

<style lang="scss" scoped>
.gl-base-header {
  display: flex;
  align-items: center;
  flex-wrap: v-bind(flexWrapText);
  margin-bottom: 20px;
}
</style>
