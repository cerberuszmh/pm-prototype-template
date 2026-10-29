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

// tooltip 方向由按钮组按自身位置决定，只取 top / bottom - RB-020
defineProps({
  tooltipPlacement: {
    type: String,
    default: "top",
  },
});

// 层级高于 AI 面板（1110）：告警按钮紧贴面板左缘时提示框不会被面板盖住半截
const TOOLTIP_OVERLAY_STYLE = { zIndex: 1120 };

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
  <!-- 位于右下角按钮组底部，形状与定位由 FloatActionGroup 统一控制 -->
  <!-- Ant 悬浮按钮自带的 tooltip 固定向左弹出，会盖住左侧 AI 按钮，因此改用外包 tooltip 控制方向 -->
  <a-tooltip
    title="告警信息"
    :placement="tooltipPlacement"
    :overlay-style="TOOLTIP_OVERLAY_STYLE"
  >
    <a-float-button
      class="alarm-fab"
      :class="{ 'alarm-fab--active': hasAlarm }"
      aria-label="告警信息"
      :badge="{ count: count, overflowCount: 99, showZero: false }"
      @click="handleClick"
    >
      <!-- 数量超过 99 显示 99+，0 条告警时不显示徽标 -->
      <!-- 告警图标槽位，使用感叹号图标表达告警语义 -->
      <template #icon>
        <WarningOutlined />
      </template>
    </a-float-button>
  </a-tooltip>
</template>

<style scoped>
/* 无告警时：完全依赖 Ant Design FloatButton 默认样式（白底、深色图标） */
/* 徽标也保持 Ant 默认红底白字，白底按钮上无需再做反色覆盖 */

/* 有告警时：只把图标改为红色，底色保持白色，与组内 AI 按钮视觉统一 */
.alarm-fab.ant-float-btn.alarm-fab--active :deep(.ant-float-btn-content .ant-float-btn-icon) {
  color: #ff4d4f;
}
</style>
