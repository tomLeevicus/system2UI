<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { ElMessage, ElTree } from 'element-plus';
import type { TreeNodeData, TreeKey } from 'element-plus/es/components/tree/src/tree.type';
import { getDeptTreeSelectApi } from '@/api/system'; // 使用新的 API
import type { ApiResponse } from '@/types/api';

interface DeptTree {
  id: number | string;
  label: string;
  children?: DeptTree[];
}

const props = defineProps({
  visible: Boolean,
  userId: [String, Number],
  username: String,
  // 可以传入用户当前的部门ID，用于默认选中
  // currentDeptId: [String, Number]
});

const emit = defineEmits(['update:visible', 'submit']);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

const deptTreeData = ref<DeptTree[]>([]);
const treeRef = ref<InstanceType<typeof ElTree>>();
const loading = ref(false);
const selectedDeptId = ref<number | string | null>(null);

// 获取部门树数据
const fetchDeptTree = async () => {
  loading.value = true;
  try {
    // 使用新的 API 函数
    const [error, res] = await getDeptTreeSelectApi(); 
    if (error) {
      ElMessage.error('获取部门列表失败: ' + error.message);
      deptTreeData.value = [];
      return;
    }
    if (res.code === 200) {
      deptTreeData.value = res.data; 
      // 如果需要默认选中
      // nextTick(() => {
      //   if (props.currentDeptId && treeRef.value) {
      //     treeRef.value.setCurrentKey(props.currentDeptId as TreeKey);
      //     selectedDeptId.value = props.currentDeptId;
      //   }
      // });
    } else {
      ElMessage.error('获取部门列表失败: ' + res.message);
      deptTreeData.value = [];
    }
  } catch (err) {
    ElMessage.error('获取部门列表时发生错误');
    deptTreeData.value = [];
  } finally {
    loading.value = false;
  }
};

// 监听对话框打开，加载数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedDeptId.value = null; // 重置选择
    // 清空上次选中状态
    nextTick(() => {
      treeRef.value?.setCurrentKey(undefined); // 使用 undefined 清除选中
    });
    fetchDeptTree();
  }
});

// 节点点击事件，用于选择
const handleNodeClick = (data: TreeNodeData) => {
  // 如果部门数据结构中包含disabled等字段，可以在这里判断是否可选
  selectedDeptId.value = data.deptId as number | string;
};

// 提交
const handleSubmit = () => {
  if (!selectedDeptId.value) {
    ElMessage.warning('请选择一个部门');
    return;
  }
  emit('submit', selectedDeptId.value);
};

// 取消
const handleCancel = () => {
  dialogVisible.value = false;
};
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`为用户 [${username}] 分配部门`"
    width="500px"
    append-to-body
    @close="handleCancel"
  >
    <div v-loading="loading" style="min-height: 200px;">
      <el-tree
        ref="treeRef"
        :data="deptTreeData"
        :props="{ children: 'children', label: 'deptName' }"
        node-key="deptId"
        highlight-current
        check-strictly 
        :expand-on-click-node="false"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <span>{{ node.label }}</span>
        </template>
      </el-tree>
      <el-empty v-if="!loading && deptTreeData.length === 0" description="暂无部门数据" />
    </div>
    <template #footer>
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="primary" @click="handleSubmit">确 定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 可根据需要添加样式 */
</style> 