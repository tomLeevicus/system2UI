import { ref, reactive } from 'vue';
import { getDictsApi } from '@/api/system';

/**
 * 获取字典数据
 * @param types 字典类型数组
 * @returns 字典数据对象
 */
export function useDict(...dictTypes: string[]) {
  const dictMap = reactive<Record<string, any[]>>({});
  
  // 初始化每种字典类型的数组
  dictTypes.forEach(type => {
    dictMap[type] = [];
  });
  
  // 获取字典数据
  const getDictData = async () => {
    try {
      const [err, res] = await getDictsApi(dictTypes);
      if (err) {
        console.error('获取字典数据失败:', err);
        return;
      }
      
      if (res && res.data) {
        // 遍历每种字典类型
        dictTypes.forEach(type => {
          if (res.data[type]) {
            dictMap[type] = res.data[type];
          }
        });
      }
    } catch (error) {
      console.error('获取字典数据出错:', error);
    }
  };

  // 立即执行获取字典数据
  getDictData();

  return dictMap;
}

/**
 * 获取字典标签
 * @param dicts 字典数据
 * @param value 字典值
 * @returns 字典标签
 */
export function getDictLabel(dicts: any[], value: string | number): string {
  if (!value || !dicts || !dicts.length) {
    return '';
  }
  const dict = dicts.find(dict => dict.value === value.toString());
  return dict ? dict.label : '';
}

/**
 * 获取字典值
 * @param dicts 字典数据
 * @param label 字典标签
 * @returns 字典值
 */
export function getDictValue(dicts: any[], label: string): string | number {
  if (!label || !dicts || !dicts.length) {
    return '';
  }
  const dict = dicts.find(dict => dict.label === label);
  return dict ? dict.value : '';
} 