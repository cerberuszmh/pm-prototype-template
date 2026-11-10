<script setup>
import { h, reactive, ref, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { message, Modal } from "ant-design-vue";
import {
  DownOutlined,
  HomeOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FundProjectionScreenOutlined,
  SearchOutlined,
  DashboardOutlined,
} from "@ant-design/icons-vue";
import PageTabs from "./PageTabs.vue";
import NotificationPopover from "./NotificationPopover.vue";
import FloatActionGroup from "./FloatActionGroup.vue";
import AiSparkleIcon from "./AiSparkleIcon.vue";
import AiAssistantPanel from "./AiAssistantPanel.vue";
import { useOpenedTabs } from "../composables/useOpenedTabs";
import { useAiAssistant } from "../composables/useAiAssistant";
import { appConfig } from "../config/app";
import { NAVIGABLE_ROUTE_NAMES, SIDE_MENU_ROUTE_TREE } from "../config/sideMenu";

// 共享刷新计数器，与 PageTabs 通过 useOpenedTabs 模块单例同源
// 计数器自增时，下方 RouterView 的 :key 变化触发组件 remount，等同于浏览器刷新当前 tab
const { reloadKey } = useOpenedTabs();

// 系统名称与 Logo 统一来自品牌配置，新项目只需修改 src/config/app.js
const systemName = appConfig.systemName;
const systemLogo = appConfig.systemLogo;

const route = useRoute();
const router = useRouter();

// 侧边栏收起状态，由底部按钮控制（与 ant-design-vue Collapsed inline menu 示例一致）
const collapsed = ref(false);

/** 与 ant-design-vue 文档 Inline menu / items 示例一致的构造 helper */
function getSideMenuItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

/** 分组与子页图标：与 SIDE_MENU_ROUTE_TREE 分组 key 对应 */
const sideMenuGroupIcons = {
  "grp-example": () => h(AppstoreOutlined),
};

const sideMenuLeafIcons = {
  home: () => h(HomeOutlined),
  workbench: () => h(DashboardOutlined),
};

function buildSideMenuItemsFromConfig() {
  const items = [];
  for (const node of SIDE_MENU_ROUTE_TREE) {
    if (node.children) {
      items.push(
        getSideMenuItem(
          node.label,
          node.groupKey,
          sideMenuGroupIcons[node.groupKey],
          node.children.map((child) => {
            return getSideMenuItem(child.label, child.routeName);
          })
        )
      );
      continue;
    }
    items.push(
      getSideMenuItem(
        node.label,
        node.routeName,
        sideMenuLeafIcons[node.routeName]
      )
    );
  }
  return items;
}

// 菜单 item.key 与 vue-router 的 route.name 一致；结构来自 config/sideMenu.js
const sideMenuItems = reactive(buildSideMenuItemsFromConfig());

const ROUTE_MENU_KEYS = NAVIGABLE_ROUTE_NAMES;

const selectedKeys = ref(["home"]);
const openKeys = ref([]);
const preOpenKeys = ref([]);

watch(openKeys, (_val, oldVal) => {
  if (!collapsed.value && oldVal && oldVal.length) {
    preOpenKeys.value = oldVal;
  }
});

watch(collapsed, (isCollapsed) => {
  if (isCollapsed) {
    openKeys.value = [];
    return;
  }
  if (preOpenKeys.value.length) {
    openKeys.value = [...preOpenKeys.value];
    return;
  }
  const group = route.meta.menuGroup;
  if (group) {
    openKeys.value = [group];
  }
});

watch(
  () => route.meta.menuKey ?? route.name,
  (key) => {
    if (!key || key === "not-found") {
      return;
    }
    const nextKey = String(key);
    if (selectedKeys.value[0] !== nextKey) {
      selectedKeys.value = [nextKey];
    }
  },
  { immediate: true }
);

watch(
  () => route.meta.menuGroup,
  (group) => {
    if (collapsed.value || !group) {
      return;
    }
    if (!openKeys.value.includes(group)) {
      openKeys.value = [group];
    }
  },
  { immediate: true }
);

function handleMenuClick({ key }) {
  if (!ROUTE_MENU_KEYS.has(key)) {
    return;
  }
  if (route.name === key) {
    return;
  }
  router.push({ name: key });
}

// V0.x 修订：用户下拉菜单只保留个人设置与退出登录，收敛顶部操作入口 - RB-017
const userMenuItems = [
  { key: "settings", label: "个人设置" },
  { key: "logout", label: "退出登录", danger: true },
];

// V0.x 修订：顶部栏 AI 入口改为开关右侧面板，再次点击即收起 - RB-021
const { visible: aiPanelVisible, togglePanel: toggleAiPanel } = useAiAssistant();

function handleAiAssistant() {
  toggleAiPanel();
}

// V0.x 修订：顶部栏 AI 智能助手右侧新增大屏入口，仅示例无实际页面 - RB-036
// 原型阶段不创建大屏页面，点击按占位规范只反馈成功结果
function handleBigScreen() {
  message.success("大屏页面打开成功");
}

// V0.x 修订：顶部栏右侧动作区新增全局搜索输入框 - RB-037
const headerSearchValue = ref("");

// 搜索为原型占位：空关键词提示补输入，非空按占位规范只反馈成功结果
function handleHeaderSearch() {
  if (!headerSearchValue.value.trim()) {
    message.warning("请输入搜索关键词");
    return;
  }
  message.success("搜索成功");
}

// 用户菜单复用统一退出逻辑，确保二次确认、反馈和跳转行为保持一致
// 退出登录会结束当前会话并跳转登录页，属于高影响操作，必须二次确认，避免用户误触
// V0.x 修订：退出登录增加二次确认对话框 - RB-009
function handleLogout() {
  Modal.confirm({
    title: "确认退出登录？",
    content: "退出后将返回登录页，未保存的内容可能丢失。",
    okText: "确认退出",
    cancelText: "取消",
    okType: "danger",
    onOk: () => {
      message.success("已安全退出登录。");
      router.push("/login");
    },
  });
}

const handleUserMenuClick = ({ key }) => {
  if (key === "logout") {
    handleLogout();
    return;
  }
  // 占位提示：按 vue-ui-implementation.mdc ## Toast 文案规范，
  // 原型阶段未实现的占位功能只暴露成功结果，不暴露开发状态
  const item = userMenuItems.find((i) => i.key === key);
  message.success(`${item?.label || "操作"}打开成功`);
};
</script>

<template>
  <a-layout class="workspace-layout" :class="{ 'is-collapsed': collapsed }">
    <!-- 通栏顶栏：品牌与全局操作横跨整页，侧栏在其下方 -->
    <a-layout-header class="workspace-header">
      <div class="workspace-header__brand">
        <div class="workspace-header__brand-icon">
          <img :src="systemLogo" alt="" />
        </div>
        <div class="workspace-header__brand-title">{{ systemName }}</div>
      </div>

      <a-button class="workspace-ai-entry" @click="handleAiAssistant">
        <span class="workspace-ai-entry__content">
          <AiSparkleIcon />
          <span>AI智能助手</span>
        </span>
      </a-button>

      <a-tooltip title="大屏页面">
        <a-button
          type="text"
          class="workspace-header__bigscreen"
          aria-label="大屏页面"
          @click="handleBigScreen"
        >
          <FundProjectionScreenOutlined class="workspace-header__bigscreen-icon" />
        </a-button>
      </a-tooltip>

      <a-space :size="10" class="workspace-header__actions">
        <a-input
          v-model:value="headerSearchValue"
          class="workspace-header__search"
          placeholder="搜索页面、功能"
          aria-label="搜索"
          allow-clear
          @press-enter="handleHeaderSearch"
        >
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>
        <NotificationPopover />
        <a-dropdown :trigger="['hover']">
          <a-space :size="6" class="workspace-user-trigger">
            <a-avatar :size="26" style="background-color: #1677ff" />
            <span class="workspace-user-trigger__name">管理员</span>
            <DownOutlined class="workspace-user-trigger__arrow" />
          </a-space>
          <template #overlay>
            <a-menu :items="userMenuItems" @click="handleUserMenuClick" />
          </template>
        </a-dropdown>
      </a-space>
    </a-layout-header>

    <a-layout class="workspace-body">
      <a-layout-sider
        :width="248"
        :collapsed="collapsed"
        :collapsed-width="48"
        theme="light"
        class="workspace-sider"
      >
        <a-menu
          class="workspace-sider__menu"
          theme="light"
          mode="inline"
          v-model:open-keys="openKeys"
          v-model:selected-keys="selectedKeys"
          :inline-collapsed="collapsed"
          :items="sideMenuItems"
          @click="handleMenuClick"
        />

        <div
          role="button"
          tabindex="0"
          class="workspace-sider__collapse"
          :aria-label="collapsed ? '展开菜单' : '收起菜单'"
          @click="collapsed = !collapsed"
          @keydown.enter="collapsed = !collapsed"
        >
          <component :is="collapsed ? MenuUnfoldOutlined : MenuFoldOutlined" />
        </div>
      </a-layout-sider>

      <a-layout class="workspace-main">
        <div class="workspace-topbar">
          <PageTabs />
        </div>

        <a-layout-content class="workspace-content">
          <RouterView :key="`${$route.fullPath}#${reloadKey}`" />
        </a-layout-content>
      </a-layout>

      <!-- 挤压式 AI 面板占位须与侧栏、主列同级横向排列，不能放在通栏 Header 下方整行 - RB-040 -->
      <AiAssistantPanel v-if="aiPanelVisible" />
    </a-layout>
  </a-layout>

  <FloatActionGroup />
</template>

<style scoped>
/* 将侧边栏内部改为 flex 纵向布局，让菜单占据剩余空间，收起按钮始终位于底部 */
:deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.workspace-sider__menu {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 底部收起按钮：浅色侧栏底栏，与菜单项同高 */
.workspace-sider__collapse {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  color: rgba(0, 0, 0, 0.55);
  border-radius: 0;
  border-top: 1px solid #f0f0f0;
  cursor: pointer;
  outline: none;
  transition: color 0.2s, background-color 0.2s;
}

.workspace-sider__collapse:hover,
.workspace-sider__collapse:focus-visible {
  color: rgba(0, 0, 0, 0.88);
  background-color: rgba(0, 0, 0, 0.04);
}

/* 顶部栏、标签栏在右侧主列内吸顶；通栏 Header 固定在最上方不参与内容滚动 */
.workspace-topbar {
  flex-shrink: 0;
  z-index: 100;
  background: #ffffff;
}

/* 覆盖 Ant Design a-layout-header 组件自带的 line-height: 64px 内联样式 */
:deep(.ant-layout-header.workspace-header) {
  height: 50px !important;
  min-height: 50px !important;
  line-height: 50px !important;
}

:deep(.ant-layout-header.workspace-header) .workspace-header__actions {
  line-height: 1;
}

/* 窄屏 Header 改为两行纵向排列（见 global.css），必须解除上方 50px 的 !important 锁高，
   否则第二行的通知与用户入口会溢出并被标签栏覆盖，导致用户菜单无法点击 */
@media (max-width: 992px) {
  :deep(.ant-layout-header.workspace-header) {
    height: auto !important;
    line-height: normal !important;
  }
}

/*
 * AI 入口采用白色内芯与动态渐变粗边框，胶囊圆角让左右两侧形成半圆。
 * 边框与文字共用同一组渐变色，固定尺寸避免动画触发布局变化。
 */
:deep(.workspace-ai-entry.ant-btn) {
  --workspace-ai-gradient:
    linear-gradient(
      100deg,
      #1677ff 0%,
      #722ed1 24%,
      #eb2f96 48%,
      #13c2c2 72%,
      #1677ff 100%
    );
  flex-shrink: 0;
  width: 168px;
  height: 34px;
  padding: 0 18px;
  color: #1677ff;
  font-weight: 600;
  letter-spacing: 0.5px;
  /* 淡色底图与边框共用同一组颜色和流动节奏：边框停靠在什么颜色，底图就透出什么颜色 */
  /* 80% 白底把 18% 色带压到约 4% 的有效浓度，保证是淡淡的彩底且不影响按钮文字对比度 */
  background:
    linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))
      padding-box,
    linear-gradient(
        100deg,
        rgba(22, 119, 255, 0.18) 0%,
        rgba(114, 46, 209, 0.18) 24%,
        rgba(235, 47, 150, 0.18) 48%,
        rgba(19, 194, 194, 0.18) 72%,
        rgba(22, 119, 255, 0.18) 100%
      )
      padding-box,
    var(--workspace-ai-gradient) border-box,
    linear-gradient(
        100deg,
        rgba(22, 119, 255, 0.18) 0%,
        rgba(114, 46, 209, 0.18) 24%,
        rgba(235, 47, 150, 0.18) 48%,
        rgba(19, 194, 194, 0.18) 72%,
        rgba(22, 119, 255, 0.18) 100%
      )
      border-box;
  background-position:
    0 0,
    0% 50%,
    0% 50%,
    0% 50%;
  background-size:
    100% 100%,
    300% 100%,
    300% 100%,
    300% 100%;
  border: 3px solid transparent;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(82, 46, 214, 0.22);
  animation: workspaceAiBorderGradient 30s linear infinite;
  transition:
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

:deep(.workspace-ai-entry.ant-btn:hover),
:deep(.workspace-ai-entry.ant-btn:focus-visible),
:deep(.workspace-ai-entry.ant-btn:active) {
  color: #1677ff;
  background-color: #ffffff;
  border-color: transparent;
  box-shadow: 0 5px 18px rgba(82, 46, 214, 0.34);
  filter: brightness(1.08);
}

/* 文字和星芒按边框相同节奏流动，使两个区域保持统一色彩语言 */
.workspace-ai-entry__content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: transparent;
  background-image: var(--workspace-ai-gradient);
  background-position: 0% 50%;
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: workspaceAiTextGradient 30s linear infinite;
}

/* 大屏入口只声明布局属性：外观（50px 等高、16px 图标、悬停浅灰底）
   与铃铛动作项共用 global.css 的 .workspace-header__bell/.workspace-header__bigscreen 统一规则；
   margin-right: auto 由 AI 按钮转移到本按钮：吸收剩余空间，
   让大屏图标紧邻 AI 按钮，同时右侧动作区保持贴右 */
:deep(.workspace-header__bigscreen.ant-btn) {
  flex-shrink: 0;
}

/* 右侧动作区贴顶栏右缘；品牌与 AI 在左侧顺序排列 */
:deep(.workspace-header__actions.ant-space) {
  margin-left: auto;
}

/* 顶栏搜索框宽度由 global.css 深色通栏样式统一提供 */

/* 每 30 秒只流动一轮：前 7 秒（7/30 ≈ 23.333%）完成流动，其余时间静止，避免持续动画干扰阅读 */
/* 背景色首尾使用同一蓝色，终点与起点视觉一致，静止期和下一轮起播都不会跳色 */
/* 边框与文字共用相同时长和节点，必须同步修改，否则两者流动会错位 */
@keyframes workspaceAiBorderGradient {
  0% {
    background-position:
      0 0,
      0% 50%,
      0% 50%,
      0% 50%;
  }

  23.333%,
  100% {
    background-position:
      0 0,
      300% 50%,
      300% 50%,
      300% 50%;
  }
}

@keyframes workspaceAiTextGradient {
  0% {
    background-position: 0% 50%;
  }

  23.333%,
  100% {
    background-position: 300% 50%;
  }
}

/* 尊重系统减少动态效果设置，保留静态多色渐变作为降级 */
@media (prefers-reduced-motion: reduce) {
  :deep(.workspace-ai-entry.ant-btn),
  .workspace-ai-entry__content {
    animation: none;
  }
}
</style>
