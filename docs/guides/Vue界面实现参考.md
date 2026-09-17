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

桌面端由工作台外壳锁定视口，左侧菜单和右侧内容分别承担滚动：

```css
.workspace-layout {
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
}

.workspace-sider {
  height: 100vh;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.workspace-sider::-webkit-scrollbar {
  display: none;
}

.workspace-layout > .ant-layout {
  height: 100vh;
  min-width: 0;
  overflow-y: auto;
}
```

在 `max-width: 992px` 下，应把工作台与右侧布局恢复为 `height: auto; overflow: visible`，让页面自然滚动。

顶部区域建议由单一容器整体吸顶：

```css
.workspace-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
}
```

不要分别固定 Header、标签栏和面包屑，否则动态高度变化时容易产生遮挡。

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

带 `#extra` 的列表卡仍会渲染 Header。为取得四周 `10px` 的实测间距，可使用：

```vue
<a-card :body-style="{ padding: '11px 10px 10px' }">
  <template #extra>
    <a-button type="primary">新增</a-button>
  </template>
  <!-- 顶部多出的 1px 用于补偿 Header 与 Body 的边框重叠 -->
  <a-table />
</a-card>
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

当前模板登录页的既有实现参数如下，仅用于复现模板，不作为所有业务项目的强制规则：

- 顶层路由 `/login`，不使用 `WorkspaceLayout`。
- 系统名称「示例管理系统」，桌面字号 `48px`，不展示 Logo。
- 登录卡参考尺寸 `420×500px`，输入框 `44px`，按钮 `46px`。
- 默认演示账号 `admin`、密码 `123456`；验证码仅展示、不参与校验。
- 背景使用四段渐变、`220% 220%` 背景尺寸、18 秒位移动画和 6 秒柔光动画。
- 登录容器使用 `height: 100vh; overflow: hidden`。
- `prefers-reduced-motion` 下停用动画。

真实项目必须用项目配置替换系统名称和演示凭据，不得把本节内容误判为业务需求。

## 9. 验证提示

- 静态文案、字号、颜色和间距：回读修改区域并确认一次页面。
- 布局与响应式：桌面端和窄屏端各确认一次。
- 表单、批量操作和路由：验证主流程与关键异常。
- 大范围重构或正式交付：完整检查显隐、触发、位置、间距、状态和反馈。
