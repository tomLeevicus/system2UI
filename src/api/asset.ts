import http from "@/utils/http";

// 资产信息接口
export const getAssetList = (params: any) => {
  return http.post("/assets/query", params);
};

export const createAsset = (data: any) => {
  return http.post("/assets/add", data);
};

export const updateAsset = (data: any) => {
  return http.put("/assets/edit", data);
};

export const deleteAsset = (id: number) => {
  return http.del(`/assets/delete/${id}`);
};

// 资产分类接口
export const getCategoryList = (params: any) => {
  return http.get("/asset/classification/queryList", params);
};

export const createCategory = (data: any) => {
  return http.post("/asset/classification/add", data);
};

export const updateCategory = (data: any) => {
  return http.put("/asset/classification/edit", data);
};

export const deleteCategory = (id: number) => {
  return http.del(`/asset/classification/remove/${id}`);
};

// 资产入库接口
export const getStorageList = (params: any) => {
  return http.get("/asset/storage/list", params);
};

export const createStorage = (data: any) => {
  return http.post("/asset/storage/add", data);
};

export const updateStorage = (data: any) => {
  return http.put("/asset/storage/edit", data);
};

export const deleteStorage = (id: number) => {
  return http.del(`/asset/storage/remove/${id}`);
};

// 新增：批量审核资产入库记录
export const approveStorageBatchApi = (ids: number[]) => {
  // 后端需要的是 List<Long>，通常 JSON 序列化可以处理 number[] 到 List<Long>
  return http.post("/asset/storage/approve/batch", ids);
};

// 资产领用接口
export const getRequisitionList = (params: any) => {
  return http.get("/asset/receipt/list", params);
};

export const createRequisition = (data: any) => {
  return http.post("/asset/receipt/create", data);
};

// 审核报废
export const approveScrap = (data: any) => {
  return http.post("/asset/scrap/approve", data);
};

// 审批领用申请
export const approveRequisition = (data: any) => {
  return http.post("/asset/receipt/approve", data);
};
export const deleteRequisition = (id: number) => {
  return http.del(`/asset/receipt/remove/${id}`);
};

export const updateRequisition = (data: any) => {
  return http.put("/asset/receipt/edit", data);
};

// 新增领用记录
export const addReceiptApi = (data: any) =>
  http.post("/asset/receipt/add", data);

// 资产报修接口
export const getRepairList = (params: any) => {
  return http.get("/asset/repair/list", params);
};

export const createRepair = (data: any) => {
  return http.post("/asset/repair/create", data);
};

export const updateRepairStatus = (data: any) => {
  return http.put("/asset/repair/status", data);
};

export const deleteRepair = (id: number) => {
  return http.del(`/asset/repair/remove/${id}`);
};

// 获取个人资产
export const getPersonalAssetList = (params: any) => {
  return http.get("/asset/personalAssets/list", params);
};

// 报废资产
export const scrapAsset = (data: any) => {
  return http.post("/asset/scrap/scrap", data);
};

// 分页查询报废记录
export const getScrapList = (params: any) => {
  return http.get("/asset/scrap/page", params);
};

// 报修
export const repairAsset = (data: any) => {
  return http.post("/asset/repair/add", data);
};
