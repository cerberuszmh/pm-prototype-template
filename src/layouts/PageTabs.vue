<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ReloadOutlined, MoreOutlined } from "@ant-design/icons-vue";
import { useOpenedTabs } from "../composables/useOpenedTabs";

// 全局共享的已打开页签状态 + 操作方法
const {
  state,
  syncFromRoute,
  closeTab,
  reloadCurrent,
  closeOthers,
  closeLeft,
  closeRight,
  closeAll,
} = useOpenedTabs();

const route = useRoute();
const router = useRouter();

// ── 右键菜单状态 ──
// 受控浮层：用 fixed 定位 + 鼠标坐标渲染，不依赖 a-dropdown 触发器
// 注意：必须在 watch(immediate:true) 之前声明，避免 TDZ 错误（watch 立即执行回调时引用此变量）
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  // 当前右键命中的 tab key，决定菜单项启用状态
  targetKey: "",
});

// 监听路由变化：进入新页面追加 tab，回到旧页面只激活
// immediate 让初始进入也走一次同步，确保非首页直链时能补齐"系统首页 + 当前页"两个 tab
// 拆分为两个 watch，避免"同步 tab"与"关闭浮层"两个职责耦合在同一回调
watch(
  () => route.fullPath,
  () => {
    syncFromRoute(route);
  },
  { immediate: true }
);

// 路由切换时关闭可能残留的右键浮层，避免菜单"跟错 tab"
// 不需要 immediate：初次进入页面时浮层本就处于关闭状态
watch(
  () => route.fullPath,
  () => {
    contextMenu.visible = false;
  }
);

// 用户点击非激活 tab：路由跳转，状态由 watch 同步
function handleChange(targetKey) {
  if (targetKey === state.activeKey) {
    return;
  }
  const target = state.tabs.find((t) => t.key === targetKey);
  if (target) {
    router.push(target.path);
  }
}

// 用户点击 tab 上的 X：仅 remove 事件触发关闭逻辑
// editable-card 模式同时会派发 add 事件，这里通过 action 区分
function handleEdit(targetKey, action) {
  if (action !== "remove") {
    return;
  }
  const nextPath = closeTab(targetKey);
  if (nextPath) {
    router.push(nextPath);
  }
}

// 面包屑数据：系统首页 → 父级模块（如有）→ 当前页
const breadcrumbItems = computed(() => {
  const items = [{ title: "系统首页", to: "/" }];
  if (route.meta?.parentTitle) {
    items.push({ title: route.meta.parentTitle });
  }
  if (route.path !== "/") {
    items.push({ title: route.meta?.title ?? route.path });
  }
  return items;
});

// ── 刷新当前 tab ──
// 仅当点击的就是激活 tab 时才允许刷新，避免误把其他 tab 的图标挪到激活上
function handleReload(targetKey) {
  if (targetKey !== state.activeKey) {
    return;
  }
  reloadCurrent();
}

// 计算每一项菜单的禁用状态，集中放 computed 减少模板里的 v-if 嵌套
const menuFlags = computed(() => {
  const key = contextMenu.targetKey;
  const idx = state.tabs.findIndex((t) => t.key === key);
  // 右键空白或 tab 已关闭时，所有项都禁用
  if (idx < 0) {
    return {
      canReload: false,
      canClose: false,
      canCloseOthers: false,
      canCloseLeft: false,
      canCloseRight: false,
      canCloseAll: false,
    };
  }
  const isHome = key === "home";
  // 左侧除 home 外是否还有可关闭项
  const hasClosableLeft = state.tabs
    .slice(0, idx)
    .some((t) => t.closable);
  // 右侧是否还有 tab
  const hasRight = idx < state.tabs.length - 1;
  // "关闭其他"：除 home 与自身之外是否还有 tab
  const hasOthers = state.tabs.some(
    (t) => t.key !== "home" && t.key !== key
  );
  // "关闭所有"：除 home 外是否还有任何 tab
  const hasAnyClosable = state.tabs.some((t) => t.closable);
  return {
    canReload: key === state.activeKey,
    canClose: !isHome,
    canCloseOthers: hasOthers,
    canCloseLeft: hasClosableLeft,
    canCloseRight: hasRight,
    canCloseAll: hasAnyClosable,
  };
});

// tab 上的 contextmenu：先 closest 到 .ant-tabs-tab，再在其子树内取 [data-tab-key]
// 之所以不直接读 .ant-tabs-tab 的 data-node-key，是因为 AntD Vue 4.x 不在外层挂这个属性，
// key 只透传到内层 div#rc-tabs-X-tab-{key} 的 id 里；用我们自己 #tab slot 加的属性更稳
function handleContextMenu(e) {
  // 仅响应命中具体 tab 节点的右键，空白处右键交给浏览器默认菜单
  const tabEl = e.target.closest(".ant-tabs-tab");
  if (!tabEl) {
    return;
  }
  const keyEl = tabEl.querySelector("[data-tab-key]");
  const key = keyEl ? keyEl.getAttribute("data-tab-key") : null;
  if (!key) {
    return;
  }
  e.preventDefault();
  contextMenu.targetKey = key;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.visible = true;
}

// 全局点击 / Esc 关闭右键菜单，避免菜单"粘"在屏幕上
function handleGlobalClick() {
  if (contextMenu.visible) {
    contextMenu.visible = false;
  }
}
function handleGlobalKeydown(e) {
  if (e.key === "Escape" && contextMenu.visible) {
    contextMenu.visible = false;
  }
}
// 副作用注册放入 onMounted，遵循 Vue 3 lifecycle 实践
// 便于未来引入 SSR 或 Vitest 单元测试时正确隔离 window 依赖
onMounted(() => {
  window.addEventListener("click", handleGlobalClick);
  window.addEventListener("keydown", handleGlobalKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener("click", handleGlobalClick);
  window.removeEventListener("keydown", handleGlobalKeydown);
});

// 右键菜单点击：根据 action 调用对应方法，再统一关闭浮层
function handleMenuAction(action) {
  const key = contextMenu.targetKey;
  contextMenu.visible = false;
  // 浮层关闭后立即跳转，路由切换在 closeXxx 内部按需返回 path
  if (action === "reload") {
    if (key === state.activeKey) {
      reloadCurrent();
    }
    return;
  }
  if (action === "close") {
    const next = closeTab(key);
    if (next) {
      router.push(next);
    }
    return;
  }
  if (action === "closeOthers") {
    const next = closeOthers(key);
    if (next) {
      router.push(next);
    }
    return;
  }
  if (action === "closeLeft") {
    // closeLeft 与 closeRight 对称返回目标 path
    // 激活 tab 在被裁掉左侧时返回非空 path，否则 null（无需跳转）
    const next = closeLeft(key);
    if (next) {
      router.push(next);
    }
    return;
  }
  if (action === "closeRight") {
    const next = closeRight(key);
    if (next) {
      router.push(next);
    }
    return;
  }
  if (action === "closeAll") {
    const next = closeAll();
    if (next) {
      router.push(next);
    }
  }
}

// ── 标签栏右侧三点菜单 ──
// 仅 3 项，菜单项启用规则与右键菜单一致，但 target 锁定为当前激活 tab
const moreMenuFlags = computed(() => {
  const key = state.activeKey;
  const hasOthers = state.tabs.some(
    (t) => t.key !== "home" && t.key !== key
  );
  const hasAnyClosable = state.tabs.some((t) => t.closable);
  return {
    canReload: true,
    canCloseOthers: hasOthers,
    canCloseAll: hasAnyClosable,
  };
});

function handleMoreMenu({ key }) {
  const activeKey = state.activeKey;
  if (key === "reload") {
    reloadCurrent();
    return;
  }
  if (key === "closeOthers") {
    const next = closeOthers(activeKey);
    if (next) {
      router.push(next);
    }
    return;
  }
  if (key === "closeAll") {
    const next = closeAll();
    if (next) {
      router.push(next);
    }
  }
}

// 控制右键浮层是否完全离屏：避免初始 0,0 闪烁
const menuStyle = computed(() => ({
  top: `${contextMenu.y}px`,
  left: `${contextMenu.x}px`,
}));
</script>

<template>
  <!-- 顶部页面导航条：tab 栏 + 面包屑栏共享同一片白色容器 -->
  <div class="workspace-tabs">
    <!-- ── tab 栏：承载已打开页面集合，在容器上委托 contextmenu 实现右键菜单 ── -->
    <div class="workspace-tabs__bar" @contextmenu="handleContextMenu">
      <a-tabs
        type="editable-card"
        hide-add
        :active-key="state.activeKey"
        class="workspace-tabs__inner"
        @change="handleChange"
        @edit="handleEdit"
      >
        <a-tab-pane
          v-for="tab in state.tabs"
          :key="tab.key"
          :closable="tab.closable"
        >
          <!-- 自定义 tab 标题：激活态尾部追加刷新图标，非激活仅显示文字
               data-tab-key 属性用于 contextmenu 委托时反查 tab key -->
          <template #tab>
            <span class="workspace-tabs__tab" :data-tab-key="tab.key">
              <span class="workspace-tabs__tab-title">{{ tab.title }}</span>
              <ReloadOutlined
                v-if="tab.key === state.activeKey"
                class="workspace-tabs__tab-reload"
                @click.stop="handleReload(tab.key)"
              />
            </span>
          </template>
        </a-tab-pane>

        <!-- 标签栏右侧三点入口：放快捷操作集合 -->
        <template #rightExtra>
          <!-- 鼠标悬停即展开下拉菜单，无需点击；AntD 自动维护"按钮 + 菜单"整体 hover 区域，鼠标在两者间移动不会误关 -->
          <a-dropdown :trigger="['hover']" placement="bottomRight">
            <a-button
              type="text"
              size="small"
              class="workspace-tabs__more"
              aria-label="更多操作"
            >
              <template #icon><MoreOutlined /></template>
            </a-button>
            <template #overlay>
              <a-menu @click="handleMoreMenu">
                <a-menu-item key="reload" :disabled="!moreMenuFlags.canReload">
                  刷新当前
                </a-menu-item>
                <a-menu-item
                  key="closeOthers"
                  :disabled="!moreMenuFlags.canCloseOthers"
                >
                  关闭其他
                </a-menu-item>
                <a-menu-item
                  key="closeAll"
                  :disabled="!moreMenuFlags.canCloseAll"
                >
                  关闭所有
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </a-tabs>
    </div>

    <!-- ── 面包屑栏：紧贴 tab 栏下方，共用白底 ── -->
    <div class="workspace-tabs__crumb">
      <a-breadcrumb>
        <a-breadcrumb-item
          v-for="item in breadcrumbItems"
          :key="`${item.title}-${item.to ?? ''}`"
        >
          <router-link v-if="item.to" :to="item.to">{{ item.title }}</router-link>
          <span v-else>{{ item.title }}</span>
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- ── 右键菜单浮层：fixed 定位到鼠标坐标，window click / Esc 关闭 ── -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="workspace-tabs__context"
        :style="menuStyle"
        @click.stop
      >
        <a-menu :selectable="false">
          <a-menu-item
            :disabled="!menuFlags.canReload"
            @click="handleMenuAction('reload')"
          >
            刷新当前
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item
            :disabled="!menuFlags.canClose"
            @click="handleMenuAction('close')"
          >
            关闭
          </a-menu-item>
          <a-menu-item
            :disabled="!menuFlags.canCloseOthers"
            @click="handleMenuAction('closeOthers')"
          >
            关闭其他
          </a-menu-item>
          <a-menu-item
            :disabled="!menuFlags.canCloseLeft"
            @click="handleMenuAction('closeLeft')"
          >
            关闭左侧
          </a-menu-item>
          <a-menu-item
            :disabled="!menuFlags.canCloseRight"
            @click="handleMenuAction('closeRight')"
          >
            关闭右侧
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item
            :disabled="!menuFlags.canCloseAll"
            @click="handleMenuAction('closeAll')"
          >
            关闭所有
          </a-menu-item>
        </a-menu>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* 容器：白底 + 底部 1px 分隔线，承载 tab 栏 + 面包屑栏两个子区 */
.workspace-tabs {
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

/* tab 栏：左右内边距 20px，顶部 6px；底线由 AntD `.ant-tabs-nav::before` 提供，
   激活 tab 会自动用白底"切断"该线一段，形成浏览器 tab 风格的凹口连接 */
.workspace-tabs__bar {
  padding: 6px 20px 0;
}

/* 移除 AntD 默认 nav 下方 16px 外边距，避免 tab 栏与面包屑栏之间出现额外空白 */
.workspace-tabs :deep(.ant-tabs-nav) {
  margin: 0;
}

/* 单个 tab 高度 32px，line-height 减 2px 留出顶边视觉空间
   左右内边距分别为 10/8：右侧内边距偏小是为补偿 close/reload 图标 16x16 命中区
   两侧 2px 视觉留白，使"左边缘→标题 10px"与"关闭→右边缘 10px(2+8)"严格对称 */
.workspace-tabs :deep(.ant-tabs-tab) {
  height: 32px;
  line-height: 30px;
  padding: 0 8px 0 10px;
}

/* 自定义 tab 标题容器：横向排布"标题 + 刷新图标"
   font-size: 0 用于消除 inline-flex 子节点之间空白文本节点的视觉宽度
   （Vue 模板换行/缩进会被编译为空白文本节点，按字号占据 ~4px×N 宽度）
   不使用 gap：空白文本节点即使宽度为 0，也可能参与 flex gap 计算并撑大容器 */
.workspace-tabs__tab {
  display: inline-flex;
  align-items: center;
  font-size: 0;
}

/* 因父级 font-size: 0，标题文字需显式还原；用 margin 控制标题到刷新按钮的距离，避免 gap 误算 */
.workspace-tabs__tab-title {
  font-size: 14px;
  margin-right: 4px;
}

/* 刷新与关闭按钮共享基础图标样式：默认中性灰 + hover 主蓝 + hover 浅灰底
   关闭按钮维持 16x16 命中区；刷新图标因 C 型右侧视觉留白较大，下面单独收窄宽度 */
.workspace-tabs__tab-reload,
.workspace-tabs :deep(.ant-tabs-tab-with-remove .ant-tabs-tab-remove) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  color: #8c8c8c;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 2px;
  transition: color 0.2s, background-color 0.2s;
}

/* C 型刷新图标右侧留白更明显，单独收窄容器以抵消视觉空隙；
   只改宽度不改高度，避免影响 tab 垂直对齐与 hover 背景高度 */
.workspace-tabs__tab-reload {
  width: 12px;
}

.workspace-tabs__tab-reload:hover,
.workspace-tabs :deep(.ant-tabs-tab-with-remove .ant-tabs-tab-remove):hover {
  color: #1677ff;
  background: rgba(0, 0, 0, 0.06);
}

/* 可关闭 tab 的文字区与关闭按钮之间，AntD 默认会保留额外空隙；
   这里先清空该空隙，再由关闭按钮自身 margin 统一控制"刷新→关闭"距离 */
.workspace-tabs :deep(.ant-tabs-tab-with-remove .ant-tabs-tab-btn) {
  margin-right: 0;
  padding-right: 0;
}

/* 关闭按钮与刷新图标保持 6px 视觉间距：margin 2px + 两侧 icon 各 2px 留白；
   与"标题→刷新"距离协调，并保留关闭按钮足够清晰的点击边界 */
.workspace-tabs :deep(.ant-tabs-tab-with-remove .ant-tabs-tab-remove) {
  margin-left: 2px;
}

/* 三点按钮：text 型按钮去掉默认背景与边框，仅作为图标入口
   颜色与 AntD 自带折叠按钮 .ant-tabs-nav-more 同步加深，保持视觉对齐
   右侧内边距置 0，使图标右边缘与标签栏右内边距对齐，与顶部操作区右边缘一致 */
.workspace-tabs__more.ant-btn,
.workspace-tabs :deep(.ant-tabs-nav-more) {
  border: none;
  box-shadow: none;
  padding: 0 0 0 8px;
  height: 32px;
  color: #595959;
}

.workspace-tabs__more.ant-btn:hover,
.workspace-tabs :deep(.ant-tabs-nav-more):hover {
  color: #1677ff;
  background: transparent;
}

/* 面包屑栏：flex + min-height 锁定 36px 视觉高度，让 ol 在白色区域内垂直居中 */
.workspace-tabs__crumb {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 0 20px;
  font-size: 12px;
}

/* AntD a-breadcrumb 默认 14px，强制收回 12px 与原 .workspace-breadcrumb 视觉一致 */
.workspace-tabs__crumb :deep(.ant-breadcrumb),
.workspace-tabs__crumb :deep(.ant-breadcrumb a),
.workspace-tabs__crumb :deep(.ant-breadcrumb-link) {
  font-size: 12px;
}

</style>

<!-- 右键菜单浮层被 Teleport 到 body，必须用非 scoped 样式才能命中
     视觉规范完整对齐 AntD .ant-dropdown 默认外观，与三点菜单保持一致 -->
<style>
.workspace-tabs__context {
  position: fixed;
  z-index: 1100;
  min-width: 144px;
  padding: 4px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

.workspace-tabs__context .ant-menu {
  border: none !important;
  background: transparent;
  box-shadow: none;
  padding: 0 !important;
}

/* 菜单项规格完全对齐 .ant-dropdown-menu-item：
   不强制 height，靠 padding 5/12 决定高度（5+22+5=32px），项间无 margin */
.workspace-tabs__context .ant-menu-vertical .ant-menu-item,
.workspace-tabs__context .ant-menu-item {
  height: auto !important;
  line-height: 22px !important;
  margin: 0 !important;
  padding: 5px 12px !important;
  border-radius: 4px !important;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.workspace-tabs__context .ant-menu-item:not(.ant-menu-item-disabled):hover {
  background: rgba(0, 0, 0, 0.04);
}

.workspace-tabs__context .ant-menu-item-divider {
  height: 1px;
  margin: 4px 0 !important;
  border-color: #f0f0f0;
}
</style>
