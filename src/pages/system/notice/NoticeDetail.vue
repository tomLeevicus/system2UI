<template>
  <div class="app-container notice-detail-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>公告详情</span>
          <el-button class="button" text @click="goBack">返回列表</el-button>
        </div>
      </template>
      <div v-if="noticeData">
        <h2 class="notice-title">{{ noticeData.noticeTitle }}</h2>
        <div class="notice-meta">
          <span>类型: <dict-tag :options="noticeTypeOptions" :value="noticeData.noticeType"/></span>
          <span style="margin-left: 20px;">状态: <dict-tag :options="statusOptions" :value="noticeData.status"/></span>
          <span style="margin-left: 20px;">发布人: {{ noticeData.createByName || '未知' }}</span>
          <span style="margin-left: 20px;">发布时间: {{ noticeData.createTime }}</span>
        </div>
        <el-divider />
        <div class="notice-content">
          <Editor
            :model-value="noticeData.noticeContent" 
            :read-only="true" 
            mode="simple" 
          />
        </div>
        <!-- 如果有附件，可以考虑在这里展示 -->
        <!-- <div v-if="noticeData.attachments && noticeData.attachments.length > 0" class="notice-attachments">
          <h3>附件:</h3>
          <ul>
            <li v-for="file in noticeData.attachments" :key="file.attachmentId">
              <a :href="file.filePath" target="_blank">{{ file.fileName }}</a>
            </li>
          </ul>
        </div> -->
      </div>
      <el-empty v-else-if="!loading" description="公告不存在或加载失败"></el-empty>
    </el-card>
  </div>
</template>

<script setup name="NoticeDetail">
import { ref, onMounted, reactive, toRefs } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getNoticeApi, getDictsApi } from '@/api/system';
import Editor from "@/components/Editor/index.vue";
import DictTag from "@/components/DictTag/index.vue";
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const noticeData = ref(null);

// 字典数据
const noticeTypeOptions = ref([]);
const statusOptions = ref([]);

// 加载字典数据
const loadDictData = async () => {
  try {
    const [err, res] = await getDictsApi(['sys_notice_type', 'sys_normal_disable']);
    if (err) {
      console.error('获取字典数据失败:', err);
      ElMessage.error(err.message || '加载字典数据失败');
      return;
    }
    if (res && res.data) {
      noticeTypeOptions.value = res.data.sys_notice_type?.map(item => ({ label: item.dictLabel, value: item.dictValue })) || [];
      statusOptions.value = res.data.sys_normal_disable?.map(item => ({ label: item.dictLabel, value: item.dictValue })) || [];
    }
  } catch (error) {
    console.error('获取字典数据异常:', error);
    ElMessage.error('加载字典数据时发生错误');
  }
};

const fetchNoticeDetail = async () => {
  const noticeId = route.params.noticeId;
  if (!noticeId) {
    ElMessage.error('无效的公告ID');
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const [error, res] = await getNoticeApi(noticeId); // 修改：使用 [error, res] 模式
    if (error) {
      ElMessage.error(error.message || '获取公告详情失败');
      noticeData.value = null;
      return; // 提前返回
    }
    
    if (res && res.code === 200 && res.data) {
      noticeData.value = res.data;
    } else {
      ElMessage.error(res?.message || '获取公告详情数据格式错误'); // 使用 res?.message 避免 res 为 null 或 undefined 时出错
      noticeData.value = null;
    }
  } catch (err) { // 修改 catch 变量名避免与上层 error 冲突
    console.error('获取公告详情异常:', err);
    ElMessage.error('获取公告详情失败');
    noticeData.value = null;
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back(); // 或者 router.push('/system/notice');
};

onMounted(async () => {
  await loadDictData(); // 先加载字典数据
  await fetchNoticeDetail();
});

</script>

<style scoped>
.notice-detail-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notice-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.notice-meta {
  text-align: center;
  color: #888;
  margin-bottom: 20px;
  font-size: 14px;
}

.notice-content {
  margin-top: 20px;
  /* 确保编辑器内容正确显示 */
  :deep(.w-e-text-container) { 
    min-height: 300px; /* 可以设置最小高度 */
  }
}

.notice-attachments {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.notice-attachments h3 {
  margin-bottom: 10px;
}

.notice-attachments ul {
  list-style: none;
  padding: 0;
}

.notice-attachments li {
  margin-bottom: 5px;
}

.notice-attachments a {
  color: #409EFF;
  text-decoration: none;
}

.notice-attachments a:hover {
  text-decoration: underline;
}

</style> 