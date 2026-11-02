import { reactive, nextTick } from "vue";

// ── 表格行动画 ──
// 依据 vue-list-view.mdc ## 表格行动画：新增进场、删除出场、修改高亮，
// 用于告诉用户「刚刚哪一行发生了变化」，避免表格数据突变时看丢位置
// 时长必须与 global.css 中 .row-motion-* 的 animation 时长保持一致
// 新增的滑入只有 500ms，但需等同时播放的 2000ms 高亮结束才能移除 class
const ENTER_DURATION = 2000;
const LEAVE_DURATION = 500;
const UPDATE_DURATION = 2000;
// 删除行滑出后，下方行上移补位的时长
const SHIFT_DURATION = 300;

// 系统开启「减少动态效果」时不播放动画，出场也不再等待，直接移除
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// 标签页缓存可能让同 key 的行同时存在于隐藏页面，只取当前可见的那一行所在表体
function findVisibleTbody(key) {
  const selector = `tr[data-row-key="${CSS.escape(String(key))}"]`;
  const rows = document.querySelectorAll(selector);
  for (const row of rows) {
    if (row.offsetParent !== null) {
      return row.closest("tbody");
    }
  }
  return null;
}

// R2 P3-005 修订：跨页批量删除时首个编号可能不在当前页，需逐个查找，
// 否则当前页被删行下方的记录拿不到表体，补位动画整体缺失
function findTbodyOfKeys(keys) {
  for (const key of keys) {
    const tbody = findVisibleTbody(key);
    if (tbody) {
      return tbody;
    }
  }
  return null;
}

function getDataRows(tbody) {
  return tbody.querySelectorAll(":scope > tr[data-row-key]");
}

function captureRowTops(tbody) {
  const tops = {};
  getDataRows(tbody).forEach((row) => {
    tops[row.dataset.rowKey] = row.getBoundingClientRect().top;
  });
  return tops;
}

// 上移补位采用「先算位移、再归零」：表格单元格内边距带 !important 且会被内容撑开，
// 无法靠收起行高实现；改为让下方行先回到原位置，再过渡到新位置。
// 位移挂在 td 上，与 global.css 行动画一致，保证右侧 sticky 固定列同步移动
function playShift(tbody, oldTops) {
  const shiftedCells = [];
  getDataRows(tbody).forEach((row) => {
    const oldTop = oldTops[row.dataset.rowKey];
    // 删除后从下一页补进来的行没有原位置，不做位移
    if (oldTop === undefined) {
      return;
    }
    const offset = oldTop - row.getBoundingClientRect().top;
    if (offset <= 0) {
      return;
    }
    row.querySelectorAll(":scope > td").forEach((cell) => {
      cell.style.transition = "none";
      cell.style.transform = `translateY(${offset}px)`;
      shiftedCells.push(cell);
    });
  });
  if (shiftedCells.length === 0) {
    return;
  }
  // 强制回流，让浏览器先落定「回到原位置」这一帧，否则过渡不会发生
  void tbody.offsetHeight;
  shiftedCells.forEach((cell) => {
    cell.style.transition = `transform ${SHIFT_DURATION}ms ease-in-out`;
    cell.style.transform = "";
  });
  // 清掉内联过渡，避免影响后续悬停背景等样式变化
  setTimeout(() => {
    shiftedCells.forEach((cell) => {
      cell.style.transition = "";
    });
  }, SHIFT_DURATION);
}

export function useRowMotion() {
  // 行 key → 当前动画类型；每个页面实例独立，切换页面后不残留
  const motionMap = reactive({});
  const timers = {};

  // 同一行连续触发时先移除旧 class 再挂新 class，否则浏览器不会重播动画
  async function play(key, type, duration) {
    clearTimeout(timers[key]);
    delete motionMap[key];
    await nextTick();
    motionMap[key] = type;
    timers[key] = setTimeout(() => {
      delete motionMap[key];
      delete timers[key];
    }, duration);
  }

  function playEnter(key) {
    if (prefersReducedMotion()) {
      return;
    }
    play(key, "enter", ENTER_DURATION);
  }

  function playUpdate(keys) {
    if (prefersReducedMotion()) {
      return;
    }
    keys.forEach((key) => play(key, "update", UPDATE_DURATION));
  }

  // 出场必须先播放动画再删除数据：数据一旦移除，行 DOM 立即消失，动画无处播放
  function playLeave(keys, removeRecords) {
    if (prefersReducedMotion()) {
      removeRecords();
      return;
    }
    keys.forEach((key) => {
      clearTimeout(timers[key]);
      motionMap[key] = "leave";
    });
    setTimeout(async () => {
      // 必须在移除数据前记录位置，移除后 DOM 已重排，原位置无从得知
      const tbody = findTbodyOfKeys(keys);
      let oldTops = null;
      if (tbody) {
        oldTops = captureRowTops(tbody);
      }
      removeRecords();
      keys.forEach((key) => {
        delete motionMap[key];
        delete timers[key];
      });
      await nextTick();
      if (tbody && oldTops) {
        playShift(tbody, oldTops);
      }
    }, LEAVE_DURATION);
  }

  // 供 a-table 的 row-class-name 使用；无动画时返回空字符串
  function rowMotionClass(key) {
    const type = motionMap[key];
    if (!type) {
      return "";
    }
    return `row-motion-${type}`;
  }

  return { playEnter, playUpdate, playLeave, rowMotionClass };
}
