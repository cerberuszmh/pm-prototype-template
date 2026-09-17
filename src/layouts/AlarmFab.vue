<script setup>
import { computed } from "vue";
// 使用 WarningOutlined 图标表达告警语义，与通知中心铃铛图标做区分
import { WarningOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { alarmCount } from "../mock/alarms";

// 当前未处理告警数量，决定按钮外观、徽标与呼吸灯
// 使用 computed 保证 mock 数据变化后 UI 自动刷新
const count = computed(() => alarmCount());
const hasAlarm = computed(() => count.value > 0);

// 点击悬浮按钮：根据是否有告警给出差异化占位反馈
// 原型阶段未接入告警详情页，仅暴露操作结果提示
function handleClick() {
  if (hasAlarm.value) {
    message.warning(`当前存在 ${count.value} 条告警信息，请及时处理。`);
  } else {
    message.success("当前无告警信息。");
  }
}
</script>

<template>
  <!-- 使用 Ant Design Vue FloatButton 作为悬浮按钮，默认固定在右下角 -->
  <a-float-button
    class="alarm-fab"
    :class="{ 'alarm-fab--active': hasAlarm }"
    shape="circle"
    tooltip="告警信息"
    aria-label="告警信息"
    :badge="{ count: count, overflowCount: 99, showZero: false }"
    :style="{ right: '24px', bottom: '24px' }"
    @click="handleClick"
  >
    <!-- 数量超过 99 显示 99+，0 条告警时不显示徽标 -->
    <!-- 告警图标槽位，使用感叹号图标表达告警语义 -->
    <template #icon>
      <WarningOutlined />
    </template>
  </a-float-button>
</template>

<style scoped>
/* 无告警时：完全依赖 Ant Design FloatButton 默认样式（白底、深色图标、阴影） */

/* 有告警时：覆盖 root 与 body 背景为红色，并触发红色呼吸发光动画 */
.alarm-fab.ant-float-btn.alarm-fab--active,
.alarm-fab.ant-float-btn.alarm-fab--active :deep(.ant-float-btn-body),
.alarm-fab.ant-float-btn.alarm-fab--active :deep(.ant-float-btn-body:hover) {
  background: #ff4d4f;
}

.alarm-fab.ant-float-btn.alarm-fab--active {
  box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4);
  animation: alarm-fab-glow 2s ease-in-out infinite;
}

/* 有告警时：图标切换为白色，确保在红底上有足够对比度 */
.alarm-fab.ant-float-btn.alarm-fab--active :deep(.ant-float-btn-content .ant-float-btn-icon) {
  color: #ffffff;
}

/* 徽标覆盖：白底黑字，与红底按钮形成对比 */
.alarm-fab.ant-float-btn.alarm-fab--active :deep(.ant-badge-count) {
  background: #ffffff;
  color: rgba(0, 0, 0, 0.88);
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 红色呼吸发光动画：由实到虚的环形扩散，模拟告警呼吸提示 */
@keyframes alarm-fab-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(255, 77, 79, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
  }
}
</style>
