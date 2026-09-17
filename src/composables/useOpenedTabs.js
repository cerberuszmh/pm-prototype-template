import { reactive, ref } from "vue";

// ── 全局已打开页签状态 ──
// 整个应用共享同一份列表，模块作用域单例即可，无需引入 Pinia
const HOME_KEY = "home";
const HOME_PATH = "/";
const HOME_TITLE = "系统首页";

// 首页页签常驻不可关闭，与原型评审反馈一致
const state = reactive({
  tabs: [
    {
      key: HOME_KEY,
      title: HOME_TITLE,
      path: HOME_PATH,
      closable: false,
    },
  ],
  activeKey: HOME_KEY,
});

// 刷新计数器：点击"刷新当前 tab"时自增，由 WorkspaceLayout 拼到 RouterView 的 :key 上
// 触发当前路由对应组件 remount，等同于浏览器刷新当前 tab 的语义
const reloadKey = ref(0);

// 根据路由 meta 计算页签标识；缺省回退到 path，避免冲突
function resolveTabKey(route) {
  if (route.meta && route.meta.menuKey) {
    return route.meta.menuKey;
  }
  return route.path;
}

// 同步当前路由：若不存在则追加，若存在则只激活
function syncFromRoute(route) {
  // 跳过未挂载的初始路由，避免脏数据
  if (!route || !route.path) {
    return;
  }
  const key = resolveTabKey(route);
  const existed = state.tabs.find((t) => t.key === key);
  if (existed) {
    // 已打开过的 tab 也刷新 path，承接最新 query / hash
    // 防止未来扩展 query 参数路由时，旧 tab.path 把用户回带到过期参数
    existed.path = route.fullPath;
    state.activeKey = key;
    return;
  }
  // 未打开过，按访问顺序追加
  state.tabs.push({
    key,
    title: route.meta?.title ?? route.path,
    path: route.fullPath,
    closable: key !== HOME_KEY,
  });
  state.activeKey = key;
}

// 关闭页签，返回需要导航到的目标 path（外层用 router.push）
// 关闭策略：右邻 → 左邻 → 系统首页，符合常见后台管理习惯
function closeTab(key) {
  if (key === HOME_KEY) {
    return null;
  }
  const idx = state.tabs.findIndex((t) => t.key === key);
  if (idx < 0) {
    return null;
  }
  const wasActive = state.activeKey === key;
  // 从 splice 原地修改改为重新赋值，与 closeOthers / closeLeft / closeRight / closeAll 风格统一
  state.tabs = [...state.tabs.slice(0, idx), ...state.tabs.slice(idx + 1)];

  if (!wasActive) {
    return null;
  }

  // 关闭的是当前激活页：依次尝试右邻、左邻、首页
  // 注意：拼接后 idx 处即为原右邻（若存在），idx-1 为左邻
  let next = state.tabs[idx];
  if (!next) {
    next = state.tabs[idx - 1];
  }
  if (!next) {
    next = state.tabs[0];
  }
  state.activeKey = next.key;
  return next.path;
}

// 刷新当前激活 tab：通过 reloadKey 自增触发 RouterView remount
function reloadCurrent() {
  reloadKey.value += 1;
}

// 关闭其他：保留系统首页和指定 key，其他全部移除
// 返回需要导航到的目标 path（仅当激活 tab 被改变时返回，否则 null）
function closeOthers(key) {
  // 先校验 key 是否存在，避免 contextMenu.targetKey 陈旧时把激活态指向不存在的 tab
  // 与 closeTab / closeLeft / closeRight 的前置 idx 校验保持对称
  const idx = state.tabs.findIndex((t) => t.key === key);
  if (idx < 0) {
    return null;
  }
  // 系统首页 + 目标 tab 始终保留，过滤掉其余可关闭项
  state.tabs = state.tabs.filter(
    (t) => t.key === HOME_KEY || t.key === key
  );
  // 关闭其他后激活态强制锁定到目标 tab
  if (state.activeKey !== key) {
    state.activeKey = key;
    const target = state.tabs.find((t) => t.key === key);
    return target ? target.path : null;
  }
  return null;
}

// 关闭左侧：移除目标 tab 左侧所有可关闭项（系统首页除外）
// 与 closeRight 行为对称：若激活 tab 在被裁掉范围内，重定向到目标 tab
function closeLeft(key) {
  const idx = state.tabs.findIndex((t) => t.key === key);
  if (idx <= 0) {
    return null;
  }
  // 先记录激活 tab 是否落在被裁掉的左侧
  // home 永久保留，故 home 激活时不构成"激活 tab 失踪"风险
  const wasActiveInLeft = state.tabs
    .slice(0, idx)
    .some((t) => t.key === state.activeKey && t.key !== HOME_KEY);

  // 仅保留 idx 及之后的项，左侧除 home 外全部裁掉
  const home = state.tabs.find((t) => t.key === HOME_KEY);
  const keep = state.tabs.slice(idx);
  // 防止把 home 也移除：若 home 不在 keep 中，补回头部
  if (home && !keep.find((t) => t.key === HOME_KEY)) {
    state.tabs = [home, ...keep];
  } else {
    state.tabs = keep;
  }

  // 激活 tab 已被裁掉：重定向到目标 tab（与 closeRight 对称）
  if (wasActiveInLeft) {
    state.activeKey = key;
    const target = state.tabs.find((t) => t.key === key);
    return target ? target.path : null;
  }
  return null;
}

// 关闭右侧：移除目标 tab 右侧所有可关闭项
// 若激活 tab 在被关闭范围内，需要重定向到目标 tab
function closeRight(key) {
  const idx = state.tabs.findIndex((t) => t.key === key);
  if (idx < 0 || idx === state.tabs.length - 1) {
    return null;
  }
  const wasActiveInRight = state.tabs
    .slice(idx + 1)
    .some((t) => t.key === state.activeKey);

  state.tabs = state.tabs.slice(0, idx + 1);

  if (wasActiveInRight) {
    state.activeKey = key;
    const target = state.tabs.find((t) => t.key === key);
    return target ? target.path : null;
  }
  return null;
}

// 关闭所有：仅保留系统首页，激活态切到首页
function closeAll() {
  const home = state.tabs.find((t) => t.key === HOME_KEY);
  // 兜底：home 理论上始终存在，缺失则按定义重建
  state.tabs = home
    ? [home]
    : [{ key: HOME_KEY, title: HOME_TITLE, path: HOME_PATH, closable: false }];
  state.activeKey = HOME_KEY;
  return HOME_PATH;
}

// 返回 reactive 实例 + 操作函数
export function useOpenedTabs() {
  return {
    state,
    reloadKey,
    syncFromRoute,
    closeTab,
    reloadCurrent,
    closeOthers,
    closeLeft,
    closeRight,
    closeAll,
  };
}
