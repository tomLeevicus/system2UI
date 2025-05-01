<template>
  <div class="asset-category">
    <el-card>
      <div class="toolbar">
        <el-form :inline="true" :model="queryParams">
          <el-form-item label="分类名称">
            <el-input v-model="queryParams.name" placeholder="请输入分类名称" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
            <el-button type="primary" @click="handleAdd">新增</el-button>
          </el-form-item>
        </el-form>
      </div>

      <gl-table-jsx
        :tableData="categoryList"
        :tableHeader="columns"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:pageSize="queryParams.pageSize"
        @pagination-change="handleQuery"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialog.title"
      v-model="dialog.visible"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
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
  getCategoryList,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/api/asset";

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: "",
});

const categoryList = ref([]);
const total = ref(0);

const dialog = reactive({
  visible: false,
  title: "",
  type: "create",
});

const form = reactive({
  id: undefined,
  categoryName: "",
  delFlag: 0,
});

const rules = {
  categoryName: [
    { required: true, message: "请输入分类名称", trigger: "blur" },
  ],
};

const formRef = ref();

onMounted(() => {
  handleQuery();
});

const handleQuery = async () => {
  const [err, res] = await getCategoryList(queryParams);
  if (err) {
    ElMessage.error(err.message);
    return;
  }
  const { data } = res;
  categoryList.value = data;
  total.value = data.length;
};

const resetQuery = () => {
  queryParams.name = "";
  handleQuery();
};

const handleAdd = () => {
  dialog.type = "create";
  dialog.title = "新增分类";
  dialog.visible = true;
};

const handleEdit = (row: any) => {
  dialog.type = "update";
  dialog.title = "编辑分类";
  dialog.visible = true;
  Object.assign(form, row);
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm("确认删除该分类吗？", "提示", {
    type: "warning",
  }).then(async () => {
    await deleteCategory(row.id);
    ElMessage.success("删除成功");
    handleQuery();
  });
};

const handleSubmit = async () => {
  await formRef.value.validate();
  if (dialog.type === "create") {
    const params = {
      categoryName: form.categoryName,
    };
    await createCategory(params);
    ElMessage.success("新增成功");
  } else {
    const params = {
      id: form.id,
      categoryName: form.categoryName,
    };
    await updateCategory(params);
    ElMessage.success("更新成功");
  }
  dialog.visible = false;
  handleQuery();
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    id: undefined,
    categoryName: "",
    delFlag: 0,
    code: "",
    sort: 0,
    remark: "",
  });
};

const columns = [
  {
    label: "分类名称",
    prop: "categoryName",
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
.asset-category {
  padding: 20px;
}
.toolbar {
  margin-bottom: 20px;
}
</style>
