import { reactive, computed } from "vue";
import {
  ApartmentOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  DashboardOutlined,
} from "@ant-design/icons-vue";
import {
  NAVIGABLE_ROUTE_NAMES,
  buildSideMenuTreeSelectData,
  findSideMenuLabel,
} from "../config/sideMenu";

// 工作台快捷入口：全部存 localStorage，首次进入预置示例列表/分组列表，均可取消；
// 增删统一在「管理」弹窗的多选下拉中完成。
const STORAGE_KEY = "pm-template-workbench-custom-shortcuts";

const ROUTE_ICON_MAP = {
  home: HomeOutlined,
  workbench: DashboardOutlined,
  "example-list": UnorderedListOutlined,
  "example-group-list": ApartmentOutlined,
};

const MENU_TREE_SELECT_DATA = buildSideMenuTreeSelectData();

/** 首次无本地记录时写入的预置入口（不是不可删的内置项） */
const DEFAULT_SHORTCUT_ROUTES = ["example-list", "example-group-list"];

function buildShortcutRecord(id, routeName) {
  return {
    id,
    label: findSideMenuLabel(routeName),
    routeName,
  };
}

function buildDefaultShortcutList() {
  const list = [];
  for (const routeName of DEFAULT_SHORTCUT_ROUTES) {
    list.push(buildShortcutRecord(`default-${routeName}`, routeName));
  }
  return list;
}

function readCustomFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const defaults = buildDefaultShortcutList();
      writeCustomToStorage(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const allowed = NAVIGABLE_ROUTE_NAMES;
    const result = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const routeName = String(item.routeName || "");
      if (!allowed.has(routeName)) {
        continue;
      }
      const id = String(item.id || `custom-${Date.now()}-${result.length}`);
      result.push({
        id,
        label: findSideMenuLabel(routeName),
        routeName,
      });
    }
    return result;
  } catch {
    return [];
  }
}

function writeCustomToStorage(list) {
  if (typeof window === "undefined") {
    return;
  }
  const payload = list.map((item) => ({
    id: item.id,
    routeName: item.routeName,
  }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function resolveIcon(routeName) {
  const icon = ROUTE_ICON_MAP[routeName];
  if (icon) {
    return icon;
  }
  return UnorderedListOutlined;
}

export function useWorkbenchShortcuts() {
  const customShortcuts = reactive(readCustomFromStorage());

  const allShortcuts = computed(() => {
    return customShortcuts.map((item) => {
      return {
        key: item.id,
        label: item.label,
        routeName: item.routeName,
        icon: resolveIcon(item.routeName),
      };
    });
  });

  // 「管理」弹窗打开时用于回填下拉的已选值
  const selectedRouteNames = computed(() => {
    return customShortcuts.map((item) => item.routeName);
  });

  // 「管理」弹窗保存：按下拉中的已选集合整体替换。
  // 仍被选中的入口保留原记录与顺序，避免用户每次保存后卡片顺序被打乱；
  // 新选中的按选择先后追加到末尾；允许保存为空集合
  function setShortcutRoutes(routeNames) {
    const wanted = [];
    for (const routeName of routeNames) {
      const valid = NAVIGABLE_ROUTE_NAMES.has(routeName);
      if (valid && !wanted.includes(routeName)) {
        wanted.push(routeName);
      }
    }

    const kept = customShortcuts.filter((item) => wanted.includes(item.routeName));
    const keptRoutes = kept.map((item) => item.routeName);
    const added = [];
    wanted.forEach((routeName, index) => {
      if (!keptRoutes.includes(routeName)) {
        added.push(
          buildShortcutRecord(`custom-${Date.now()}-${index}`, routeName)
        );
      }
    });

    customShortcuts.splice(0, customShortcuts.length, ...kept, ...added);
    writeCustomToStorage(customShortcuts);
  }

  return {
    allShortcuts,
    selectedRouteNames,
    setShortcutRoutes,
    menuTreeSelectData: MENU_TREE_SELECT_DATA,
  };
}
