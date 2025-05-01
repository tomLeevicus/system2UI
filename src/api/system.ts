import httpInstance from "@/utils/http";

// 用户

// 获取用户列表
export const getUserListApi = (params: any) => {
  return httpInstance.get("/system/user/list", params);
};

// 新增用户
export const addUserApi = (params: any) => {
  return httpInstance.post("/system/user/add", params);
};

// 修改用户
export const updateUserApi = (params: any) => {
  return httpInstance.put("/system/user/edit", params);
};

// 删除用户
export const deleteUserApi = (userId: string) => {
  return httpInstance.del(`/system/user/remove/${userId}`);
};

// 上传用户头像
export const uploadAvatarApi = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return httpInstance.post("/system/userInfo/uploadAvatar", formData);
};

// 获取用户的角色
export const getUserRolesApi = (userId: string | number) => {
  return httpInstance.get(`/system/user/roles/${userId}`);
};

// 为用户分配角色
export const assignUserRolesApi = (params: any) => {
  return httpInstance.put("/system/user/authRole", params);
};

// 获取菜单列表

// 获取菜单列表
export const getMenuListApi = (params: any) => {
  return httpInstance.get("/system/menu/list", params);
};

// 新增菜单
export const addMenuApi = (data: any) => {
  return httpInstance.post("/system/menu/add", data);
};

// 修改菜单
export const updateMenuApi = (data: any) => {
  return httpInstance.put("/system/menu/edit", data);
};

// 删除菜单
export const deleteMenuApi = (menuId: number) => {
  return httpInstance.del(`/system/menu/${menuId}`);
};

// 获取角色列表
export const getRoleListApi = (params: any) => {
  return httpInstance.get("/system/role/list", params);
};

// 新增角色
export const addRoleApi = (params: any) => {
  return httpInstance.post("/system/role/add", params);
};

// 修改角色
export const updateRoleApi = (params: any) => {
  return httpInstance.put("/system/role/edit", params);
};

// 删除角色
export const deleteRoleApi = (roleId: string) => {
  return httpInstance.del(`/system/role/remove/${roleId}`);
};

// 获取角色的菜单权限
export const getRoleMenusApi = (roleId: string | number) => {
  return httpInstance.get(`/system/role/menus/${roleId}`);
};

// 给角色分配权限
export const assignRoleMenusApi = (params: any) => {
  return httpInstance.put("/system/role/authMenu", params);
};

// 字典类型管理

// 获取字典类型列表
export const getDictTypeListApi = (params: any) => {
  return httpInstance.get("/system/dict/type/list", params);
};

// 新增字典类型
export const addDictTypeApi = (params: any) => {
  return httpInstance.post("/system/dict/type/add", params);
};

// 修改字典类型
export const updateDictTypeApi = (params: any) => {
  return httpInstance.put("/system/dict/type/edit", params);
};

// 删除字典类型
export const deleteDictTypeApi = (dictTypeId: string) => {
  return httpInstance.del(`/system/dict/type/remove/${dictTypeId}`);
};


// 字典管理

// 获取字典列表
export const getDictListApi = (params: any) => {
  return httpInstance.get("/system/dict/data/list", params);
};

// 新增字典
export const addDictApi = (params: any) => {
  return httpInstance.post("/system/dict/data/add", params);
};

// 修改字典
export const updateDictApi = (params: any) => {
  return httpInstance.put("/system/dict/data/edit", params);
};

// 删除字典
export const deleteDictApi = (dictId: string) => {
  return httpInstance.del(`/system/dict/data/remove/${dictId}`);
};

// 获取部门列表
export const getDepartmentListApi = (params: any) => {
  return httpInstance.get("/system/dept/list", params);
};

// 新增部门
export const addDepartmentApi = (data: any) => {
  return httpInstance.post("/system/dept/add", data);
};

// 更新部门
export const updateDepartmentApi = (data: any) => {
  return httpInstance.put("/system/dept", data);
};

// 删除部门
export const deleteDepartmentApi = (deptId: number) => {
  return httpInstance.del(`/system/dept/remove/${deptId}`);
};

// 获取部门树形结构 (下拉选择)
export const getDeptTreeSelectApi = () => {
  return httpInstance.get("/system/dept/treeselect");
};

// 分配用户到部门
export const assignUserToDeptApi = (data: { deptId: number | string; userIds: (number | string)[] }) => {
  return httpInstance.post("/system/dept/assignUsers", data);
};

// 获取菜单树
export const getMenuTreeApi = () => {
  return httpInstance.get("/system/menu/tree");
};

// 获取用户菜单
export const getRoutersApi = () => {
  return httpInstance.get("/system/menu/getRouters");
};

// 通知公告管理

// 获取公告列表
export const getNoticeListApi = (params: any) => {
  return httpInstance.get("/system/notice/list", params);
};

// 获取公告详情
export const getNoticeApi = (noticeId: number) => {
  return httpInstance.get(`/system/notice/get/${noticeId}`);
};

// 新增公告
export const addNoticeApi = (data: any) => {
  return httpInstance.post("/system/notice", data);
};

// 修改公告
export const updateNoticeApi = (data: any) => {
  return httpInstance.put("/system/notice", data);
};

// 删除公告
export const deleteNoticeApi = (noticeId: number) => {
  return httpInstance.del(`/system/notice/${noticeId}`);
};

// 获取字典数据
export const getDictsApi = (dictTypes: string[]) => {
  return httpInstance.get("/system/dict/data/types", { dictTypes: dictTypes.join(',') });
};

// 获取资产状态占比
export const getAssetStatusApi = () => {
  return httpInstance.get("/home/statistics/asset-status");
};


// 获取用户基本信息
export const getUserInfoApi = () => {
  return httpInstance.get("/system/userInfo/getInfo");
};

// 修改用户密码
export const changePasswordApi = (params: any) => {
  // 确保传递的参数包含 id, oldPassword, newPassword
  return httpInstance.put("/system/user/changePwd", params);
};

