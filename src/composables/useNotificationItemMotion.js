import { reactive, nextTick } from "vue";
import { animateHeightCollapse, prefersReducedMotion } from "./useAnimateHeight";

// 通知/公告条目「全部已读」出场动效，与表格 row-motion-leave 同曲线与时长
const LEAVE_DURATION = 500;

export function useNotificationItemMotion() {
  const motionMap = reactive({});
  const timers = {};

  async function finishMarkAllRead(ids, applyRead, getAnimateEl, resolve) {
    let startHeight = null;
    const animateEl = getAnimateEl ? getAnimateEl() : null;
    if (animateEl) {
      startHeight = animateEl.offsetHeight;
    }

    applyRead();

    for (const id of ids) {
      delete motionMap[id];
      delete timers[id];
    }

    await nextTick();

    if (animateEl && startHeight !== null) {
      await animateHeightCollapse(animateEl, startHeight);
    }

    resolve(true);
  }

  function playMarkAllRead(list, applyRead, getAnimateEl) {
    const ids = [];
    for (const item of list) {
      if (!item.read) {
        ids.push(item.id);
      }
    }
    if (ids.length === 0) {
      return Promise.resolve(false);
    }

    if (prefersReducedMotion()) {
      return new Promise((resolve) => {
        finishMarkAllRead(ids, applyRead, getAnimateEl, resolve);
      });
    }

    return new Promise((resolve) => {
      for (const id of ids) {
        clearTimeout(timers[id]);
        motionMap[id] = "leave";
      }
      setTimeout(() => {
        finishMarkAllRead(ids, applyRead, getAnimateEl, resolve);
      }, LEAVE_DURATION);
    });
  }

  function itemMotionClass(id) {
    if (motionMap[id] === "leave") {
      return "notification-item-motion-leave";
    }
    return "";
  }

  return { playMarkAllRead, itemMotionClass };
}
