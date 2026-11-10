<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Empty, message } from "ant-design-vue";
import { CheckOutlined } from "@ant-design/icons-vue";
import { exampleList } from "../../mock/example";
import { EXAMPLE_STATUS, findEnumLabel } from "../../mock/enums";
import { workbenchTodos } from "../../mock/workbench";
import {
  notificationState,
  markAllAnnouncementsRead,
  markAllNotificationsRead,
} from "../../mock/notifications";
import { useWorkbenchShortcuts } from "../../composables/useWorkbenchShortcuts";
import { useNotificationItemMotion } from "../../composables/useNotificationItemMotion";
import NotificationCenterFeed from "../../components/NotificationCenterFeed.vue";

// 左侧：指标、待办+通知、图表；右侧窄栏：快捷入口、公告、最近动态。
// 桌面端两栏各自独立滚动，窄屏上下排列并恢复整页自然滚动。

const router = useRouter();
const {
  allShortcuts,
  selectedRouteNames,
  setShortcutRoutes,
  menuTreeSelectData,
} = useWorkbenchShortcuts();

const { playMarkAllRead, itemMotionClass } = useNotificationItemMotion();

const notificationFeedRef = ref(null);
const announcementFeedRef = ref(null);

// 「管理快捷入口」弹窗：多选下拉统一维护已选与未选，保存时整体生效，取消不改动
const manageModalOpen = ref(false);
const manageForm = reactive({
  routeNames: [],
});

function countStatus(status) {
  let count = 0;
  for (const record of exampleList) {
    if (record.status === status) {
      count += 1;
    }
  }
  return count;
}

// 下方图表示例：数据来自 exampleList，随 mock 变更自动更新
const statusChartItems = computed(() => {
  return [
    {
      key: "draft",
      label: "草稿",
      value: countStatus("draft"),
      color: "#1677ff",
    },
    {
      key: "published",
      label: "已发布",
      value: countStatus("published"),
      color: "#52c41a",
    },
    {
      key: "archived",
      label: "已归档",
      value: countStatus("archived"),
      color: "#bfbfbf",
    },
  ];
});

const statusChartMax = computed(() => {
  let max = 0;
  for (const item of statusChartItems.value) {
    if (item.value > max) {
      max = item.value;
    }
  }
  if (max <= 0) {
    return 1;
  }
  return max;
});

function statusBarWidth(value) {
  const ratio = value / statusChartMax.value;
  return `${Math.round(ratio * 100)}%`;
}

const trendChartItems = computed(() => {
  const buckets = {};
  for (const record of exampleList) {
    const dayKey = record.createTime.slice(0, 10);
    if (!buckets[dayKey]) {
      buckets[dayKey] = 0;
    }
    buckets[dayKey] += 1;
  }
  const dayKeys = Object.keys(buckets).sort();
  const pickedDays = dayKeys.slice(-7);
  const items = [];
  for (const dayKey of pickedDays) {
    items.push({
      key: dayKey,
      label: dayKey.slice(5),
      value: buckets[dayKey],
    });
  }
  return items;
});

const trendChartMax = computed(() => {
  let max = 0;
  for (const item of trendChartItems.value) {
    if (item.value > max) {
      max = item.value;
    }
  }
  if (max <= 0) {
    return 1;
  }
  return max;
});

function trendBarHeight(value) {
  const ratio = value / trendChartMax.value;
  return `${Math.round(ratio * 100)}%`;
}

const metricCards = computed(() => {
  return [
    { key: "total", label: "示例记录", value: exampleList.length },
    { key: "draft", label: "草稿", value: countStatus("draft") },
    { key: "published", label: "已发布", value: countStatus("published") },
    { key: "archived", label: "已归档", value: countStatus("archived") },
  ];
});

const recentActivities = computed(() => {
  const copied = exampleList.slice();
  copied.sort((left, right) => {
    if (left.createTime < right.createTime) {
      return 1;
    }
    if (left.createTime > right.createTime) {
      return -1;
    }
    return 0;
  });
  return copied.slice(0, 6);
});

// 待办卡片徽标：仅统计未完成的条目，与铃铛未读数字视觉一致
const pendingTodoCount = computed(() => {
  let count = 0;
  for (const item of workbenchTodos) {
    if (!item.done) {
      count += 1;
    }
  }
  return count;
});

function handleSeeMore() {
  message.success("查看更多");
}

function handleMarkAllNotificationsRead() {
  playMarkAllRead(
    notificationState.notifications,
    () => {
      markAllNotificationsRead();
      message.success("通知已全部标记为已读");
    },
    () => notificationFeedRef.value?.getAnimateEl?.()
  );
}

function handleMarkAllAnnouncementsRead() {
  playMarkAllRead(
    notificationState.announcements,
    () => {
      markAllAnnouncementsRead();
      message.success("公告已全部标记为已读");
    },
    () => announcementFeedRef.value?.getAnimateEl?.()
  );
}

function statusLabel(status) {
  return findEnumLabel(EXAMPLE_STATUS, status);
}

function statusColor(status) {
  const matched = EXAMPLE_STATUS.find((item) => item.value === status);
  if (!matched) {
    return "default";
  }
  return matched.color;
}

function openExampleList() {
  router.push({ name: "example-list" });
}

function openTodo(todo) {
  if (todo.done) {
    return;
  }
  openExampleList();
}

function handleTodoRowClick(item) {
  openTodo(item);
}

function handleActivityRowClick() {
  openExampleList();
}

// 窄栏动态列表用短日期，避免完整时间戳把布局挤乱
function formatActivityTime(createTime) {
  if (!createTime) {
    return "";
  }
  if (createTime.length >= 16) {
    const monthDay = createTime.slice(5, 10);
    const hourMinute = createTime.slice(11, 16);
    return `${monthDay} ${hourMinute}`;
  }
  return createTime;
}

function openShortcut(item) {
  router.push({ name: item.routeName });
}

// 打开时复制一份当前已选值，弹窗内的勾选在保存前不影响卡片
function openManageModal() {
  manageForm.routeNames = [...selectedRouteNames.value];
  manageModalOpen.value = true;
}

function closeManageModal() {
  manageModalOpen.value = false;
}

function handleManageModalOpenChange(open) {
  manageModalOpen.value = open;
}

// 下拉节点标题后的对号依据弹窗内的临时选择，而非已保存的卡片数据
function isRouteChecked(routeName) {
  return manageForm.routeNames.includes(routeName);
}

// 允许保存为空，卡片随之展示空状态
function submitManageShortcuts() {
  setShortcutRoutes(manageForm.routeNames);
  message.success("保存成功");
  closeManageModal();
}
</script>

<template>
  <div class="page-stack workbench-page">
    <a-row :gutter="[16, 16]" class="workbench-shell">
      <!-- 主内容区 -->
      <a-col :xs="24" :lg="19" class="workbench-main">
        <div class="workbench-main-stack">
          <a-row :gutter="[16, 16]">
            <a-col
              v-for="card in metricCards"
              :key="card.key"
              :xs="12"
              :md="6"
            >
              <a-card class="metric-card">
                <a-statistic :title="card.label" :value="card.value" />
              </a-card>
            </a-col>
          </a-row>

          <!-- 待办（原通知位）+ 通知（原公告位） -->
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :xl="12">
              <a-card class="workbench-section-card">
                <template #title>
                  <span class="workbench-section-card__title">待办</span>
                  <a-badge
                    :count="pendingTodoCount"
                    :show-zero="false"
                    class="workbench-section-card__count-badge"
                  />
                </template>
                <template #extra>
                  <a-button
                    type="link"
                    size="small"
                    class="workbench-section-card__extra"
                    @click="handleSeeMore"
                  >
                    查看更多
                  </a-button>
                </template>
                <ul class="workbench-unified-feed">
                  <li
                    v-for="item in workbenchTodos"
                    :key="item.id"
                    class="workbench-unified-feed__item workbench-unified-feed__item--todo"
                    :class="{ 'is-disabled': item.done }"
                    @click="handleTodoRowClick(item)"
                  >
                    <div class="workbench-unified-feed__body">
                      <div class="workbench-unified-feed__title-row">
                        <span class="workbench-unified-feed__title">
                          {{ item.recordName }}
                        </span>
                        <a-tag v-if="item.done" class="workbench-unified-feed__tag">
                          已完成
                        </a-tag>
                        <a-tag
                          v-else
                          color="blue"
                          class="workbench-unified-feed__tag"
                        >
                          待处理
                        </a-tag>
                      </div>
                      <div class="workbench-unified-feed__desc">
                        {{ item.note }}
                      </div>
                    </div>
                    <div
                      v-if="!item.done"
                      class="workbench-unified-feed__rail"
                    >
                      <span class="workbench-unified-feed__action-hint">
                        去处理
                      </span>
                    </div>
                  </li>
                </ul>
              </a-card>
            </a-col>
            <a-col :xs="24" :xl="12">
              <a-card class="workbench-section-card">
                <template #title>
                  <span class="workbench-section-card__title">通知</span>
                  <a-badge
                    :count="notificationState.notifications.length"
                    :show-zero="false"
                    class="workbench-section-card__count-badge"
                  />
                </template>
                <template #extra>
                  <div class="workbench-section-card__extra-group">
                    <a-button
                      type="link"
                      size="small"
                      class="workbench-section-card__extra"
                      :disabled="notificationState.notifications.length === 0"
                      @click="handleMarkAllNotificationsRead"
                    >
                      全部已读
                    </a-button>
                    <a-button
                      type="link"
                      size="small"
                      class="workbench-section-card__extra"
                      @click="handleSeeMore"
                    >
                      查看更多
                    </a-button>
                  </div>
                </template>
                <NotificationCenterFeed
                  ref="notificationFeedRef"
                  title="通知"
                  :items="notificationState.notifications"
                  :item-motion-class="itemMotionClass"
                />
              </a-card>
            </a-col>
          </a-row>

          <!-- 示例图表：填充主栏空白，数据与顶部指标同源 -->
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :xl="12">
              <a-card class="workbench-section-card workbench-chart-card">
                <template #title>
                  <span class="workbench-section-card__title">示例状态分布</span>
                </template>
                <div class="workbench-bar-chart">
                  <div
                    v-for="item in statusChartItems"
                    :key="item.key"
                    class="workbench-bar-chart__row"
                  >
                    <span class="workbench-bar-chart__label">{{ item.label }}</span>
                    <div class="workbench-bar-chart__track">
                      <div
                        class="workbench-bar-chart__fill"
                        :style="{
                          width: statusBarWidth(item.value),
                          backgroundColor: item.color,
                        }"
                      />
                    </div>
                    <span class="workbench-bar-chart__value">{{ item.value }}</span>
                  </div>
                </div>
              </a-card>
            </a-col>
            <a-col :xs="24" :xl="12">
              <a-card class="workbench-section-card workbench-chart-card">
                <template #title>
                  <span class="workbench-section-card__title">近 7 日新建趋势</span>
                </template>
                <div class="workbench-column-chart">
                  <div
                    v-for="item in trendChartItems"
                    :key="item.key"
                    class="workbench-column-chart__item"
                  >
                    <span class="workbench-column-chart__value">{{ item.value }}</span>
                    <div class="workbench-column-chart__bar-wrap">
                      <div
                        class="workbench-column-chart__bar"
                        :style="{ height: trendBarHeight(item.value) }"
                      />
                    </div>
                    <span class="workbench-column-chart__label">{{ item.label }}</span>
                  </div>
                </div>
              </a-card>
            </a-col>
          </a-row>
        </div>
      </a-col>

      <!-- 右侧窄栏：快捷入口 + 公告 + 最近动态 -->
      <a-col :xs="24" :lg="5" class="workbench-aside">
        <div class="workbench-aside-stack">
          <a-card class="workbench-section-card shortcut-panel">
            <template #title>
              <span class="workbench-section-card__title">快捷入口</span>
            </template>
            <!-- 增删统一在「管理」弹窗完成，卡片上不再提供单个删除入口 -->
            <template #extra>
              <a-button
                type="link"
                size="small"
                class="workbench-section-card__extra"
                @click="openManageModal"
              >
                管理
              </a-button>
            </template>

            <div v-if="allShortcuts.length > 0" class="shortcut-list">
              <div
                v-for="item in allShortcuts"
                :key="item.key"
                class="shortcut-item"
              >
                <button
                  type="button"
                  class="shortcut-main"
                  @click="openShortcut(item)"
                >
                  <span class="shortcut-icon-wrap" aria-hidden="true">
                    <component :is="item.icon" class="shortcut-icon" />
                  </span>
                  <span class="shortcut-label">{{ item.label }}</span>
                </button>
              </div>
            </div>
            <a-empty
              v-else
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="暂无快捷入口"
              class="shortcut-empty"
            />
          </a-card>

          <a-card class="workbench-section-card">
            <template #title>
              <span class="workbench-section-card__title">公告</span>
              <a-badge
                :count="notificationState.announcements.length"
                :show-zero="false"
                class="workbench-section-card__count-badge"
              />
            </template>
            <template #extra>
              <div class="workbench-section-card__extra-group">
                <a-button
                  type="link"
                  size="small"
                  class="workbench-section-card__extra"
                  :disabled="notificationState.announcements.length === 0"
                  @click="handleMarkAllAnnouncementsRead"
                >
                  全部已读
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  class="workbench-section-card__extra"
                  @click="handleSeeMore"
                >
                  查看更多
                </a-button>
              </div>
            </template>
            <NotificationCenterFeed
              ref="announcementFeedRef"
              title="公告"
              :items="notificationState.announcements"
              :item-motion-class="itemMotionClass"
            />
          </a-card>

          <a-card class="workbench-section-card">
            <template #title>
              <span class="workbench-section-card__title">最近动态</span>
            </template>
            <template #extra>
              <a-button
                type="link"
                size="small"
                class="workbench-section-card__extra"
                @click="handleSeeMore"
              >
                查看更多
              </a-button>
            </template>
            <ul class="workbench-unified-feed workbench-unified-feed--activity">
              <li
                v-for="item in recentActivities"
                :key="item.id"
                class="workbench-unified-feed__item workbench-unified-feed__item--activity"
                @click="handleActivityRowClick"
              >
                <div class="workbench-unified-feed__body">
                  <div class="workbench-unified-feed__title">
                    {{ item.name }}
                  </div>
                  <div class="workbench-unified-feed__meta-row">
                    <a-tag
                      size="small"
                      :color="statusColor(item.status)"
                      class="workbench-unified-feed__tag"
                    >
                      {{ statusLabel(item.status) }}
                    </a-tag>
                    <span class="workbench-unified-feed__time-inline">
                      {{ formatActivityTime(item.createTime) }}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </a-card>
        </div>
      </a-col>
    </a-row>

    <a-modal
      :open="manageModalOpen"
      title="管理快捷入口"
      wrap-class-name="view-example-modal"
      centered
      :mask-closable="false"
      destroy-on-close
      @update:open="handleManageModalOpenChange"
    >
      <a-form :model="manageForm" layout="vertical">
        <!-- 多选树：已选节点后显示对号，再次点击即取消；分组节点仅用于归类不可选 -->
        <a-form-item label="快捷入口页面" name="routeNames">
          <a-tree-select
            v-model:value="manageForm.routeNames"
            multiple
            placeholder="请选择左侧菜单页面"
            allow-clear
            tree-default-expand-all
            dropdown-match-select-width
            popup-class-name="workbench-shortcut-tree-dropdown"
            :tree-data="menuTreeSelectData"
            :dropdown-style="{
              maxHeight: '320px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }"
            style="width: 100%"
          >
            <template #title="{ title, value }">
              <span class="workbench-shortcut-tree-node">
                <span class="workbench-shortcut-tree-node__label">{{ title }}</span>
                <CheckOutlined
                  v-if="value && isRouteChecked(value)"
                  class="workbench-shortcut-tree-node__check"
                />
              </span>
            </template>
          </a-tree-select>
        </a-form-item>
      </a-form>
      <template #footer>
        <div class="modal-footer__right">
          <a-button @click="closeManageModal">取消</a-button>
          <a-button type="primary" @click="submitManageShortcuts">保存</a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.workbench-shell {
  width: 100%;
}

.workbench-main-stack {
  display: flex;
  flex-direction: column;
  gap: var(--page-section-gap);
  width: 100%;
}

.workbench-aside {
  align-self: flex-start;
  width: 100%;
}

.workbench-aside-stack {
  display: flex;
  flex-direction: column;
  gap: var(--page-section-gap);
  width: 100%;
}

/* 桌面端两栏独立滚动：断点与工作台单视口布局（global.css max-width: 992px）对齐，
   窄屏两栏上下排列，交回内容区整页自然滚动，避免嵌套滚动容器 */
@media (min-width: 993px) {
  /* 撑满内容区高度，使内容区自身不再出现滚动，滚动交给下方两栏 */
  .workbench-page {
    height: 100%;
  }

  /* 栅格默认可换行，两栏必须并排才能各自占满整列高度 */
  .workbench-shell {
    flex-wrap: nowrap;
    height: 100%;
  }

  /* contain 防止滚到底后继续带动外层滚动；
     两栏保留滚动能力但隐藏滚动条，写法与侧边栏一致 - RB-042 */
  .workbench-main,
  .workbench-aside {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
  }

  .workbench-main::-webkit-scrollbar,
  .workbench-aside::-webkit-scrollbar {
    display: none;
  }

  .workbench-aside {
    align-self: stretch;
  }
}

/* 窄栏内标题与 extra 按钮换行时仍可读 */
.workbench-aside :deep(.ant-card-head) {
  flex-wrap: wrap;
}

.workbench-aside .workbench-section-card__extra-group {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.metric-card :deep(.ant-card-body) {
  padding: 16px 20px;
}

/* 工作台分区卡片：通知 / 公告 / 待办 / 快捷入口标题与右上角操作统一 */
.workbench-section-card :deep(.ant-card-head) {
  min-height: 40px;
  padding: 0 16px;
}

.workbench-section-card :deep(.ant-card-head-title) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 0;
}

.workbench-section-card__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.88);
}

.workbench-section-card :deep(.ant-card-extra) {
  padding: 10px 0;
}

.workbench-section-card__extra {
  height: auto;
  padding: 0 4px;
  font-size: 13px;
  line-height: 22px;
}

.workbench-section-card__extra-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.workbench-section-card__count-badge :deep(.ant-badge-count) {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 11px;
  line-height: 16px;
  background: #ff4d4f;
  box-shadow: none;
}

.workbench-section-card :deep(.ant-card-body) {
  padding: 8px 16px 12px;
}

.workbench-chart-card :deep(.ant-card-body) {
  padding: 12px 16px 16px;
}

.workbench-bar-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 168px;
  justify-content: center;
}

.workbench-bar-chart__row {
  display: grid;
  grid-template-columns: 48px 1fr 28px;
  align-items: center;
  gap: 10px;
}

.workbench-bar-chart__label {
  font-size: 12px;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.65);
}

.workbench-bar-chart__track {
  height: 10px;
  border-radius: 5px;
  background: #f5f5f5;
  overflow: hidden;
}

.workbench-bar-chart__fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.4s ease;
}

.workbench-bar-chart__value {
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.88);
  text-align: right;
}

.workbench-column-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  min-height: 168px;
  padding-top: 8px;
}

.workbench-column-chart__item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  gap: 6px;
}

.workbench-column-chart__bar-wrap {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 112px;
}

.workbench-column-chart__bar {
  width: 70%;
  max-width: 28px;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(180deg, #69b1ff 0%, #1677ff 100%);
  transition: height 0.4s ease;
}

.workbench-column-chart__value {
  font-size: 12px;
  line-height: 18px;
  color: rgba(0, 0, 0, 0.45);
}

.workbench-column-chart__label {
  font-size: 11px;
  line-height: 16px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
}

.shortcut-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.shortcut-item {
  position: relative;
  min-width: 0;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
  overflow: hidden;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}

.shortcut-item:hover {
  border-color: #91caff;
  background: #fff;
  box-shadow: 0 1px 4px rgba(22, 119, 255, 0.12);
}

.shortcut-main {
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  min-width: 0;
  min-height: 52px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.shortcut-icon-wrap {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(22, 119, 255, 0.1);
}

/* 全部取消后的空状态，上下留白与列表区高度相近，避免卡片塌成一条 */
.shortcut-empty {
  margin: 12px 0;
}

.shortcut-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: #1677ff;
}

.shortcut-label {
  flex: 1;
  min-width: 0;
  color: rgba(0, 0, 0, 0.88);
  font-weight: 500;
  font-size: 13px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>

<!-- 下拉层挂到 body，样式不能 scoped -->
<style>
.workbench-shortcut-tree-dropdown .ant-select-tree-list-holder,
.workbench-shortcut-tree-dropdown .ant-select-tree-list-holder-inner {
  overflow-x: hidden !important;
}

.workbench-shortcut-tree-dropdown .ant-select-tree-treenode {
  width: 100%;
}

.workbench-shortcut-tree-dropdown .ant-select-tree-node-content-wrapper {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 标题撑满整行，对号固定在行尾，与普通多选下拉的已选标识位置一致 */
.workbench-shortcut-tree-dropdown .ant-select-tree-title {
  display: block;
}

.workbench-shortcut-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.workbench-shortcut-tree-node__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.workbench-shortcut-tree-node__check {
  flex-shrink: 0;
  color: #1677ff;
}
</style>
