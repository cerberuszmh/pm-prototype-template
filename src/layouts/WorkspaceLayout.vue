<script setup>
import { ref, computed, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { message, Modal } from "ant-design-vue";
import {
  DownOutlined,
  HomeOutlined,
  AppstoreOutlined,
  SettingOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
} from "@ant-design/icons-vue";
import PageTabs from "./PageTabs.vue";
import NotificationPopover from "./NotificationPopover.vue";
import AlarmFab from "./AlarmFab.vue";
import { useOpenedTabs } from "../composables/useOpenedTabs";

// 共享刷新计数器，与 PageTabs 通过 useOpenedTabs 模块单例同源
// 计数器自增时，下方 RouterView 的 :key 变化触发组件 remount，等同于浏览器刷新当前 tab
const { reloadKey } = useOpenedTabs();

// 系统名称占位：新项目启动时替换为正式系统名称，与项目级 PRD §1 保持一致
const systemName = "系统名称（启动时替换）";

// 2026-07-22 验证清理：临时滚动菜单已完成验证并移除，避免测试入口混入正式模板

const route = useRoute();
const router = useRouter();

// 当前高亮的菜单项 key，由路由 meta.menuKey 决定
const selectedKeys = computed(() => [route.meta.menuKey ?? "home"]);

// 当前展开的子菜单分组列表
const openKeys = ref([]);

// 侧边栏收起状态，由底部按钮控制
const collapsed = ref(false);

// 路由切换时，自动展开当前页所属的菜单分组，避免用户手动找位置
watch(
  () => route.meta.menuGroup,
  (group) => {
    if (group && !openKeys.value.includes(group)) {
      openKeys.value = [group];
    }
  },
  { immediate: true }
);

// V0.x 修订：用户下拉菜单只保留个人设置与退出登录，收敛顶部操作入口 - RB-017
const userMenuItems = [
  { key: "settings", label: "个人设置" },
  { key: "logout", label: "退出登录", danger: true },
];

// AI 入口当前仅承担模板演示反馈，不引入页面、会话或业务状态
function handleAiAssistant() {
  message.success("AI智能助手打开成功");
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
    <a-layout-sider
      :width="248"
      :collapsed="collapsed"
      :collapsed-width="48"
      theme="dark"
      class="workspace-sider"
    >
      <!-- 品牌标题区：占位系统图标 + 系统名称，收起时仅显示图标 -->
      <div class="workspace-brand" :class="{ 'is-collapsed': collapsed }">
        <div class="workspace-brand__icon">
          <SettingOutlined />
        </div>
        <div class="workspace-brand__title">{{ systemName }}</div>
      </div>

      <!-- 主导航菜单，inline 模式支持多级展开 -->
      <a-menu
        class="workspace-sider__menu"
        theme="dark"
        mode="inline"
        v-model:open-keys="openKeys"
        :selected-keys="selectedKeys"
      >
        <!-- ── 系统首页 ── -->
        <a-menu-item key="home">
          <template #icon><HomeOutlined /></template>
          <router-link to="/">系统首页</router-link>
        </a-menu-item>

        <!-- ── 示例模块分组 ──
             模板默认保留 1 个示例分组，新模块启动时按此样式在下方追加 a-sub-menu -->
        <a-sub-menu key="grp-example">
          <template #icon><AppstoreOutlined /></template>
          <template #title>示例模块</template>
          <a-menu-item key="example-list">
            <router-link to="/example/list">示例列表</router-link>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>

      <!-- 侧边栏底部收起按钮：与菜单项同高，固定在最下方 -->
      <div
        role="button"
        tabindex="0"
        class="workspace-sider__collapse"
        aria-label="收起菜单"
        @click="collapsed = !collapsed"
        @keydown.enter="collapsed = !collapsed"
      >
        <component :is="collapsed ? DoubleRightOutlined : DoubleLeftOutlined" />
      </div>
    </a-layout-sider>

    <a-layout>
      <!-- 2026-07-22 修订：顶部导航整体吸顶，避免页面滚动时操作入口离开视口 -->
      <div class="workspace-topbar">
        <!-- 顶部导航栏 -->
        <a-layout-header class="workspace-header">
          <!-- AI 入口位于顶部栏左侧，与右侧用户操作形成稳定分区 -->
          <a-button class="workspace-ai-entry" @click="handleAiAssistant">
            <span class="workspace-ai-entry__content">
              <span aria-hidden="true">✦</span>
              <span>AI智能助手</span>
            </span>
          </a-button>

          <a-space :size="10" class="workspace-header__actions">
            <!-- 通知中心：数字徽标 + 点击弹出三标签页浮层 -->
            <NotificationPopover />
            <a-dropdown :trigger="['click']">
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

        <!-- 多标签页导航：与 header 组成统一吸顶区域 -->
        <PageTabs />
      </div>

      <!-- 主内容区：标题/面包屑已上移至 PageTabs，内容区只承载业务视图 -->
      <a-layout-content class="workspace-content">
        <!-- :key 拼接 fullPath + reloadKey：路由变化与刷新动作都会触发 remount -->
        <RouterView :key="`${$route.fullPath}#${reloadKey}`" />
      </a-layout-content>
    </a-layout>
  </a-layout>

  <!-- 告警信息悬浮按钮：固定在右下角，按告警数量切换外观与发光提示 -->
  <AlarmFab />
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

/* 底部收起按钮：与菜单项同高 40px，宽度填满，图标居中，hover 时高亮 */
.workspace-sider__collapse {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  color: rgba(255, 255, 255, 0.65);
  border-radius: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  outline: none;
  transition: color 0.2s, background-color 0.2s;
}

.workspace-sider__collapse:hover,
.workspace-sider__collapse:focus-visible {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.08);
}

/* 顶部栏、标签栏和面包屑作为右侧列的固定顶部区：不参与内容滚动，
   由内部 .workspace-content 承担滚动，避免顶部栏计入滚动高度产生幽灵滚动条 */
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
  margin-right: auto;
  padding: 0 18px;
  color: #1677ff;
  font-weight: 600;
  letter-spacing: 0.5px;
  background:
    linear-gradient(#ffffff, #ffffff) padding-box,
    var(--workspace-ai-gradient) border-box;
  background-position:
    0 0,
    0% 50%;
  background-size:
    100% 100%,
    300% 100%;
  border: 3px solid transparent;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(82, 46, 214, 0.22);
  animation: workspaceAiBorderGradient 7s linear infinite;
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
  animation: workspaceAiTextGradient 7s linear infinite;
}

/* 背景色首尾使用同一蓝色，循环切换时不会出现突兀跳帧 */
@keyframes workspaceAiBorderGradient {
  from {
    background-position:
      0 0,
      0% 50%;
  }

  to {
    background-position:
      0 0,
      300% 50%;
  }
}

@keyframes workspaceAiTextGradient {
  from {
    background-position: 0% 50%;
  }

  to {
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
