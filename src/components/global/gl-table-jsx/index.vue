<template>
  <div class="gl-table-jsx">
    <el-table
      :data="realTableData"
      border
      style="width: 100%"
      :height="height"
      :header-cell-style="headerCellStyle"
      v-bind="attrs"
    >
      <el-table-column
        align="center"
        type="index"
        label="序号"
        width="60"
        v-if="hasIndex"
        :index="indexMethod"
      ></el-table-column>
      <el-table-column
        align="center"
        v-for="(item, index) in tableHeader"
        v-bind="item"
        :sortable="item.sortable"
        :key="index"
      >
        <template #default="scope">
          <component :is="item.render" v-bind="scope" v-if="item.render">
          </component>
        </template>
      </el-table-column>
      <slot align="center" name="operation"></slot>
    </el-table>
    <el-pagination
      v-if="hasPagination"
      class="m-t-20 pagination"
      v-model:current-page="paginationConfigVmodel.current"
      v-model:page-size="paginationConfigVmodel.size"
      :page-sizes="[10, 20, 30, 40]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="realTotal"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, useAttrs, computed } from "vue";
import { useVModel } from "@vueuse/core";

interface PaginationConfig {
  current: number;
  size: number;
}

interface TableHeaderItem {
  label: string;
  prop: string;
  render: string;
  slotName: string;
  sortable: boolean | Function;
}

interface Props {
  paginationConfig?: PaginationConfig;
  tableHeader: TableHeaderItem[];
  tableData: any[];
  hasIndex?: boolean;
  hasPagination?: boolean;
  height?: string | number;
  isAutoPagination?: boolean;
  total?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  hasIndex: () => false,
  height: () => "100%",
  hasPagination: () => true,
  isAutoPagination: () => true,
  total: () => 0,
  paginationConfig: () => {
    return {
      current: 1,
      size: 10,
    };
  },
});
const realTotal = computed(() => {
  console.log(props.total, "===props");

  return props.isAutoPagination ? props.tableData.length : props.total;
});
const realTableData = computed(() => {
  const { current, size } = paginationConfigVmodel.value;
  const preIndex = (current - 1) * size;
  const nextIndex = current * size;
  if (props.isAutoPagination) {
    return props.tableData.slice(preIndex, nextIndex);
  }
  return props.tableData;
});
// @ts-ignore
const attrs = useAttrs();

const headerCellStyle = {
  background: "#fafbfc",
  color: "#1f2937",
  borderRight: "1px solid #e5e7eb",
  fontWeight: "500",
  height: "44px",
  padding: "8px",
};

const emit = defineEmits([
  "size-change",
  "current-change",
  "page-change",
  "update:paginationConfig",
  "loadTableData",
]);
const paginationConfigVmodel = useVModel(props, "paginationConfig", emit);

const indexMethod = (index: number) => {
  const { current, size } = paginationConfigVmodel.value;
  return index + (current - 1) * size + 1;
};

const handleSizeChange = (size: number) => {
  paginationConfigVmodel.value.size = size;
  emit("size-change");
  emit("loadTableData");
};
const handleCurrentChange = (currentPage: number) => {
  paginationConfigVmodel.value = {
    ...paginationConfigVmodel.value,
    current: currentPage,
  };
  emit("update:paginationConfig", paginationConfigVmodel.value);
  emit("page-change");
  emit("loadTableData");
};
</script>

<style lang="scss" scoped>
.gl-table-jsx {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  .table-content {
    flex: 1;
    overflow-y: auto;
  }
}
:deep(.cell) {
  padding: 0;
  font-size: 12px;
}

.header-cell {
  background-color: red !important;
}
</style>
