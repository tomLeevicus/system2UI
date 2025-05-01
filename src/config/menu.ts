import type { MenuItem } from "@/types/menu";

export const menus: MenuItem[] = [
  {
    path: "/home",
    meta: {
      title: "首页",
      icon: "HomeFilled",
    },
  },
  {
    path: "/system",
    meta: {
      title: "系统管理",
      icon: "Setting",
    },
    children: [
      {
        path: "/system/user",
        meta: {
          title: "用户管理",
        },
      },
      {
        path: "/system/role",
        meta: {
          title: "角色管理",
        },
      },
      {
        path: "/system/menu",
        meta: {
          title: "菜单管理",
        },
      },
      {
        path: "/system/department",
        meta: {
          title: "部门管理",
        },
      },
      {
        path: "/system/dict",
        meta: {
          title: "字典管理",
        },
      },
    ],
  },
  {
    path: "/asset",
    meta: {
      title: "资产管理",
      icon: "Asset",
    },
    children: [
      {
        path: "/asset/info",
        meta: {
          title: "资产信息",
        },
      },
      // 资产分类
      {
        path: "/asset/category",
        meta: {
          title: "资产分类",
        },
      },
      // 资产入库
      {
        path: "/asset/storage",
        meta: {
          title: "资产入库",
        },
      },
      // 资产领用
      {
        path: "/asset/requisition",
        meta: {
          title: "资产领用",
        },
      },
      // 资产报修
      {
        path: "/asset/repair",
        meta: {
          title: "资产报修",
        },
      },
    ],
  },
  //   {
  //     path: "/system",
  //     meta: {
  //       title: "系统管理",
  //       icon: "Setting",
  //     },
  //     children: [
  //       {
  //         path: "/system/user",
  //         meta: {
  //           title: "用户管理",
  //         },
  //       },
  //       {
  //         path: "/system/role",
  //         meta: {
  //           title: "角色管理",
  //         },
  //       },
  //     ],
  //   },
];
