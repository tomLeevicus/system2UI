<template>
  <div class="asset-info">
    <div class="toolbar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="资产名称">
          <el-input
            v-model="queryParams.assetName"
            placeholder="请输入资产名称"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button type="primary" @click="handleAdd">新增</el-button>
          <el-button
            type="success"
            :disabled="selectedIds.length === 0"
            @click="handleBatchApprove"
          >
            批量审核
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <gl-table-jsx
      :tableData="assetList"
      :tableHeader="columns"
      :total="pageTotal"
      :isAutoPagination="false"
      v-model:paginationConfig="paginationConfig"
      @pagination-change="handleQuery"
      @loadTableData="handleQuery"
      @selection-change="handleSelectionChange"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="资产名称" prop="assetName">
          <el-input v-model="form.assetName" placeholder="请输入资产名称" />
        </el-form-item>
        <el-form-item label="资产分类" prop="assetClassificationId">
          <el-select
            v-model="form.assetClassificationId"
            placeholder="请选择分类"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号" prop="assetModel">
          <el-input v-model="form.assetModel" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="存放位置" prop="assetStorageLocation">
          <el-input
            v-model="form.assetStorageLocation"
            placeholder="请输入存放位置"
          />
        </el-form-item>
        <el-form-item label="采购价格" prop="assetPriceNum">
          <el-input-number
            v-model="form.assetPriceNum"
            :precision="2"
            :step="0.01"
            :min="0"
            placeholder="请输入采购价格"
          />
        </el-form-item>
        <el-form-item label="价格单位" prop="assetPriceUnit">
          <el-input v-model="form.assetPriceUnit" placeholder="请输入价格单位 (如: 元, 个)" />
        </el-form-item>
        <el-form-item label="入库数量" prop="inboundQuantity">
          <el-input-number
            v-model="form.inboundQuantity"
            :min="1"
            controls-position="right"
            placeholder="请输入入库数量"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="assetUserId">
          <el-select v-model="form.assetUserId" placeholder="请选择负责人" filterable style="width: 100%">
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.nickname"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="使用部门" prop="assetUseDepartmentId">
          <el-tree-select
            v-model="form.assetUseDepartmentId"
            :data="departmentOptions"
            :props="{ value: 'deptId', label: 'deptName', children: 'children' }"
            value-key="deptId"
            placeholder="请选择使用部门"
            check-strictly
            filterable
            style="width: 100%"
          />
        </el-form-item>
        <!-- <el-form-item label="操作人" prop="operatorName">
          <el-input v-model="form.operatorName" placeholder="请输入操作人姓名" />
        </el-form-item> -->
        <el-form-item label="入库时间" prop="warehouseTime">
          <el-date-picker
            v-model="form.warehouseTime"
            type="datetime"
            placeholder="选择入库日期时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getStorageList,
  createStorage,
  updateStorage,
  deleteStorage,
  getCategoryList,
  approveStorageBatchApi,
} from "@/api/asset";
import {
  getUserListApi,
  getDeptTreeSelectApi,
} from "@/api/system";
import useTable from "@/components/global/gl-table-jsx/useTable";

const { paginationConfig } = useTable();

type CategoryOption = {
  id: number;
  name: string;
};
const queryParams = reactive({
  assetName: "",
});

const assetList = ref([]);
const pageTotal = ref(0);
const categoryOptions = ref<CategoryOption[]>([]);
const getCategoryListData = async () => {
  const [err, res] = await getCategoryList({});
  if (err) {
    ElMessage.error(err.message);
  }
  const { data } = res;
  interface Category { id: number; categoryName: string; [key: string]: any; }
  const mappedCategories: CategoryOption[] = (data as Category[]).map((item: Category) => ({
    id: item.id,
    name: item.categoryName,
  }));
  categoryOptions.value = mappedCategories;
};

interface UserOption { id: number; nickname: string; }
const userOptions = ref<UserOption[]>([]);
const departmentOptions = ref<any[]>([]);

const getUserListData = async () => {
  try {
    interface User { id: number; nickname: string; [key: string]: any; }
    const [err, res] = await getUserListApi({ pageNum: 1, pageSize: 1000 });
    if (!err && res.code === 200 && res.data?.records) {
      const mappedUsers: UserOption[] = res.data.records.map((item: User) => ({
        id: item.id,
        nickname: item.nickname,
      }));
      userOptions.value = mappedUsers;
    }
  } catch (error) {
    console.error("获取用户列表失败:", error);
  }
};

const getDepartmentTreeData = async () => {
  try {
    const [err, res] = await getDeptTreeSelectApi();
    if (!err && res.code === 200) {
      departmentOptions.value = res.data;
    }
  } catch (error) {
    console.error("获取部门树失败:", error);
  }
};

const dialog = reactive({
  visible: false,
  title: "",
  type: "create",
});

const form = reactive({
  id: undefined,
  assetName: "",
  assetClassificationId: undefined,
  assetModel: "",
  assetStorageLocation: "",
  assetPriceNum: undefined,
  inboundQuantity: undefined,
  warehouseTime: null,
  operatorName: "",
  assetPriceUnit: null,
  assetUserId: undefined,
  assetUseDepartmentId: undefined,
});

const rules = {
  assetName: [{ required: true, message: "请输入资产名称", trigger: "blur" }],
  assetClassificationId: [
    { required: true, message: "请选择资产分类", trigger: "change" },
  ],
  assetModel: [{ required: true, message: "请输入规格型号", trigger: "blur" }],
  assetStorageLocation: [
    { required: true, message: "请输入存放位置", trigger: "blur" },
  ],
  assetPriceNum: [
    { required: true, message: "请输入采购价格", trigger: "blur" },
    { type: "number", message: "请输入正确的价格", trigger: "blur" },
  ],
  inboundQuantity: [
    { required: true, message: "请输入入库数量", trigger: "blur" },
    { type: "integer", min: 1, message: "入库数量必须大于0", trigger: "blur" },
  ],
  warehouseTime: [
    { required: true, message: "请选择入库时间", trigger: "change" },
  ],
};

const formRef = ref();

const selectedIds = ref<number[]>([]);

onMounted(async () => {
  await getCategoryListData();
  await getUserListData();
  await getDepartmentTreeData();
  handleQuery();
});

const handleQuery = async () => {
  const { current, size } = paginationConfig.value;
  const [err, res] = await getStorageList({
    ...queryParams,
    pageNum: current,
    pageSize: size,
  });
  if (err) {
    ElMessage.error(err.message);
  }
  const { data } = res;
  const { records, total } = data;
  assetList.value = records;
  pageTotal.value = total;
};

const resetQuery = () => {
  queryParams.assetName = "";
  handleQuery();
};

const handleAdd = () => {
  dialog.type = "create";
  dialog.title = "新增资产";
  dialog.visible = true;
};

const handleEdit = (row: any) => {
  dialog.type = "update";
  dialog.title = "编辑资产";
  dialog.visible = true;
  Object.assign(form, row);
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm("确认删除该资产信息吗？", "提示", {
    type: "warning",
  }).then(async () => {
    await deleteStorage(row.id);
    ElMessage.success("删除成功");
    handleQuery();
  });
};

const handleSubmit = async () => {
  await formRef.value.validate();
  if (dialog.type === "create") {
    await createStorage(form);
    ElMessage.success("新增成功");
  } else {
    await updateStorage(form);
    ElMessage.success("更新成功");
  }
  dialog.visible = false;
  handleQuery();
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    id: undefined,
    assetName: "",
    assetClassificationId: undefined,
    assetModel: "",
    assetStorageLocation: "",
    assetPriceNum: undefined,
    inboundQuantity: undefined,
    warehouseTime: null,
    operatorName: "",
    assetPriceUnit: null,
    assetUserId: undefined,
    assetUseDepartmentId: undefined,
  });
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item) => item.id);
};

const handleBatchApprove = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请至少选择一条入库记录进行审核");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认审核选中的 ${selectedIds.value.length} 条入库记录吗？审核通过后将生成资产信息。`, "批量审核确认", {
      type: "warning",
    });
    const [err, res] = await approveStorageBatchApi(selectedIds.value);
    if (err) {
      ElMessage.error(err.message || "批量审核失败");
      return;
    }
    if (res.code === 200 && res.data === true) {
      ElMessage.success("批量审核成功");
      handleQuery();
      selectedIds.value = [];
    } else {
      ElMessage.error(res.message || "批量审核失败");
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error("批量审核操作出错:", error);
    }
  }
};

const columns = [
  {
    type: 'selection',
    width: 55,
    align: 'center',
  },
  {
    label: "入库记录ID",
    prop: "id",
  },
  {
    label: "资产名称",
    prop: "assetName",
  },
  {
    label: "规格型号",
    prop: "assetModel",
  },
  {
    label: "存放位置",
    prop: "assetStorageLocation",
  },
  {
    label: "采购价格",
    prop: "assetPriceNum",
    render: (scope: any) => (
      <span>{scope.row.assetPriceNum?.toFixed(2)} 元</span>
    ),
  },
  {
    label: "操作",
    width: 180,
    render: (scope: any) => (
      <>
        <el-button type="primary" link onClick={() => handleEdit(scope.row)}>
          编辑
        </el-button>
        <el-button type="danger" link onClick={() => handleDelete(scope.row)}>
          删除
        </el-button>
      </>
    ),
  },
];
</script>

<style scoped>
.asset-info {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.toolbar {
  margin-bottom: 20px;
}
</style>
