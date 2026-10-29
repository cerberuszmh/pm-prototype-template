<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { HolderOutlined } from "@ant-design/icons-vue";
import AiAssistantFab from "./AiAssistantFab.vue";
import AlarmFab from "./AlarmFab.vue";
import { useAiAssistant } from "../composables/useAiAssistant";

// V0.x 修订：右下角悬浮按钮统一为方形横排按钮组，组的 shape 会覆盖组内按钮的 shape - RB-020
// 定位只由外层容器控制，组内按钮不得再各自设置 right/bottom，否则会脱离组布局
const { panelOccupiedWidth } = useAiAssistant();

// V0.x 修订：按钮组可拖动到任意位置，避免盖住弹窗底部按钮等内容 - RB-020
// 拖动只能从按钮组左侧常显的拖拽把手发起，按钮本身只负责点击，光标保持点击手型 - RB-025
const DEFAULT_OFFSET = 24;
// 与可视区域边缘保留的最小距离，防止拖到屏幕外无法找回
const EDGE_MARGIN = 8;
// 移动超过该距离才算拖动，单纯按下拖拽条不切换为抓取光标
const DRAG_THRESHOLD = 4;

const containerRef = ref(null);
// 位置以「距可用区域右边、距视口底边」记录：AI 面板开合时按钮组随可用区域平移，不会钻到面板下方
// 仅保存在组件内存中：布局常驻，切换页面保持位置；刷新页面恢复默认
const offsetRight = ref(DEFAULT_OFFSET);
const offsetBottom = ref(DEFAULT_OFFSET);
const isDragging = ref(false);

// 视口与容器尺寸用于把位置限制在可视区域内；容器包含拖拽条
const viewportWidth = ref(window.innerWidth);
const viewportHeight = ref(window.innerHeight);
const containerWidth = ref(0);
const containerHeight = ref(0);

function measureContainer() {
  const el = containerRef.value;
  if (!el) {
    return;
  }
  containerWidth.value = el.offsetWidth;
  containerHeight.value = el.offsetHeight;
}

function clamp(value, min, max) {
  if (value > max) {
    return max;
  }
  if (value < min) {
    return min;
  }
  return value;
}

// 可用区域 = 视口扣除 AI 面板；拖动与渲染共用同一套范围，避免两处口径不一致
function clampRight(value) {
  const availableWidth = viewportWidth.value - panelOccupiedWidth.value;
  const maxRight = availableWidth - containerWidth.value - EDGE_MARGIN;
  return clamp(value, EDGE_MARGIN, maxRight);
}

function clampBottom(value) {
  const maxBottom = viewportHeight.value - containerHeight.value - EDGE_MARGIN;
  return clamp(value, EDGE_MARGIN, maxBottom);
}

// 渲染时再做一次收敛：拖动后若面板打开或窗口变小，按钮组自动回到可视范围内
const clampedRight = computed(() => clampRight(offsetRight.value));
const clampedBottom = computed(() => clampBottom(offsetBottom.value));

const containerStyle = computed(() => ({
  right: `${panelOccupiedWidth.value + clampedRight.value}px`,
  bottom: `${clampedBottom.value}px`,
}));

// V0.x 修订：tooltip 只出现在按钮组上方或下方，不出现在左右，避免盖住相邻按钮 - RB-020
// 提示框高度约 32px + 箭头与间距，容器（含拖拽条）上方不足该空间时改为向下弹出
const TOOLTIP_SPACE = 48;
const tooltipPlacement = computed(() => {
  const containerTop = viewportHeight.value - clampedBottom.value - containerHeight.value;
  if (containerTop < TOOLTIP_SPACE) {
    return "bottom";
  }
  return "top";
});

// ── 拖动（仅拖拽条） ──
let startX = 0;
let startY = 0;
let startRight = 0;
let startBottom = 0;
let pointerActive = false;

function handlePointerMove(event) {
  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;
  if (!isDragging.value) {
    const moved = Math.abs(deltaX) + Math.abs(deltaY);
    if (moved < DRAG_THRESHOLD) {
      return;
    }
    isDragging.value = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  }
  // 以右下角为锚点，鼠标向右/向下移动时距离减小
  // 拖动中即时收敛，松手后记录的就是实际可见位置，避免越界值在面板关闭后让按钮组跳位
  offsetRight.value = clampRight(startRight - deltaX);
  offsetBottom.value = clampBottom(startBottom - deltaY);
}

function stopDrag() {
  pointerActive = false;
  isDragging.value = false;
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("pointerup", stopDrag);
  window.removeEventListener("pointercancel", stopDrag);
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
}

function handleHandlePointerDown(event) {
  // 只响应主键（鼠标左键 / 触摸 / 笔），右键保留浏览器默认菜单
  if (event.button !== 0 || pointerActive) {
    return;
  }
  // 阻止浏览器原生拖拽与文字选择：原生拖拽一旦启动会接管后续指针事件，按钮组会停在半路且收不到松手
  event.preventDefault();
  pointerActive = true;
  measureContainer();
  startX = event.clientX;
  startY = event.clientY;
  startRight = clampedRight.value;
  startBottom = clampedBottom.value;
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
}

function handleResize() {
  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
  measureContainer();
}

onMounted(() => {
  measureContainer();
  window.addEventListener("resize", handleResize);
});

// 拖动中途卸载（如退出登录跳转）时必须清理全局监听与 body 样式
onBeforeUnmount(() => {
  stopDrag();
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <div
    ref="containerRef"
    class="float-action-group"
    :class="{ 'is-dragging': isDragging }"
    :style="containerStyle"
  >
    <!-- 常显拖拽把手：唯一的拖动热区，按钮上按下不会触发拖动；外观与 AI 面板分界线把手一致 -->
    <div
      class="float-action-group__handle"
      @pointerdown="handleHandlePointerDown"
      @dragstart.prevent
    >
      <HolderOutlined />
    </div>
    <a-float-button-group class="float-action-group__buttons" shape="square">
      <!-- AI 入口在左：常驻显示，面板打开时呈按下态 - RB-024 -->
      <AiAssistantFab :tooltip-placement="tooltipPlacement" />
      <!-- 告警入口在右：常驻显示，徽标位于按钮组外侧右上角 -->
      <AlarmFab :tooltip-placement="tooltipPlacement" />
    </a-float-button-group>
  </div>
</template>

<style scoped>
/*
 * 外层容器负责固定定位与拖动，内部 Ant 按钮组退回普通流布局，拖拽把手位于按钮组左侧。
 */
.float-action-group {
  position: fixed;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  /* 层级高于 Ant 弹窗遮罩（1000）及下拉、提示等浮层（≤1080），任何弹窗打开时仍可点击 - RB-021 */
  /* 必须低于 AI 面板（1110），窄屏全屏面板需盖住按钮组 */
  z-index: 1100;
}

/*
 * 拖拽把手：尺寸、描边、圆角、阴影与悬停配色和 AI 面板分界线把手（AiAssistantPanel.vue 的 .ai-panel__grip）一致，
 * 两处须同步修改，保证全局只有一种拖拽把手外观；高度 40px 与悬浮按钮等高。
 */
.float-action-group__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 40px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 7px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  cursor: grab;
  /* 禁止触摸设备把拖动识别为页面滚动，否则手指拖不动按钮组 */
  touch-action: none;
  transition:
    color 0.2s,
    border-color 0.2s;
}

/* 悬停或拖动中变为主色，提示「按住可拖动」 */
.float-action-group__handle:hover,
.float-action-group.is-dragging .float-action-group__handle {
  color: #1677ff;
  border-color: #1677ff;
}

.float-action-group.is-dragging .float-action-group__handle {
  cursor: grabbing;
}

/*
 * Ant 方形按钮组只支持竖排（组宽固定 40px、按钮间底部分隔线、首尾上下圆角），
 * 横排需整体覆盖：组改为 flex 行布局，圆角与分隔线改为左右方向。
 * 选择器权重须高于 Ant 的 .ant-float-btn-group-square .ant-float-btn-square:first-child。
 */
.float-action-group__buttons.ant-float-btn-group {
  /* Ant 按钮组默认自带 fixed 定位与右下偏移，定位已交给外层容器，这里须还原为普通流 */
  position: static;
  display: flex;
  flex-direction: row;
  width: auto;
}

.float-action-group__buttons > :deep(.ant-float-btn) {
  border-radius: 0;
  border-bottom: none;
}

.float-action-group__buttons > :deep(.ant-float-btn:not(:last-child)) {
  border-right: 1px solid rgba(5, 5, 5, 0.06);
}

.float-action-group__buttons > :deep(.ant-float-btn:first-child) {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.float-action-group__buttons > :deep(.ant-float-btn:last-child) {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .float-action-group__handle {
    transition: none;
  }
}
</style>
