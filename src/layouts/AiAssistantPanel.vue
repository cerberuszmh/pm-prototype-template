<script setup>
import { ref, computed, onBeforeUnmount } from "vue";
import { CloseOutlined, HolderOutlined } from "@ant-design/icons-vue";
import AiSparkleIcon from "./AiSparkleIcon.vue";
import { useAiAssistant } from "../composables/useAiAssistant";

// V0.x 修订：AI 智能助手由占位提示改为右侧挤压式面板，不遮挡系统操作页面 - RB-021
const { panelWidth, isNarrow, closePanel, setPanelWidth } = useAiAssistant();

// 窄屏由 CSS 全宽覆盖，不能再写死像素宽度，否则会覆盖媒体查询结果
const panelStyle = computed(() => {
  if (isNarrow.value) {
    return {};
  }
  return { width: `${panelWidth.value}px` };
});

// 面板贴右侧，宽度 = 视口右边缘到鼠标位置的距离
function handleResizeMove(event) {
  setPanelWidth(window.innerWidth - event.clientX);
}

// 拖拽中鼠标会离开把手，hover 样式失效，需用状态保持高亮，让用户知道仍在拖拽
const isResizing = ref(false);

// 拖拽期间禁用文本选择并固定光标，避免鼠标划过页面内容时出现大片选中或光标闪烁
function stopResize() {
  isResizing.value = false;
  window.removeEventListener("mousemove", handleResizeMove);
  window.removeEventListener("mouseup", stopResize);
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
}

function startResize(event) {
  event.preventDefault();
  isResizing.value = true;
  window.addEventListener("mousemove", handleResizeMove);
  window.addEventListener("mouseup", stopResize);
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
}

// 拖拽中途关闭面板或切换窄屏导致卸载时，必须清理全局监听与 body 样式
onBeforeUnmount(stopResize);
</script>

<template>
  <!-- 工作台内只保留同宽空白占位，负责挤压主内容区；窄屏全屏覆盖，不需要占位 -->
  <div v-if="!isNarrow" class="ai-panel-spacer" :style="panelStyle" aria-hidden="true" />

  <!-- 面板本体挂到 body：工作台布局自成层级范围，留在内部永远会被挂在 body 下的弹窗盖住 - RB-021 -->
  <Teleport to="body">
  <aside
    class="ai-panel"
    :class="{ 'ai-panel--narrow': isNarrow }"
    :style="panelStyle"
    aria-label="AI智能助手"
  >
    <!-- 左边缘拖拽条：仅桌面端挤压形态提供，窄屏全宽覆盖时无需调整宽度 -->
    <div
      v-if="!isNarrow"
      class="ai-panel__resizer"
      :class="{ 'is-resizing': isResizing }"
      role="separator"
      aria-orientation="vertical"
      aria-label="拖拽调整面板宽度"
      @mousedown="startResize"
    >
      <!-- 分界线中点的把手：纯细线不易被发现可拖拽，用把手给出明确示意 -->
      <span class="ai-panel__grip" aria-hidden="true">
        <HolderOutlined />
      </span>
    </div>

    <!-- 标题栏与工作台顶部栏同为 50px，左右两栏顶部分隔线对齐 -->
    <header class="ai-panel__header">
      <span class="ai-panel__title">
        <AiSparkleIcon class="ai-panel__title-icon" />
        <span>AI智能助手</span>
      </span>
      <a-button type="text" size="small" aria-label="关闭AI智能助手" @click="closePanel">
        <template #icon><CloseOutlined /></template>
      </a-button>
    </header>

    <!-- 原型阶段只交付面板外壳，内容区使用未来兑现型占位文案 -->
    <div class="ai-panel__body">
      <a-empty description="「AI智能助手」内容即将上线，敬请期待" />
    </div>
  </aside>
  </Teleport>
</template>

<style scoped>
/* 占位块作为工作台右侧一栏参与 flex 布局，宽度与面板一致，主内容区因此让出空间 */
.ai-panel-spacer {
  flex: none;
  height: 100%;
}

/*
 * 面板本体固定在视口最右侧，正好落在占位块上方。
 * 层级 1110 高于 Ant 弹窗遮罩（1000）、下拉与提示等浮层（≤1080）以及右下角按钮组（1100），
 * 因此任何弹窗打开时面板都不会被遮挡；弹窗自身通过 global.css 的 --ai-panel-offset 让出面板区域。
 */
.ai-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #ffffff;
  border-left: 1px solid #f0f0f0;
  z-index: 1110;
}

/* 窄屏空间不足以并排，改为全屏覆盖；层级不变，同样盖住按钮组与弹窗，关闭后恢复页面 */
.ai-panel.ai-panel--narrow {
  inset: 0;
  width: 100%;
  border-left: none;
}

/* 拖拽热区比可见线条更宽，降低鼠标对准难度；跨在边框上，左右各占一半 */
.ai-panel__resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -3px;
  width: 6px;
  cursor: col-resize;
  z-index: 1;
}

.ai-panel__resizer:hover,
.ai-panel__resizer.is-resizing {
  background: rgba(22, 119, 255, 0.35);
}

/* 把手跨在分界线上居中，一半落在主内容区一侧，保证从页面侧也能看到 */
/* 外观与右下角按钮组的拖拽把手（FloatActionGroup.vue 的 .float-action-group__handle）一致，须同步修改 */
.ai-panel__grip {
  position: absolute;
  top: 50%;
  left: 50%;
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
  transform: translate(-50%, -50%);
  transition:
    color 0.2s,
    border-color 0.2s;
}

.ai-panel__resizer:hover .ai-panel__grip,
.ai-panel__resizer.is-resizing .ai-panel__grip {
  color: #1677ff;
  border-color: #1677ff;
}

.ai-panel__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 12px 0 16px;
  border-bottom: 1px solid #f0f0f0;
}

.ai-panel__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

/* 标题星芒取 AI 品牌渐变中的紫色，与两个入口保持同一色彩语言 */
.ai-panel__title-icon {
  color: #722ed1;
  font-size: 16px;
}

/* 内容区独立滚动，不带动工作台左右区域 */
.ai-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}
</style>
