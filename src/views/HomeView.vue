<template>
  <!-- 模板默认首页：用通用文案承接"系统就绪"语义，新项目可按需替换 -->
  <a-result
    status="success"
    title="PM 初始化项目模板"
    sub-title="系统骨架已就绪。请通过左侧菜单进入功能模块，或在 Cursor 中触发「/项目与模块启动」开始新模块。"
  >
    <template #extra>
      <a-space direction="vertical" :size="4">
        <a-tag color="blue">Vue 3 + Ant Design Vue 4.x</a-tag>
        <a-tag color="green">AI 治理框架已就绪</a-tag>
      </a-space>
    </template>
  </a-result>
</template>
