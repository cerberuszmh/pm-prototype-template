<script setup>
import { appConfig } from "../config/app";

// 首页标题与副标题统一来自品牌配置，新项目只需修改 src/config/app.js
const homeTitle = appConfig.homeTitle;
const homeSubtitle = appConfig.homeSubtitle;
</script>

<template>
  <!-- 模板默认首页：用通用文案承接"系统就绪"语义，新项目可按需替换 -->
  <a-result
    status="success"
    :title="homeTitle"
    :sub-title="homeSubtitle"
  >
    <template #extra>
      <a-space direction="vertical" :size="4">
        <a-tag color="blue">Vue 3 + Ant Design Vue 4.x</a-tag>
        <a-tag color="green">AI 治理框架已就绪</a-tag>
      </a-space>
    </template>
  </a-result>
</template>
