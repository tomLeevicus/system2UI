import { createRouter, createWebHistory } from "vue-router";
import { RouterView } from "vue-router";
import { useUserStore } from "@/store/user";
import type { RouteRecordRaw } from "vue-router";

const dynamicRoutes = [
  {
    path: "/system",
    // component: () => import("@/pages/system/index.vue"),
    component: RouterView,
    children: [
      {
        path: "/system/user",
        component: () => import("@/pages/system/user/index.vue"),
      },
      {
        path: "/system/role",
        component: () => import("@/pages/system/role/index.vue"),
      },
      {
        path: "/system/menu",
        component: () => import("@/pages/system/menu/index.vue"),
      },
      {
        path: "/system/department",
        component: () => import("@/pages/system/department/index.vue"),
      },
      {
        path: "/system/dict",
        component: () => import("@/pages/system/dict/index.vue"),
      },
      {
        path: '/system/dict-type',
        component: () => import("@/pages/system/dict-type/index.vue"),
      },
      {
        path: "/system/notice",
        component: () => import("@/pages/system/notice/index.vue"),
        meta: { title: "通知公告", icon: "Message" }
      },
      {
        path: "/system/notice/detail/:noticeId",
        name: "NoticeDetail",
        component: () => import("@/pages/system/notice/NoticeDetail.vue"),
        meta: { title: "公告详情", hidden: true }
      },
      {
        path: '/system/user/profile',
        component: () => import("@/pages/system/user/profile/index.vue"),
        meta: { title: "用户信息", icon: "User" }
      },
      {
        path: '/system/user/change-password',
        name: 'ChangePassword',
        component: () => import('@/pages/system/user/change-password/index.vue'),
        meta: { title: '修改密码', icon: 'Lock' }
      }
    ],
  },
  {

    path: "/home",
    component: () => import("@/pages/home/index.vue"),
  },
  {
    path: "/asset",
    component: RouterView,
    name: "AssetManagement",
    meta: { title: "资产管理", icon: "Asset" },
    children: [
      {
        path: "info",
        name: "AssetInfo",
        component: () => import("@/pages/asset/info/index.vue"),
        meta: { title: "资产信息" },
      },
      {
        path: "personal",
        name: "AssetPersonal",
        component: () => import("@/pages/asset/personal/index.vue"),
        meta: { title: "个人资产" },
      },
      {
        path: "category",
        name: "AssetCategory",
        component: () => import("@/pages/asset/category/index.vue"),
        meta: { title: "资产分类" },
      },
      {
        path: "storage",
        name: "AssetStorage",
        component: () => import("@/pages/asset/storage/index.vue"),
        meta: { title: "资产入库" },
      },
      {
        path: "requisition",
        name: "AssetRequisition",
        component: () => import("@/pages/asset/requisition/index.vue"),
        meta: { title: "资产领用" },
      },
      {
        path: "repair",
        name: "AssetRepair",
        component: () => import("@/pages/asset/repair/index.vue"),
        meta: { title: "资产报修" },
      },
      {
        path: "scrap",
        name: "AssetScrap",
        component: () => import("@/pages/asset/scrap/index.vue"),
        meta: { title: "资产报废" },
      },
    ],
  },
  {
    path: '/workflow',
    // component: () => import('@/layout/index.vue'),
    component: RouterView,
    meta: {
      title: '工作流管理',
      icon: 'Connection'
    },
    children: [
      {
        path: 'dashboard',
        name: 'WorkflowDashboard',
        component: () => import('@/pages/workflow/dashboard/index.vue'),
        meta: { title: '工作流仪表盘' }
      },
      {
        path: 'process',
        name: 'ProcessDefinition',
        component: () => import('@/pages/workflow/process/index.vue'),
        meta: { title: '流程定义管理' }
      },
      {
        path: 'instance',
        name: 'ProcessInstance',
        component: () => import('@/pages/workflow/instance/index.vue'),
        meta: { title: '流程实例管理' }
      },
      {
        path: 'task',
        name: 'TaskManagement',
        component: () => import('@/pages/workflow/task/index.vue'),
        meta: { title: '任务管理' }
      },
      {
        path: 'todo',
        name: 'TodoTasks',
        component: () => import('@/pages/workflow/todo/index.vue'),
        meta: { title: '我的待办' }
      },
      {
        path: 'history',
        name: 'HistoryTasks',
        component: () => import('@/pages/workflow/history/index.vue'),
        meta: { title: '已办任务' }
      },
      {
        path: 'analytics',
        name: 'WorkflowAnalytics',
        component: () => import('@/pages/workflow/analytics/index.vue'),
        meta: { title: '流程统计分析' }
      }
    ]
  },
];

// 使用 import.meta.glob 动态导入组件
const componentMap = import.meta.glob("@/pages/**/*.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/pages/login/index.vue"),
    },
    {
      path: "/",
      component: () => import("@/layout/index.vue"),
      children: dynamicRoutes,
    },
  ],
});

let hasLoadedRoutes = false;
// 路由拦截器
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // 检查用户是否已登录
  if (!userStore.token) {
    if (to.path !== "/login") {
      return next("/login");
    }
  } else {
    // 动态加载路由
    if (!hasLoadedRoutes) {
      addDynamicRoutes();
      hasLoadedRoutes = true;
    }
  }

  next();
});

// 新增函数：根据用户权限动态添加路由
function addDynamicRoutes() {
  const userStore = useUserStore();
  const userMenus = userStore.menus; // 假设用户菜单包含路由信息
  type Menu = {
    path: string;
    component: string;
    name: string;
    menuName: string;
  };
  userMenus.forEach((menu: Menu) => {
    const { path, component, menuName } = menu;
    // 根据菜单信息构建路由
    const route = {
      path,
      component: componentMap[`@/pages${component}`], // 使用 import.meta.glob 的映射
      name: path,
      meta: { menuName },
    };
    router.addRoute(route);
  });
}

export default router;
