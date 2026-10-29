<script setup>
import AiSparkleIcon from "./AiSparkleIcon.vue";
import { useAiAssistant } from "../composables/useAiAssistant";

// V0.x 修订：新增右下角 AI 悬浮入口，与顶部栏左侧「AI智能助手」功能一致 - RB-020
// V0.x 修订：面板打开后不再隐藏悬浮入口，改为按下态并与顶部入口一样作为开关 - RB-024
const { visible, togglePanel } = useAiAssistant();

// tooltip 方向由按钮组按自身位置决定，只取 top / bottom - RB-020
defineProps({
  tooltipPlacement: {
    type: String,
    default: "top",
  },
});

// 层级高于 AI 面板（1110）：按钮组贴近面板时提示框不会被面板盖住半截
const TOOLTIP_OVERLAY_STYLE = { zIndex: 1120 };

function handleClick() {
  togglePanel();
}
</script>

<template>
  <!-- 位于右下角按钮组左侧，形状与定位由 FloatActionGroup 统一控制 -->
  <!-- Ant 悬浮按钮自带的 tooltip 固定向左弹出，会盖住左侧按钮，因此改用外包 tooltip 控制方向 -->
  <a-tooltip
    title="AI智能助手"
    :placement="tooltipPlacement"
    :overlay-style="TOOLTIP_OVERLAY_STYLE"
  >
    <a-float-button
      class="ai-assistant-fab"
      :class="{ 'is-pressed': visible }"
      aria-label="AI智能助手"
      :aria-pressed="visible"
      @click="handleClick"
    >
      <template #icon>
        <!-- 与顶部栏 AI 入口共用三星芒图标组件，保持两个入口视觉统一 -->
        <AiSparkleIcon class="ai-assistant-fab__star" />
      </template>
    </a-float-button>
  </a-tooltip>
</template>

<style scoped>
/* 按钮保持 Ant 默认白底，与组内告警按钮统一；彩色只落在星芒图标上 */

/*
 * 星芒用文字渐变着色，与顶部栏 AI 入口的文字渐变完全同步：
 * 同一组品牌色、同一 100deg 角度、同一 30s 周期（前 23.333% 流动、其余时间静止）。
 * 关键参数必须与 WorkspaceLayout.vue 的 workspaceAiTextGradient 同步修改，否则节奏会错位。
 */
.ai-assistant-fab__star {
  font-size: 16px;
  line-height: 1;
  color: transparent;
  background-image: linear-gradient(
    100deg,
    #1677ff 0%,
    #722ed1 24%,
    #eb2f96 48%,
    #13c2c2 72%,
    #1677ff 100%
  );
  background-size: 300% 100%;
  background-position: 0% 50%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: aiAssistantFabGradient 30s linear infinite;
}

/* Ant 默认把图标槽位固定为 18px 宽，三星芒整簇更宽会被裁掉右侧两颗，需放开宽度 */
.ai-assistant-fab.ant-float-btn :deep(.ant-float-btn-content .ant-float-btn-icon) {
  width: auto;
}

/* 按下态沿用 Ant 选中态色值：controlItemBgActive / controlItemBgActiveHover，不使用内凹阴影等非规范表现 */
/* 须覆盖 Ant 默认的灰色悬停底，否则悬停时看不出按下态 */
.ai-assistant-fab.ant-float-btn.is-pressed :deep(.ant-float-btn-body) {
  background-color: #e6f4ff;
}

.ai-assistant-fab.ant-float-btn.is-pressed:hover :deep(.ant-float-btn-body) {
  background-color: #bae0ff;
}

/* 流动节奏：0% → 23.333% 完成一轮流动，其余时间静止，与顶部栏 AI 入口同一相位定义 */
@keyframes aiAssistantFabGradient {
  0% {
    background-position: 0% 50%;
  }

  23.333%,
  100% {
    background-position: 300% 50%;
  }
}

/* 尊重系统减少动态效果设置，与顶部栏 AI 入口的降级策略一致 */
@media (prefers-reduced-motion: reduce) {
  .ai-assistant-fab__star {
    animation: none;
  }
}
</style>
