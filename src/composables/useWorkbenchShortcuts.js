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

// 工作台快捷入口：全部存 localStorage，首次进入预置示例列表/分组列表，均可删除。
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

  /** @returns {"ok" | "invalid" | "duplicate"} */
  function addCustomShortcut(routeName) {
    if (!NAVIGABLE_ROUTE_NAMES.has(routeName)) {
      return "invalid";
    }
    const exists = customShortcuts.some((item) => item.routeName === routeName);
    if (exists) {
      return "duplicate";
    }
    customShortcuts.push(
      buildShortcutRecord(`custom-${Date.now()}`, routeName)
    );
    writeCustomToStorage(customShortcuts);
    return "ok";
  }

  function removeCustomShortcut(id) {
    const index = customShortcuts.findIndex((item) => item.id === id);
    if (index < 0) {
      return false;
    }
    customShortcuts.splice(index, 1);
    writeCustomToStorage(customShortcuts);
    return true;
  }

  return {
    allShortcuts,
    addCustomShortcut,
    removeCustomShortcut,
    menuTreeSelectData: MENU_TREE_SELECT_DATA,
  };
}
