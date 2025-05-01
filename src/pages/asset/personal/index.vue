<script setup lang="tsx">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getCategoryList,
  getPersonalAssetList,
  scrapAsset,
  repairAsset,
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

onMounted(async () => {
  await getCategoryListData();
  handleQuery();
});

const handleQuery = async () => {
  const { current, size } = paginationConfig.value;
  const [err, res] = await getPersonalAssetList({
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

const handleReturn = async (row: any) => {
  ElMessageBox.confirm("确认归还该资产吗？", "提示", {
    type: "warning",
  }).then(async () => {
    // TODO: 调用归还接口
    ElMessage.success("归还成功");
    handleQuery();
  });
};

// 修改报废弹窗相关的响应式数据
const scrapDialog = reactive({
  visible: false,
  assetName: "",
  form: {
    id: "",
    assetId: undefined,
    scrapReason: "",
    scrapTime: "",
  },
});

const scrapRules = {
  scrapReason: [{ required: true, message: "请输入报废原因", trigger: "blur" }],
  scrapTime: [{ required: true, message: "请选择报废时间", trigger: "change" }],
};

const scrapFormRef = ref();

// 修改报废处理方法
const handleScrap = (row: any) => {
  scrapDialog.visible = true;
  scrapDialog.assetName = row.assetName;
  scrapDialog.form.assetId = row.assetId;
  scrapDialog.form.id = row.id;
};

const handleScrapSubmit = async () => {
  await scrapFormRef.value.validate();
  const params = {
    ...scrapDialog.form,
    scrapTime: dayjs(scrapDialog.form.scrapTime).format("YYYY-MM-DD 00:00:00"),
  };
  const [error, res] = await scrapAsset(params);
  if (error) {
    const { msg } = error as any;
    ElMessage.error(msg);
    return;
  }
  ElMessage.success("报废成功");
  scrapDialog.visible = false;
  handleQuery();
};

const handleScrapClose = () => {
  scrapDialog.visible = false;
  scrapDialog.assetName = "";
  scrapDialog.form.assetId = undefined;
  scrapDialog.form.scrapReason = "";
  scrapDialog.form.scrapTime = "";
  scrapFormRef.value?.resetFields();
};

// 添加报修弹窗相关的响应式数据
const repairDialog = reactive({
  visible: false,
  assetName: "",
  form: {
    assetId: undefined,
    reasonForRepair: "",
    repairDate: "",
    cost: undefined,
    id: "",
  },
});

const repairRules = {
  reasonForRepair: [
    { required: true, message: "请输入报修原因", trigger: "blur" },
  ],
  repairDate: [
    { required: true, message: "请选择报修时间", trigger: "change" },
  ],
  cost: [
    { required: true, message: "请输入花费金额", trigger: "blur" },
    { type: "number", message: "请输入正确的金额", trigger: "blur" },
  ],
};

const repairFormRef = ref();

// 修改报修处理方法
const handleRepair = (row: any) => {
  repairDialog.visible = true;
  repairDialog.assetName = row.assetName;
  repairDialog.form.assetId = row.assetId;
  repairDialog.form.id = row.id;
};

const handleRepairSubmit = async () => {
  await repairFormRef.value.validate();
  const params = {
    ...repairDialog.form,
    assetName: repairDialog.assetName,
    repairDate: dayjs(repairDialog.form.repairDate).format("YYYY-MM-DD"),
  };
  const [error, res] = await repairAsset(params);
  if (error) {
    const { msg } = error as any;
    ElMessage.error(msg);
    return;
  }
  ElMessage.success("报修成功");
  repairDialog.visible = false;
  handleQuery();
};

const handleRepairClose = () => {
  repairDialog.visible = false;
  repairDialog.assetName = "";
  repairDialog.form.assetId = undefined;
  repairDialog.form.reasonForRepair = "";
  repairDialog.form.repairDate = "";
  repairDialog.form.cost = undefined;
  repairFormRef.value?.resetFields();
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
    label: "使用状态",
    prop: "assetUseStatus",
    render: (scope: any) => (
      <el-tag type={scope.row.assetUseStatus === 1 ? "success" : "info"}>
        {scope.row.assetUseStatus === 1 ? "在用" : "闲置"}
      </el-tag>
    ),
  },
  {
    label: "操作",
    width: 180,
    render: (scope: any) => (
      <>
        <el-button type="primary" link onClick={() => handleReturn(scope.row)}>
          归还
        </el-button>
        <el-button type="warning" link onClick={() => handleRepair(scope.row)}>
          报修
        </el-button>
        <el-button type="danger" link onClick={() => handleScrap(scope.row)}>
          报废
        </el-button>
      </>
    ),
  },
];
</script>

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

    <!-- 修改报废弹窗 -->
    <el-dialog
      title="资产报废"
      v-model="scrapDialog.visible"
      width="500px"
      @close="handleScrapClose"
    >
      <el-form
        ref="scrapFormRef"
        :model="scrapDialog.form"
        :rules="scrapRules"
        label-width="100px"
      >
        <el-form-item label="资产名称">
          <el-input v-model="scrapDialog.assetName" disabled />
        </el-form-item>
        <el-form-item label="报废时间" prop="scrapTime">
          <el-date-picker
            v-model="scrapDialog.form.scrapTime"
            type="date"
            placeholder="请选择报废时间"
          />
        </el-form-item>
        <el-form-item label="报废原因" prop="scrapReason">
          <el-input
            v-model="scrapDialog.form.scrapReason"
            type="textarea"
            :rows="3"
            placeholder="请输入报废原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scrapDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleScrapSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加报修弹窗 -->
    <el-dialog
      title="资产报修"
      v-model="repairDialog.visible"
      width="500px"
      @close="handleRepairClose"
    >
      <el-form
        ref="repairFormRef"
        :model="repairDialog.form"
        :rules="repairRules"
        label-width="100px"
      >
        <el-form-item label="资产名称">
          <el-input v-model="repairDialog.assetName" disabled />
        </el-form-item>
        <el-form-item label="报修时间" prop="repairDate">
          <el-date-picker
            v-model="repairDialog.form.repairDate"
            type="date"
            placeholder="请选择报修时间"
          />
        </el-form-item>
        <el-form-item label="花费金额" prop="cost">
          <el-input-number
            v-model="repairDialog.form.cost"
            :precision="2"
            :step="0.01"
            :min="0"
            placeholder="请输入花费金额"
          />
        </el-form-item>
        <el-form-item label="报修原因" prop="reasonForRepair">
          <el-input
            v-model="repairDialog.form.reasonForRepair"
            type="textarea"
            :rows="3"
            placeholder="请输入报修原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="repairDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleRepairSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

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
