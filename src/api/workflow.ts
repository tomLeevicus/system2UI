import http from "@/utils/http";

// 流程定义相关接口
export const getProcessDefinitionList = (params: any) => {
  return http.get("/workflow/process/list", params);
};

export const getProcessDefinitionById = (id: string) => {
  return http.get(`/workflow/process/${id}`);
};

export const deployProcess = (data: any) => {
  return http.post("/workflow/process/deploy", data);
};

export const getUploadedFiles = () => {
  return http.get("/workflow/process/uploaded");
};

export const deleteProcessDefinition = (id: string) => {
  return http.del(`/workflow/process/${id}`);
};

export const updateProcessState = (id: string, state: boolean) => {
  return http.put(`/workflow/process/state/${id}/${state}`);
};

export const getProcessXml = (id: string) => {
  return http.get(`/workflow/process/xml/${id}`);
};

// 流程实例相关接口
export const getProcessInstanceList = (params: any) => {
  return http.get("/workflow/instance/page", params);
};

export const startProcess = (processKey: string, data: any) => {
  return http.post(`/workflow/instance/start/${processKey}`, data);
};

export const getInstanceVariables = (instanceId: string) => {
  return http.get(`/workflow/instance/variables/${instanceId}`);
};

export const getInstanceTasks = (instanceId: string) => {
  return http.get(`/workflow/instance/tasks/${instanceId}`);
};

// export const deleteProcessInstance = (instanceId: string, deleteReason: string) => {
//   return http.del(`/workflow/instance/${instanceId}`, { deleteReason });
// };

export const updateInstanceState = (id: string, state: boolean) => {
  return http.put(`/workflow/instance/state/${id}/${state}`);
};

// 任务相关接口
export const getTodoTasks = (params: any) => {
  return http.get("/workflow/process/tasks/todo", params);
};

export const completeUserTask = (taskId: string, variables: any, comment: string) => {
  return http.post('/workflow/process/tasks/complete', {
    taskId,
    variables,
    comment
  });
};

export const completeGatewayTask = (taskId: string, variables: any, comment: string) => {
  return http.post('/workflow/process/tasks/complete-gateway', {
    taskId,
    variables,
    comment
  });
};

export const checkTaskHasNextGateway = (taskId: string) => {
  return http.get(`/workflow/instance/task/${taskId}/hasNextGateway`);
};

export const addComment = (data: any) => {
  return http.post("/workflow/instance/comment", data);
};

export const uploadAttachment = (formData: FormData) => {
  return http.post("/workflow/instance/attachment", formData);
};

export const batchCompleteTasks = (data: any) => {
  return http.post("/workflow/process/tasks/batch-complete", data);
};

export const getProcessHistory = (instanceId: string) => {
  return http.get(`/workflow/instance/history/${instanceId}`);
};

export const getProcessComments = (instanceId: string) => {
  return http.get(`/workflow/instance/comments/${instanceId}`);
};

// 历史任务相关接口
export const getHistoryTasks = (params: any) => {
  return http.get("/workflow/instance/history-tasks", params);
};

// export const getTaskDetail = (taskId: string) => {
//   return http.get(`/workflow/instance/task-detail/${taskId}`);
// };

// 统计分析相关接口
export const getWorkflowStatistics = (params: any) => {
  return http.get("/workflow/statistics/overview", params);
};

export const getProcessPerformance = (params: any) => {
  return http.get("/workflow/statistics/performance", params);
};

// 仪表盘数据接口
export const getDashboardData = () => {
  return http.get("/workflow/statistics/dashboard");
};

// 添加或更新获取流程实例状态的方法
export const getProcessInstanceStatus = (instanceId: string) => {
  return http.get(`/workflow/instance/${instanceId}/status`);
};

// 获取流程图
export const getProcessImage = (processInstanceId: string) => {
  return http.get(`/workflow/process/image/${processInstanceId}`, {
    responseType: 'blob'
  });
};

// 获取任务详情
export const getTaskDetail = (taskId: string) => {
  return http.get(`/workflow/instance/task/${taskId}/detail`);
};

// 获取任务可选的审批人列表
export const getTaskApprovers = (taskId: string) => {
  return http.get(`/workflow/process/task/${taskId}/approvers`);
};

// 批量完成任务
export const completeBatchTasks = (taskIds: string[], approveResult: boolean, comment: string) => {
  return http.post('/workflow/process/tasks/batch-complete', {
    taskIds,
    approveResult,
    comment
  });
};

export const getProcessDeployGetImage = (id: string) => {
  return http.get(`/workflow/process/deployGetImage/${id}`);
}

// 获取当前用户发起的流程任务
export const getUserTasks = (params: any) => {
  return http.get("/workflow/instance/user-tasks", params);
};