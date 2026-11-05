// 左侧菜单与可导航路由的单一配置源。
// 新模块追加时同步改 router、本文件与 WorkspaceLayout 的图标映射。

/** @typedef {{ label: string, routeName: string }} SideMenuLeaf */
/** @typedef {{ label: string, groupKey: string, children: SideMenuLeaf[] }} SideMenuGroup */
/** @typedef {SideMenuLeaf | SideMenuGroup} SideMenuNode */

/** @type {SideMenuNode[]} */
export const SIDE_MENU_ROUTE_TREE = [
  { label: "系统首页", routeName: "home" },
  { label: "工作台", routeName: "workbench" },
  {
    label: "示例模块",
    groupKey: "grp-example",
    children: [
      { label: "示例列表", routeName: "example-list" },
      { label: "分组列表", routeName: "example-group-list" },
    ],
  },
];

/** 与 vue-router 的 route.name、侧边栏 item.key 保持一致 */
export const NAVIGABLE_ROUTE_NAMES = new Set([
  "home",
  "workbench",
  "example-list",
  "example-group-list",
]);

function isMenuGroup(node) {
  return Array.isArray(node.children);
}

/** 供 a-tree-select 使用，结构与左侧菜单层级一致；分组节点不可选 */
export function buildSideMenuTreeSelectData() {
  const tree = [];
  for (const node of SIDE_MENU_ROUTE_TREE) {
    if (isMenuGroup(node)) {
      tree.push({
        title: node.label,
        key: node.groupKey,
        selectable: false,
        children: node.children.map((child) => {
          return {
            title: child.label,
            key: child.routeName,
            value: child.routeName,
          };
        }),
      });
      continue;
    }
    tree.push({
      title: node.label,
      key: node.routeName,
      value: node.routeName,
    });
  }
  return tree;
}

/** 根据 routeName 取菜单展示名，用于校验失败时的兜底展示 */
export function findSideMenuLabel(routeName) {
  for (const node of SIDE_MENU_ROUTE_TREE) {
    if (!isMenuGroup(node)) {
      if (node.routeName === routeName) {
        return node.label;
      }
      continue;
    }
    for (const child of node.children) {
      if (child.routeName === routeName) {
        return child.label;
      }
    }
  }
  return routeName;
}
