<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { DownOutlined, UpOutlined } from "@ant-design/icons-vue";

// V0.x 修订：筛选栏按可用宽度自动折叠，一行放不下时提供展开/收起 - RB-032
// 筛选项通过默认插槽传入（a-form-item），查询/重置统一由本组件提供，
// 保证各列表页的按钮位置、折叠口径一致
const emit = defineEmits(["search", "reset"]);

const rootRef = ref(null);
const expanded = ref(false);
// 是否存在放不下的筛选项；为 false 时不显示展开/收起按钮
const overflow = ref(false);
// 收起状态下第一行能容纳的筛选项数量
let collapsedCount = Infinity;
let lastWidth = 0;
let observer = null;

// 插槽内容直接渲染为 form 的子元素，按类名区分筛选项与操作区
function getParts() {
  const form = rootRef.value?.querySelector(".ant-form");
  if (!form) {
    return null;
  }
  const children = Array.from(form.children);
  const actions = children.find((el) =>
    el.classList.contains("filter-bar__actions")
  );
  const items = children.filter((el) => el !== actions);
  const toggle = form.querySelector(".filter-bar__toggle");
  return { form, items, actions, toggle };
}

// 换行判断需要计入右外边距，否则会把刚好放不下的项误判为放得下
function outerWidth(el) {
  const margin = parseFloat(getComputedStyle(el).marginInlineEnd) || 0;
  return el.offsetWidth + margin;
}

function applyVisibility(parts) {
  parts.items.forEach((el, index) => {
    const showAll = expanded.value || !overflow.value;
    const visible = showAll || index < collapsedCount;
    el.style.display = visible ? "" : "none";
  });
}

// 测量期间临时显示全部筛选项和切换按钮，读取宽度后立即恢复；
// 整个过程同步完成、不经过浏览器绘制，界面不会闪烁
function measure() {
  const parts = getParts();
  if (!parts || !parts.actions || !parts.toggle) {
    return;
  }
  const containerWidth = parts.form.clientWidth;
  // 标签页缓存隐藏时宽度为 0，测量无意义，保留上次结果
  if (containerWidth === 0) {
    return;
  }
  parts.items.forEach((el) => {
    el.style.display = "";
  });
  const toggleDisplay = parts.toggle.style.display;
  parts.toggle.style.display = "none";
  const actionsWidth = outerWidth(parts.actions);
  parts.toggle.style.display = "";
  const actionsWithToggleWidth = outerWidth(parts.actions);
  parts.toggle.style.display = toggleDisplay;

  const itemWidths = parts.items.map(outerWidth);
  const totalWidth = itemWidths.reduce((sum, width) => sum + width, 0);

  if (totalWidth + actionsWidth <= containerWidth) {
    overflow.value = false;
    // 全部放得下后不再需要展开态，下次变窄时从收起开始
    expanded.value = false;
    collapsedCount = itemWidths.length;
  } else {
    overflow.value = true;
    let usedWidth = actionsWithToggleWidth;
    let count = 0;
    for (const width of itemWidths) {
      if (usedWidth + width > containerWidth) {
        break;
      }
      usedWidth += width;
      count += 1;
    }
    // 极窄时至少保留一个条件，避免收起后只剩按钮
    collapsedCount = Math.max(count, 1);
  }
  applyVisibility(parts);
}

function toggleExpanded() {
  expanded.value = !expanded.value;
}

// 重置需同时恢复收起状态，避免界面状态与清空后的条件不一致
function handleReset() {
  expanded.value = false;
  emit("reset");
}

function handleSearch() {
  emit("search");
}

watch(expanded, () => {
  const parts = getParts();
  if (parts) {
    applyVisibility(parts);
  }
});

// 只响应宽度变化：显隐筛选项会改变高度，若也响应高度会反复触发测量
onMounted(() => {
  observer = new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width;
    if (width === lastWidth) {
      return;
    }
    lastWidth = width;
    measure();
  });
  observer.observe(rootRef.value);
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<template>
  <div ref="rootRef" class="filter-bar">
    <a-form layout="inline">
      <slot />
      <a-form-item class="filter-bar__actions">
        <!-- 不用 a-space：隐藏的切换按钮仍会保留 a-space 的包裹层和间距 -->
        <div class="filter-bar__buttons">
          <a-button
            v-show="overflow"
            type="link"
            class="filter-bar__toggle"
            @click="toggleExpanded"
          >
            {{ expanded ? "收起" : "展开" }}
            <UpOutlined v-if="expanded" class="filter-bar__toggle-icon" />
            <DownOutlined v-else class="filter-bar__toggle-icon" />
          </a-button>
          <a-button type="primary" @click="handleSearch">查询</a-button>
          <a-button @click="handleReset">重置</a-button>
        </div>
      </a-form-item>
    </a-form>
  </div>
</template>

<style scoped>
.filter-bar__buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 链接按钮左右内边距收窄，避免与查询按钮之间显得空隙过大 */
.filter-bar__toggle {
  padding-inline: 4px;
}

/* 文字在前、方向图标在后，图标与文字保持小间距 */
.filter-bar__toggle-icon {
  margin-inline-start: 4px;
  font-size: 12px;
}
</style>
