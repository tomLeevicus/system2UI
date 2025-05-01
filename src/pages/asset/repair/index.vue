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
          <!-- <el-button type="primary" @click="handleAdd">新增</el-button> -->
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
        <el-form-item label="使用状态" prop="assetUseStatus">
          <el-radio-group v-model="form.assetUseStatus">
            <el-radio :label="1">在用</el-radio>
            <el-radio :label="0">闲置</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="资产状态" prop="assetStatus">
          <el-radio-group v-model="form.assetStatus">
            <el-radio :label="0">正常</el-radio>
            <el-radio :label="1">报废</el-radio>
          </el-radio-group>
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
  getRepairList,
  createRepair,
  updateRepairStatus,
  deleteRepair,
  getCategoryList,
} from "@/api/asset";
import useTable from "@/components/global/gl-table-jsx/useTable";

const { paginationConfig } = useTable();

type CategoryOptions = {
  id: number;
  name: string;
};
const queryParams = reactive({
  assetName: "",
});

const assetList = ref([]);
const pageTotal = ref(0);
const categoryOptions = ref<CategoryOptions[]>([]);
const getCategoryListData = async () => {
  const [err, res] = await getCategoryList({});
  if (err) {
    ElMessage.error(err.message);
  }
  const { data } = res;
  categoryOptions.value = data.map((item: any) => ({
    id: item.id,
    name: item.categoryName,
  }));
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
  assetUseStatus: 1,
  assetStatus: 0,
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
};

const formRef = ref();

onMounted(async () => {
  await getCategoryListData();
  handleQuery();
});

const handleQuery = async () => {
  // const res = await getAssetList(queryParams);
  const { current, size } = paginationConfig.value;
  const [err, res] = await getRepairList({
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
    await deleteRepair(row.id);
    ElMessage.success("删除成功");
    handleQuery();
  });
};

const handleSubmit = async () => {
  await formRef.value.validate();
  if (dialog.type === "create") {
    await createRepair(form);
    ElMessage.success("新增成功");
  } else {
    await updateRepairStatus(form);
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
    assetUseStatus: 1,
    assetStatus: 0,
  });
};

const columns = [
  {
    label: "资产名称",
    prop: "assetName",
  },
  {
    label: "采购价格",
    prop: "assetPriceNum",
    render: (scope: any) => (
      <span>{scope.row.assetPriceNum?.toFixed(2)} 元</span>
    ),
  },
  {
    label: "报修日期",
    prop: "repairDate",
  },
  {
    label: "报修原因",
    prop: "reasonForRepair",
  },
  {
    label: "操作",
    width: 180,
    render: ({ row }: { row: any }) => {
      const { status } = row;
      return status === 0 ? (
        ""
      ) : (
        <>
          <el-button type="danger" link onClick={() => handleDelete(row)}>
            删除
          </el-button>
        </>
      );
    },
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
