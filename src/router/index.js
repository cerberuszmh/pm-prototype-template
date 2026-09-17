import { createRouter, createWebHistory } from "vue-router";

import WorkspaceLayout from "../layouts/WorkspaceLayout.vue";

// 真实页面：懒加载，减少首屏体积
const NotFoundView = () => import("../views/NotFoundView.vue");
const HomeView = () => import("../views/HomeView.vue");
const LoginView = () => import("../views/LoginView.vue");

// 通用占位页：用于尚未开发的模块，保留可导航的系统骨架
const PlaceholderView = () => import("../views/PlaceholderView.vue");

// 示例模块路由：模板默认保留 1 个示例分组，新模块启动时按此样式新增
const ExampleListView = () => import("../views/example/ExampleListView.vue");

// 辅助函数：快速生成占位路由，新模块未实现前先用占位页占位
// path / key / title / group / parentTitle 五项与左侧菜单的 key 与展示文案一致
function ph(path, key, title, group, parentTitle) {
  return {
    path,
    name: key,
    component: PlaceholderView,
    meta: { title, menuKey: key, menuGroup: group, parentTitle },
  };
}

// 路由表结构：系统首页 + 示例模块 + 兜底 404
// 新模块启动时按本表样式在 children 数组中追加路由项
const routes = [
  // 登录页独立于工作台布局，避免展示侧边栏、Header 和页面标签
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: {
      title: "登录",
      description: "示例管理系统登录页。",
    },
  },
  {
    path: "/",
    component: WorkspaceLayout,
    children: [
      // ── 系统首页 ──
      {
        path: "",
        name: "home",
        component: HomeView,
        meta: {
          title: "系统首页",
          description: "系统后台首页。",
          menuKey: "home",
        },
      },

      // ── 示例模块（模板默认保留，展示标准列表页结构）──
      // 新建/编辑均在弹窗中完成，无独立路由
      {
        path: "example/list",
        name: "example-list",
        component: ExampleListView,
        meta: {
          title: "示例列表",
          description: "示例列表 · 新建 · 编辑（示例模块）",
          menuKey: "example-list",
          menuGroup: "grp-example",
          parentTitle: "示例模块",
        },
      },
    ],
  },
  // 兜底 404：menuKey 固定为 not-found，避免重复 tab 累积
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
    meta: {
      title: "页面不存在",
      description: "当前访问的路由不存在或已失效。",
      menuKey: "not-found",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
