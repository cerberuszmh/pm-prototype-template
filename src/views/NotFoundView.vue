<script setup>
import { ArrowLeftOutlined } from "@ant-design/icons-vue";
</script>

<template>
  <div class="not-found-page">
    <a-result
      status="404"
      title="页面不存在"
      sub-title="当前访问的页面不存在，可能是链接已失效或路由尚未配置。"
    >
      <template #extra>
        <router-link to="/">
          <a-button type="primary">
            <template #icon>
              <ArrowLeftOutlined />
            </template>
            返回系统首页
          </a-button>
        </router-link>
      </template>
    </a-result>
  </div>
</template>
