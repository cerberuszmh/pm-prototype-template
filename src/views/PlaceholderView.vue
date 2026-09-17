<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { ClockCircleOutlined } from "@ant-design/icons-vue";

const route = useRoute();

// 从路由 meta 读取当前页面名称，提示用户所在模块
const moduleName = computed(() => route.meta.title ?? "该模块");
</script>

<template>
  <!-- 通用占位页：用于尚未开发的模块，保持系统框架可导航 -->
  <div class="placeholder-wrap">
    <a-empty
      :image="false"
      :description="false"
    >
      <template #image>
        <ClockCircleOutlined class="placeholder-icon" />
      </template>
      <div class="placeholder-content">
        <p class="placeholder-title">「{{ moduleName }}」即将上线</p>
        <p class="placeholder-desc">该模块即将上线，敬请期待。</p>
      </div>
    </a-empty>
  </div>
</template>

<style scoped>
/* 垂直居中展示，视觉上不空旷 */
.placeholder-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.placeholder-icon {
  font-size: 56px;
  color: #d9d9d9;
}

.placeholder-content {
  margin-top: 16px;
  text-align: center;
}

.placeholder-title {
  font-size: 16px;
  color: #595959;
  margin-bottom: 6px;
}

.placeholder-desc {
  font-size: 13px;
  color: #8c8c8c;
}
</style>
