<script setup>
import { computed, ref } from "vue";
import { message } from "ant-design-vue";
import {
  BellOutlined,
  CheckSquareOutlined,
  MailOutlined,
  SoundOutlined,
} from "@ant-design/icons-vue";
import { notificationState, totalUnreadCount } from "../mock/notifications";

// 当前激活的标签页 key
const activeKey = ref("notification");

// 徽标数字：未读总数，超过 99 显示 99+
const totalCount = computed(() => totalUnreadCount());

// 三个分组的数据与标签文案
const tabItems = [
  {
    key: "notification",
    label: "通知",
    list: notificationState.notifications,
  },
  {
    key: "announcement",
    label: "公告",
    list: notificationState.announcements,
  },
  {
    key: "todo",
    label: "待办",
    list: notificationState.todos,
  },
];

// 当前激活标签页的文案，用于底部按钮和空态提示
const currentTabLabel = computed(() => {
  return tabItems.find((tab) => tab.key === activeKey.value)?.label ?? "消息";
});

// 按消息类型映射图标与颜色，保持三个分组视觉区分
const iconMap = {
  message: MailOutlined,
  system: BellOutlined,
  announcement: SoundOutlined,
  todo: CheckSquareOutlined,
};

const colorMap = {
  message: "#1677ff",
  system: "#ff4d4f",
  announcement: "#722ed1",
  todo: "#52c41a",
};

// 清空当前标签页：移除当前列表所有项，并给出反馈
function handleClear() {
  const currentTab = tabItems.find((tab) => tab.key === activeKey.value);
  if (!currentTab) {
    return;
  }
  currentTab.list.length = 0;
  message.success(`已清空${currentTabLabel.value}`);
}

// 查看更多：占位入口，按规范仅反馈成功结果
function handleSeeMore() {
  message.success("查看更多");
}
</script>

<template>
  <a-popover
    placement="bottomRight"
    trigger="click"
    overlay-class-name="notification-popover"
  >
    <template #content>
      <!-- 三个分组标签页：通知、公告、待办 -->
      <a-tabs v-model:active-key="activeKey" centered class="notification-popover__tabs">
        <a-tab-pane
          v-for="tab in tabItems"
          :key="tab.key"
        >
          <template #tab>
            <span class="notification-popover__tab-label">
              {{ tab.label }}
              <a-badge
                :count="tab.list.length"
                :show-zero="false"
                class="notification-popover__tab-badge"
              />
            </span>
          </template>
          <!-- 列表为空时展示统一空态 -->
          <div
            v-if="tab.list.length === 0"
            class="notification-popover__empty"
          >
            暂无{{ tab.label }}
          </div>

          <!-- 消息列表：图标 + 标题 + 描述 + 时间 -->
          <div v-else class="notification-popover__list">
            <div
              v-for="item in tab.list"
              :key="item.id"
              class="notification-popover__item"
            >
              <div
                class="notification-popover__item-icon"
                :style="{ backgroundColor: colorMap[item.type] }"
              >
                <component :is="iconMap[item.type]" />
              </div>
              <div class="notification-popover__item-content">
                <div class="notification-popover__item-title">
                  {{ item.title }}
                </div>
                <div class="notification-popover__item-desc">
                  {{ item.description }}
                </div>
                <div class="notification-popover__item-time">
                  {{ item.time }}
                </div>
              </div>
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>

      <!-- 底部操作：清空当前分组 / 查看更多，等宽分两栏，中间 1px 分隔线 -->
      <div class="notification-popover__footer">
        <div
          role="button"
          tabindex="0"
          class="notification-popover__footer-btn"
          @click="handleClear"
          @keydown.enter="handleClear"
        >
          清空{{ currentTabLabel }}
        </div>
        <div
          role="button"
          tabindex="0"
          class="notification-popover__footer-btn"
          @click="handleSeeMore"
          @keydown.enter="handleSeeMore"
        >
          查看更多
        </div>
      </div>
    </template>

    <!-- 触发器：铃铛按钮整块与顶栏等高，悬停变浅灰底；
         徽标改为包裹图标，使数字贴在铃铛右上角而非按钮顶部 -->
    <a-button
      type="text"
      class="workspace-header__bell"
      aria-label="通知中心"
    >
      <a-badge
        :count="totalCount"
        :overflow-count="99"
        :show-zero="false"
        class="workspace-header__notice"
      >
        <BellOutlined class="workspace-header__bell-icon" />
      </a-badge>
    </a-button>
  </a-popover>
</template>

<style scoped>
/* 浮层面板宽度固定，避免内容撑宽或缩窄 */
:global(.notification-popover) {
  width: 360px;
  padding: 0;
}

:global(.notification-popover .ant-popover-inner) {
  padding: 0;
}

:global(.notification-popover .ant-popover-inner-content) {
  padding: 0;
}

/* 标签项在导航栏中居中，覆盖 AntD 默认的 flex 排布 */
:global(.notification-popover .ant-tabs-nav-list) {
  justify-content: center !important;
  width: 100% !important;
}

/* 标签页标题紧凑，与列表内容对齐 */
.notification-popover__tabs :deep(.ant-tabs-nav) {
  margin: 0 16px;
}

.notification-popover__tabs :deep(.ant-tabs-tab) {
  padding: 12px 8px;
}

/* 标签文字与徽标横向紧凑排列 */
.notification-popover__tab-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}

/* 徽标在标签内缩小显示，避免撑高标签行高 */
.notification-popover__tab-badge :deep(.ant-badge-count) {
  min-width: 14px;
  height: 14px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 14px;
  border-radius: 7px;
  box-shadow: none;
}

/* 列表区域限制最大高度，避免分组过多时浮层过高 */
.notification-popover__list {
  max-height: 320px;
  overflow-y: auto;
  padding: 0 16px;
}

/* 单条消息：图标与文本横向排列，已读项降低透明度 */
.notification-popover__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.notification-popover__item:last-child {
  border-bottom: none;
}

.notification-popover__item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* 圆形图标，按类型区分背景色，统一白色图标 */
.notification-popover__item-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 16px;
}

/* 文本内容区：标题、描述、时间垂直排列 */
.notification-popover__item-content {
  flex: 1;
  min-width: 0;
}

.notification-popover__item-title {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
  line-height: 22px;
}

.notification-popover__item-desc {
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
  line-height: 20px;
  margin-top: 2px;
}

.notification-popover__item-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 18px;
  margin-top: 4px;
}

/* 空态：统一居中，避免列表为空时浮层过于空白 */
.notification-popover__empty {
  padding: 40px 16px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

/* 底部操作区：两栏等宽布局，中间 1px 竖线分隔，参考 Ant Design Pro 通知中心底部样式 */
.notification-popover__footer {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.notification-popover__footer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  box-sizing: border-box;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  line-height: 22px;
  cursor: pointer;
  outline: none;
  transition: background-color 0.2s;
}

.notification-popover__footer-btn:first-child {
  border-right: 1px solid #f0f0f0;
}

.notification-popover__footer-btn:hover,
.notification-popover__footer-btn:focus-visible {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
