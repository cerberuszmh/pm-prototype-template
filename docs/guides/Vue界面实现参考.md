# Vue 界面实现参考

## 1. 文档定位

本文件保存 Vue 3 + Ant Design Vue 原型的实现示例、选择器细节和历史验证结论，不作为自动加载的强制规则。

强制约束以以下文件为准：

- `.cursor/rules/vue-ui-implementation.mdc`
- `.cursor/rules/vue-layout-navigation.mdc`
- `.cursor/rules/vue-list-view.mdc`
- `.cursor/rules/vue-modal.mdc`
- `.cursor/rules/mock-data.mdc`

当示例代码与规则或模块 SRS 冲突时，必须先按规则和 SRS 修正示例，不得反向降低约束。

## 2. 工作台滚动参考

桌面端采用 **顶部通栏 + 侧栏 + 主列** 混合布局：通栏 Header 占满顶宽，其下左侧菜单与右侧内容分别滚动。

```css
.workspace-layout {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.workspace-layout > .workspace-body.ant-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.workspace-sider {
  height: 100%;
  overflow: auto;
  scrollbar-width: none;
}

.workspace-body > .workspace-main.ant-layout {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

在 `max-width: 992px` 下，应把工作台恢复为 `height: auto; overflow: visible`，让页面自然滚动。

主列内标签栏吸顶（通栏 Header 在其上方，不参与 `.workspace-topbar`）：

```css
.workspace-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
}
```

不要分别固定通栏 Header 与标签栏并手工叠加偏移，否则动态高度变化时容易产生遮挡。

侧栏菜单去掉 Ant Design 内联菜单默认右边框，竖线只保留在 `aside.workspace-sider` 上，与底部折叠按钮对齐：

```css
.ant-layout-sider.workspace-sider .workspace-sider__menu.ant-menu {
  width: 100%;
  border-inline-end: none;
  border-right: none;
}
```

工作台页（`src/views/workbench/WorkbenchView.vue`）在桌面端撑满内容区，左侧主栏与右侧窄栏各自滚动并隐藏滚动条；窄屏不加这段样式，两栏上下排列、整页自然滚动：

```css
@media (min-width: 993px) {
  .workbench-page { height: 100%; }
  .workbench-shell { flex-wrap: nowrap; height: 100%; }

  .workbench-main,
  .workbench-aside {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain; /* 滚到底不带动外层 */
    scrollbar-width: none;
  }

  .workbench-main::-webkit-scrollbar,
  .workbench-aside::-webkit-scrollbar { display: none; }
}
```

## 3. 页面间距与列表卡参考

全局间距令牌：

```css
:root {
  --page-section-gap: 16px;
}

.workspace-content {
  padding: var(--page-section-gap) 20px;
}

.page-stack {
  display: flex;
  flex-direction: column;
  gap: var(--page-section-gap);
}
```

列表卡卡头左侧统一写明模块名称（取路由 `meta.title`），操作按钮放在 `#extra`；没有操作按钮的列表卡同样保留卡头。为取得四周 `10px` 的实测间距，可使用：

```vue
<script setup>
import { useRoute } from "vue-router";

// 与菜单、标签页同源，避免各处叫法不一致
const listTitle = useRoute().meta.title;
</script>

<template>
  <a-card :title="listTitle" :body-style="{ padding: '11px 10px 10px' }">
    <template #extra>
      <a-button type="primary">新建</a-button>
    </template>
    <!-- 顶部多出的 1px 用于补偿 Header 与 Body 的边框重叠 -->
    <a-table />
  </a-card>
</template>
```

## 4. PageTabs 实现提示

推荐使用 `<a-tabs type="editable-card" hide-add>`，系统首页设置 `closable: false`。

标签页状态可由模块级单例 composable 管理：

- `state.tabs`
- `state.activeKey`
- `syncFromRoute(route)`
- `closeTab(key)`
- `reloadKey`

路由同步放在 `PageTabs.vue`：

```js
watch(
  () => route.fullPath,
  () => {
    syncFromRoute(route);
    closeContextMenu();
  },
  { immediate: true },
);
```

如果 immediate watch 会访问 `contextMenu`，必须先声明 `reactive(contextMenu)`，否则 setup 会因暂时性死区抛错并导致白屏。

刷新当前标签页可通过 RouterView key 重新挂载：

```vue
<RouterView :key="`${$route.fullPath}#${reloadKey}`" />
```

右键菜单采用事件委托时，不要依赖 Ant Design Vue 外层标签节点存在 `data-node-key`。应在标签内容中自行写入 `data-tab-key`，再通过 `closest()` 和 `querySelector()` 定位。

Teleport 到 `body` 的浮层样式必须放在非 scoped 样式块中，否则 scoped 属性无法命中。

## 5. 弹窗结构参考

近全屏弹窗：

```vue
<a-modal
  :open="props.open"
  :title="dynamicTitle"
  width="calc(100vw - 48px)"
  :footer="null"
  :mask-closable="false"
  wrap-class-name="business-modal"
  @update:open="emit('update:open', $event)"
>
  <div class="modal-body-scroll">
    <!-- 正文只在此区域滚动 -->
  </div>
  <div class="modal-footer">
    <div class="modal-footer__left">
      <!-- 删除、作废等危险操作 -->
    </div>
    <div class="modal-footer__right">
      <!-- 取消、保存等常规操作 -->
    </div>
  </div>
</a-modal>
```

对应结构样式：

```css
.business-modal .ant-modal {
  top: 24px;
  margin: 0 auto;
  padding: 0;
  max-width: calc(100vw - 48px);
}

.business-modal .ant-modal-content {
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border-radius: 8px;
}

.business-modal .ant-modal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

.modal-body-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 40px;
}

.modal-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.modal-footer__left,
.modal-footer__right {
  display: flex;
  gap: 8px;
}

.modal-footer__right {
  margin-left: auto;
}
```

标准尺寸弹窗沿用相同 Flex 框体，大屏参考 `1200×600px`，小视口通过 `calc(100vw - 48px)` 与 `calc(100vh - 48px)` 保留安全边距。

完全全屏弹窗将容器调整为 `top: 0; max-width: 100%`，内容区最小高度为 `100vh`，并移除圆角。

## 6. 表单校验参考

必填字段必须同时挂载 `name` 和 `rules`：

```vue
<a-form-item
  label="项目名称"
  name="projectName"
  :rules="[{ required: true, message: '请输入项目名称', trigger: 'blur' }]"
>
  <a-input v-model:value="formState.projectName" />
</a-form-item>
```

统一校验失败行为：

```js
function handleSubmit() {
  formRef.value
    .validate()
    .then(() => {
      // 校验通过后再执行保存逻辑
      saveForm();
    })
    .catch((errorInfo) => {
      message.warning("请完善必填项后再操作");

      // 定位第一个错误字段，避免被固定标题区遮挡
      const firstField = errorInfo?.errorFields?.[0]?.name;
      const canScroll = firstField && formRef.value?.scrollToField;
      if (canScroll) {
        formRef.value.scrollToField(firstField, {
          behavior: "smooth",
          block: "center",
        });
      }
    });
}
```

字段不超过 3 个且始终完整显示在视口内时，可以省略自动滚动，但不能省略 Toast。

条件必填优先使用自定义 validator。只有动态 name、跨标签页或复杂跨字段联动难以接入 rules 时，才允许业务层校验，并必须在界面和 SRS 中明确条件。

## 7. 控件选型参考

- 日期：`a-date-picker` + `value-format="YYYY-MM-DD"`。
- 日期时间：`a-date-picker` + `show-time`。
- 数字、金额、面积：`a-input-number`；整数增加 `precision="0"`。
- 枚举单选：`a-select`。
- 枚举多选：`a-select mode="multiple"`，数据模型使用字符串数组。
- 长文本：`a-textarea`。
- 手机号：`a-input` + `maxlength="11"`。
- 系统只读状态：Tag + 灰色说明，禁止使用只读输入框。

只读状态参考：

```vue
<div class="readonly-status-wrap">
  <a-tag color="success">正常使用</a-tag>
  <span class="readonly-status-hint">新建记录默认状态，不可修改</span>
</div>
```

## 8. 登录页模板基线

当前模板登录页（`src/views/LoginView.vue`）的既有实现参数如下，仅用于复现模板，不作为所有业务项目的强制规则：

**整体结构**

- 顶层路由 `/login`，不使用 `WorkspaceLayout`。
- 全视口双栏：根容器 `position: fixed; inset: 0; overflow: hidden`，`grid-template-columns: minmax(0, 1.25fr) minmax(420px, 0.85fr)`，左宽右窄。
- 页面挂载时给 `html`、`body` 加 `login-page-open` 类、卸载时移除，保证登录页无滚动条且不影响工作台滚动。

**左栏（品牌氛围区）**

- 背景色 `#001529`，与工作台通栏一致。
- `::before` 叠加 `48px` 网格线底图（白色 8% 透明度），上下与右缘渐隐遮罩。
- `::after` 叠加三团蓝色径向色光，22 秒缓慢漂移与明暗呼吸；右缘遮罩，避免染到右栏。
- 品牌区靠上排列：`48px` 系统 Logo（直接展示，无底块）+ 系统名称（`clamp(26px, 3.2vw, 36px)`）+「AI 助力」渐变描边徽标，下方一行说明文案。

**右栏（登录区）**

- 浅灰底 `#f0f2f5`，左侧 1px 分隔线与阴影；内容在右栏内水平、垂直居中，最大宽度 `440px`，不贴右缘。
- 白底登录卡：圆角 `12px`，内边距 `40px 40px 32px`；标题「登录」，副标题「欢迎进入{系统名称}」。
- 表单：用户名、密码、验证码（输入框 + `105px` 验证码图块），均为 `large` 尺寸；登录按钮高 `46px`、通栏。
- 企业标识（`24px` Logo + 单位名称）位于登录卡**外部下方**，处在右栏浅底区，不放在左侧深色区。

**品牌与演示数据**

- 系统名称、系统 Logo、单位名称统一读取 `src/config/app.js` 的 `systemName`、`systemLogo`、`companyName`，禁止在组件内硬编码；当前 `systemLogo` 沿用公司 Logo。
- 浏览器 favicon 由 `src/main.js` 按 `systemLogo` 设置，与通栏品牌区（`28px`）、登录页品牌区（`48px`）使用同一 Logo 资源。
- 默认演示账号 `admin`、密码 `123456`；验证码 `A7K9` 仅展示、不参与校验。
- 登录成功只弹右上角欢迎通知（文案与登录卡副标题同源），不再重复 `message`。

**响应式与动效**

- `max-width: 900px`：改为上下单列，品牌区在上并隐藏说明文案，登录区在下。
- `max-width: 520px`：登录卡内边距收紧为 `28px 22px 24px`，验证码图块缩为 `80px`。
- `prefers-reduced-motion` 下停用左栏色光与「AI 助力」徽标动画。

真实项目必须用项目配置替换系统名称、单位名称和演示凭据，不得把本节内容误判为业务需求。

## 9. 验证提示

- 静态文案、字号、颜色和间距：回读修改区域并确认一次页面。
- 布局与响应式：桌面端和窄屏端各确认一次。
- 表单、批量操作和路由：验证主流程与关键异常。
- 大范围重构或正式交付：完整检查显隐、触发、位置、间距、状态和反馈。
