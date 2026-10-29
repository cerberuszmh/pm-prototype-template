import { ref, computed, watchEffect } from "vue";

// ── AI 智能助手面板全局状态 ──
// 顶部栏入口、右下角悬浮入口、告警悬浮按钮都要读取同一份开关与宽度，
// 采用模块作用域单例，与 useOpenedTabs 保持一致，无需引入 Pinia
const PANEL_DEFAULT_WIDTH = 380;
const PANEL_MIN_WIDTH = 320;
const PANEL_MAX_WIDTH = 720;

// 窄屏断点必须与 global.css 的 992px 响应式断点一致，否则挤压/覆盖两种形态会错位
const NARROW_QUERY = "(max-width: 992px)";

const visible = ref(false);
// 宽度只保存在当前会话，刷新页面后恢复默认，与标签页状态的会话级口径一致
const panelWidth = ref(PANEL_DEFAULT_WIDTH);

const narrowMedia = window.matchMedia(NARROW_QUERY);
const isNarrow = ref(narrowMedia.matches);
// 模块单例随应用整个生命周期存在，监听无需解绑
narrowMedia.addEventListener("change", (event) => {
  isNarrow.value = event.matches;
});

// 面板在视口右侧实际占用的宽度：桌面端面板打开时为面板宽度，其余情况为 0；
// 窄屏面板全屏覆盖、不并排，其他元素无需让位
const panelOccupiedWidth = computed(() => {
  if (visible.value && !isNarrow.value) {
    return panelWidth.value;
  }
  return 0;
});

// 弹窗、抽屉由 Ant 挂到 body 下，拿不到组件状态，只能通过根节点 CSS 变量让出面板区域 - RB-021
// global.css 中弹窗让位规则依赖该变量名，改名须同步修改
watchEffect(() => {
  document.documentElement.style.setProperty(
    "--ai-panel-offset",
    `${panelOccupiedWidth.value}px`
  );
});

function openPanel() {
  visible.value = true;
}

function closePanel() {
  visible.value = false;
}

function togglePanel() {
  visible.value = !visible.value;
}

// 最大宽度额外受视口一半限制，保证主操作页面始终保留不少于一半的可用宽度
function setPanelWidth(width) {
  const viewportLimit = Math.floor(window.innerWidth / 2);
  const maxWidth = Math.min(PANEL_MAX_WIDTH, viewportLimit);
  let nextWidth = width;
  if (nextWidth > maxWidth) {
    nextWidth = maxWidth;
  }
  if (nextWidth < PANEL_MIN_WIDTH) {
    nextWidth = PANEL_MIN_WIDTH;
  }
  panelWidth.value = nextWidth;
}

export function useAiAssistant() {
  return {
    visible,
    panelWidth,
    isNarrow,
    panelOccupiedWidth,
    openPanel,
    closePanel,
    togglePanel,
    setPanelWidth,
  };
}
