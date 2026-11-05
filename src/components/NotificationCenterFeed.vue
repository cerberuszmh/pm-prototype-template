<script setup>
import { ref } from "vue";
import { message } from "ant-design-vue";
import {
  notificationTypeColors,
  notificationTypeIcons,
} from "../mock/notificationCenterMeta";

// 工作台卡片：展示与铃铛浮层同源的一条分组列表；「全部已读 / 查看更多」由卡片 extra 承担

defineProps({
  title: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  itemMotionClass: {
    type: Function,
    default: () => "",
  },
});

const rootRef = ref(null);

defineExpose({
  getAnimateEl() {
    return rootRef.value;
  },
});

function handleItemClick() {
  message.success("查看详情");
}
</script>

<template>
  <div ref="rootRef" class="notification-center-feed">
    <div v-if="items.length === 0" class="notification-center-feed__empty">
      暂无{{ title }}
    </div>
    <ul v-else class="workbench-unified-feed">
      <li
        v-for="item in items"
        :key="item.id"
        class="workbench-unified-feed__item"
        :class="itemMotionClass(item.id)"
        @click="handleItemClick"
      >
        <span
          class="workbench-unified-feed__icon"
          :style="{ backgroundColor: notificationTypeColors[item.type] }"
        >
          <component :is="notificationTypeIcons[item.type]" />
        </span>
        <div class="workbench-unified-feed__body">
          <div class="workbench-unified-feed__title">
            {{ item.title }}
          </div>
          <div class="workbench-unified-feed__desc">
            {{ item.description }}
          </div>
        </div>
        <div class="workbench-unified-feed__rail">
          <span class="workbench-unified-feed__time">{{ item.time }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.notification-center-feed__empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
