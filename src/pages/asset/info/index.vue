<template>
  <div class="asset-info">
    <!-- <div class="toolbar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="资产名称">
          <el-input
            v-model="queryParams.assetName"
            placeholder="请输入资产名称"
          />
        </el-form-item>
        <el-form-item> </el-form-item>
      </el-form>
    </div> -->
    <gl-base-header>
      <div class="search-item">
        <label for="">资产名称：</label>
        <el-input
          v-model="queryParams.assetName"
          placeholder="请输入资产名称"
        />
      </div>
      <div class="search-item">
        <label for="">规格型号：</label>
        <el-input
          v-model="queryParams.assetModel"
          placeholder="请输入规格型号"
        />
      </div>
      <div class="search-item">
        <label for="">存放位置：</label>
        <el-input
          v-model="queryParams.assetStorageLocation"
          placeholder="请输入存放位置"
        />
      </div>
      <div class="search-item">
        <label for="">资产状态：</label>
        <el-select
          class="w-100"
          v-model="queryParams.assetUseStatus"
          placeholder="请选择"
        >
          <el-option label="未启用" value="0" />
          <el-option label="启用中" value="1" />
          <el-option label="弃用" value="2" />
          <el-option label="销毁" value="3" />
        </el-select>
      </div>
      <el-button type="primary" @click="handleQuery">查询</el-button>
      <el-button @click="resetQuery">重置</el-button>
      <!-- 取消新增,由资产入库功能替代 -->
      <!-- <el-button type="primary" @click="handleAdd">新增</el-button> -->
    </gl-base-header>

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
        <el-form-item label="资产状态" prop="assetUseStatus">
          <el-radio-group v-model="form.assetUseStatus">
            <el-radio :label="0">未启用</el-radio>
            <el-radio :label="1">启用中</el-radio>
            <el-radio :label="2">弃用</el-radio>
            <el-radio :label="3">销毁</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="资产状态" prop="assetStatus">
          <el-radio-group v-model="form.assetStatus">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">报废</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 领用弹窗 -->
    <el-dialog
      title="资产领用"
      v-model="receiptDialog.visible"
      width="500px"
      @close="handleReceiptClose"
    >
      <el-form
        :model="receiptDialog.form"
        :rules="receiptRules"
        ref="receiptFormRef"
        label-width="100px"
      >
        <el-form-item label="领用类型">
          <el-radio-group v-model="receiptDialog.form.isLongTermUse">
            <el-radio :label="1">长期领用</el-radio>
            <el-radio :label="0">临时领用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="归还时间" v-if="!receiptDialog.form.isLongTermUse">
          <el-date-picker
            v-model="receiptDialog.form.returnTime"
            type="datetime"
            placeholder="请选择归还时间"
          />
        </el-form-item>
        <el-form-item label="领用说明" prop="instructionsForUse">
          <el-input
            v-model="receiptDialog.form.instructionsForUse"
            type="textarea"
            :rows="3"
            placeholder="请输入领用说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiptDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleReceiptSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getAssetList,
  createAsset,
  updateAsset,
  deleteAsset,
  getCategoryList,
  addReceiptApi,
} from "@/api/asset";
import useTable from "@/components/global/gl-table-jsx/useTable";
import dayjs from "dayjs";

const { paginationConfig } = useTable();

type CategoryOptions = {
  id: number;
  name: string;
};
const queryParams = reactive({
  assetName: "",
  assetUseStatus: "",
  assetStatus: "",
  assetModel: "",
  assetStorageLocation: "",
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

const receiptDialog = reactive({
  visible: false,
  isLongTermUse: 1,
  returnTime: "",
  form: {
    assetId: undefined,
    isLongTermUse: 1,
    returnTime: undefined,
    instructionsForUse: "",
  },
});

const receiptRules = {
  isLongTermUse: [
    { required: true, message: "请选择领用类型", trigger: "change" },
  ],
  returnTime: [{ required: true, message: "请输入归还时间", trigger: "blur" }],
  instructionsForUse: [
    { required: true, message: "请输入领用说明", trigger: "blur" },
  ],
};

onMounted(async () => {
  await getCategoryListData();
  handleQuery();
});

const handleQuery = async () => {
  // const res = await getAssetList(queryParams);
  const { current, size } = paginationConfig.value;
  const [err, res] = await getAssetList({
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

const addReceipt = (row: any) => {
  receiptDialog.visible = true;
  receiptDialog.form.assetId = row.id;
};

const handleReceiptSubmit = async () => {
  const params = {
    ...receiptDialog.form,
    returnTime: receiptDialog.form.isLongTermUse
      ? undefined
      : dayjs(receiptDialog.form.returnTime).format("YYYY-MM-DD HH:mm:ss"),
  };
  const [err] = await addReceiptApi(params);
  if (err) {
    ElMessage.error(err.message);
    return;
  }
  ElMessage.success("领用成功");
  receiptDialog.visible = false;
  handleQuery();
};

const handleReceiptClose = () => {
  receiptDialog.visible = false;
  receiptDialog.form.assetId = undefined;
  receiptDialog.form.isLongTermUse = 1;
  receiptDialog.form.returnTime = undefined;
  receiptDialog.form.instructionsForUse = "";
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
    await deleteAsset(row.id);
    ElMessage.success("删除成功");
    handleQuery();
  });
};

const handleSubmit = async () => {
  await formRef.value.validate();
  if (dialog.type === "create") {
    await createAsset(form);
    ElMessage.success("新增成功");
  } else {
    await updateAsset(form);
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
    label: "资产编号",
    prop: "assetNumber",
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
    label: "资产状态",
    prop: "assetUseStatus",
    render: (scope: any) => {
      const statusMap = {
        0: "未启用",
        1: "启用中",
        2: "弃用",
        3: "销毁",
      };
      return (
        <el-tag type={scope.row.assetUseStatus === 1 ? "success" : "info"}>
          {statusMap[scope.row.assetUseStatus]}
        </el-tag>
      );
    },
  },
  {
    label: "操作",
    width: 180,
    render: (scope: any) => (
      <>
        <el-button type="primary" link onClick={() => addReceipt(scope.row)}>
          领用
        </el-button>
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
