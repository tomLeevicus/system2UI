<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { getNoticeListApi, getAssetStatusApi } from '@/api/system';
import { ElMessage } from 'element-plus';

interface Notice {
  noticeId: number | string;
  noticeTitle: string;
  noticeType: number | string;
  createTime: string;
  status: string;
}

interface AssetStatusData {
  name: string;
  value: number;
}

// 通知公告数据
const noticeList = ref<Notice[]>([]);
const loading = ref(false);
const total = ref(0);
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
});

// 资产状态数据
const assetStatusData = ref<AssetStatusData[]>([]);
const chartLoading = ref(false);
let myChart: echarts.ECharts | null = null;

const router = useRouter();

// 获取通知公告列表
const getNoticeList = async () => {
  try {
    loading.value = true;
    const [error, res] = await getNoticeListApi(queryParams.value);
    if (error) {
      ElMessage.error(error.message);
      return;
    }
    if (res.code === 200) {
      noticeList.value = res.data.records || [];
      total.value = res.data.total || 0;
    }
  } catch (error) {
    console.error('获取通知公告失败', error);
  } finally {
    loading.value = false;
  }
};

// 获取资产状态数据
const getAssetStatus = async () => {
  try {
    chartLoading.value = true;
    const [error, res] = await getAssetStatusApi();
    
    if (error) {
      ElMessage.error(error.message);
      return;
    }
    
    if (res.code === 200) {
      // 确保数据是标准对象格式
      const formattedData = res.data.map((item: any) => {
        return {
          name: String(item.name || ''),
          value: Number(item.value || 0)
        };
      });
      
      // 筛选出value大于0的数据
      assetStatusData.value = formattedData.filter((item: AssetStatusData) => item.value > 0);
      
      if (assetStatusData.value.length === 0) {
        // 如果过滤后没有数据，使用默认数据
        assetStatusData.value = [
          { name: '在用', value: 45 },
          { name: '维修', value: 20 },
          { name: '报废', value: 15 },
          { name: '闲置', value: 10 }
        ];
      }
    }
  } catch (error) {
    console.error('获取资产状态数据失败', error);
    // 加载失败时使用默认数据
    assetStatusData.value = [
      { name: '在用', value: 45 },
      { name: '维修', value: 20 },
      { name: '报废', value: 15 },
      { name: '闲置', value: 10 },
      { name: '未知', value: 5 }
    ];
  } finally {
    chartLoading.value = false;
    // 数据加载完成后初始化图表
    nextTick(() => {
      initChart();
    });
  }
};

// 初始化图表
const initChart = () => {
  const chartDom = document.getElementById('pieChart');
  if (!chartDom) {
    console.error('找不到图表DOM元素');
    return;
  }
  
  // 销毁已有图表实例
  if (myChart) {
    myChart.dispose();
  }
  
  try {
    myChart = echarts.init(chartDom);
    
    // 确保数据是纯JavaScript对象
    const chartData = assetStatusData.value.map(item => {
      return {
        name: item.name,
        value: item.value
      };
    });
    
    // 定义饼图颜色
    const colorPalette = [
      '#4992ff', '#7cffb2', '#fddd60', '#ff6e76', '#58d9f9',
      '#05c091', '#ff9f7f', '#8e7bd2', '#f690bd'
    ];
    
    const option = {
      title: {
        text: '资产状态分布',
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#333'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c}台 ({d}%)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#eee',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        },
        extraCssText: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);'
      },
      legend: {
        orient: 'horizontal',
        bottom: 20,
        left: 'center',
        itemWidth: 15,
        itemHeight: 10,
        itemGap: 20,
        textStyle: {
          fontSize: 12,
          color: '#666'
        }
      },
      color: colorPalette,
      series: [
        {
          name: '资产状态',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
            shadowBlur: 5,
            shadowColor: 'rgba(0, 0, 0, 0.1)'
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}：{c}台',
            fontSize: 14,
            color: '#333',
            lineHeight: 20
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            smooth: true
          },
          emphasis: {
            scale: true,
            scaleSize: 10,
            focus: 'self',
            label: {
              fontSize: 14,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          },
          data: chartData
        }
      ]
    };
    
    myChart.setOption(option);
    
    // 响应窗口调整大小
    window.addEventListener('resize', () => {
      if (myChart) {
        myChart.resize();
      }
    });
  } catch (error) {
    console.error('初始化图表失败:', error);
  }
};

// Helper function to get notice type text
const getNoticeTypeText = (type: number | string): string => {
  if (type === 1 || type === '1') {
    return '通知';
  } else if (type === 2 || type === '2') {
    return '公告';
  }
  return '其他'; // Default or handle unknown types
};

// Helper function to get CSS class based on notice type
const getNoticeTypeClass = (type: number | string): string => {
  if (type === 1 || type === '1') {
    return 'type-notification';
  } else if (type === 2 || type === '2') {
    return 'type-announcement';
  }
  return 'type-other';
};

// 处理通知点击事件
const handleNoticeClick = (notice: Notice) => {
  if (notice && notice.noticeId) {
    router.push({ path: `/system/notice/detail/${notice.noticeId}` });
  } else {
    console.error('无法获取通知ID');
    ElMessage.warning('无法打开该通知详情');
  }
};

onMounted(() => {
  getNoticeList();
  getAssetStatus();
});
</script>

<template>
  <div class="home-container">
    <h1 class="page-title">首页</h1>
    
    <div class="content-wrapper">
      <!-- 左侧：通知公告列表 -->
      <div class="notice-section">
        <div class="section-header">
          <h2>通知公告</h2>
          <span class="more-link">更多 &gt;</span>
        </div>
        
        <div v-if="loading" class="loading-wrapper">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
        
        <div v-else-if="noticeList.length === 0" class="empty-data">
          暂无通知公告
        </div>
        
        <div v-else class="notice-list">
          <div 
            v-for="notice in noticeList" 
            :key="notice.noticeId" 
            class="notice-item"
            @click="handleNoticeClick(notice)"
            style="cursor: pointer;"
          >
            <div class="notice-content">
              <span class="notice-type-badge" :class="getNoticeTypeClass(notice.noticeType)">
                {{ getNoticeTypeText(notice.noticeType) }}
              </span>
              <span class="notice-title" :class="{ 'new-notice': notice.status === '0' }" :title="notice.noticeTitle">
                {{ notice.noticeTitle }}
                <span v-if="notice.status === '0'" class="new-badge">New</span>
              </span>
              <span class="notice-date">{{ notice.createTime }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧：饼图 -->
      <div class="chart-section">
        <div class="section-header">
          <h2>资产状态分布</h2>
        </div>
        
        <div v-show="chartLoading" class="loading-wrapper">
          <div class="loading-spinner"></div>
          <span>加载中...</span>
        </div>
        
        <div class="chart-container" v-show="!chartLoading">
          <div id="pieChart" class="pie-chart"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.content-wrapper {
  display: flex;
  gap: 20px;
}

.notice-section, .chart-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.notice-section {
  flex: 1;
  min-width: 45%;
}

.chart-section {
  flex: 1;
  min-width: 45%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  padding: 20px;
  background: linear-gradient(145deg, #ffffff 0%, #f9fafc 100%);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eaedf2;
}

.section-header h2 {
  font-size: 18px;
  color: #333;
  margin: 0;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
}

.section-header h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: #4992ff;
  border-radius: 2px;
}

.more-link {
  color: #1890ff;
  font-size: 14px;
  cursor: pointer;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item {
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.notice-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.notice-title {
  flex-grow: 1;
  font-size: 14px;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-notice {
  font-weight: bold;
  color: #333;
}

.new-badge {
  display: inline-block;
  font-size: 12px;
  color: #fff;
  background-color: #f56c6c;
  border-radius: 10px;
  padding: 0 6px;
  margin-left: 8px;
  font-weight: normal;
}

.notice-date {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  min-height: 350px;
}

.pie-chart {
  height: 100%;
  width: 100%;
  min-height: 350px;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  color: #999;
  flex-direction: column;
  gap: 10px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-data {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

/* Styles for Notice Type Badge */
.notice-type-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 12px;
  border-radius: 4px;
  margin-right: 8px;
  color: #fff;
  text-align: center;
  min-width: 35px;
  flex-shrink: 0;
}

.type-notification {
  background-color: #1890ff;
}

.type-announcement {
  background-color: #faad14;
}

.type-other {
  background-color: #bfbfbf;
}
</style>
