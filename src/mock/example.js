import { reactive } from "vue";

// ================================================================
// 示例模块 mock 数据 - 演示标准列表页的数据结构与字段约定
// 新项目启动时清空本文件，按业务模块逐个新增 mock
// ================================================================

// 跨页共享列表用 reactive 导出，保证 push 后 computed 自动更新
// 对应 vue-ui-implementation.mdc ## "新建 / 详情页布局" § Mock 响应式约定
export const exampleList = reactive([
  {
    id: "EX-2026-0010",
    name: "示例记录十",
    status: "draft",
    createTime: "2026-07-06 10:00:00",
  },
  {
    id: "EX-2026-0009",
    name: "示例记录九",
    status: "published",
    createTime: "2026-07-05 14:30:00",
  },
  {
    id: "EX-2026-0008",
    name: "示例记录八",
    status: "published",
    createTime: "2026-07-04 09:15:00",
  },
  {
    id: "EX-2026-0007",
    name: "示例记录七",
    status: "archived",
    createTime: "2026-07-03 16:45:00",
  },
  {
    id: "EX-2026-0006",
    name: "示例记录六",
    status: "draft",
    createTime: "2026-07-02 11:20:00",
  },
  {
    id: "EX-2026-0005",
    name: "示例记录五",
    status: "published",
    createTime: "2026-07-01 08:00:00",
  },
  {
    id: "EX-2026-0004",
    name: "示例记录四",
    status: "archived",
    createTime: "2026-06-30 15:30:00",
  },
  {
    id: "EX-2026-0003",
    name: "示例记录三",
    status: "draft",
    createTime: "2026-06-29 13:10:00",
  },
  {
    id: "EX-2026-0002",
    name: "示例记录二",
    status: "published",
    createTime: "2026-06-28 09:50:00",
  },
  {
    id: "EX-2026-0001",
    name: "示例记录一",
    status: "archived",
    createTime: "2026-06-27 14:00:00",
  },
]);

// 自增计数器：用于新建记录时生成唯一 id
let exampleSeq = 11;

// 工具函数：生成新记录 id
// 新项目启动时按业务规则替换（如带前缀、日期段、模块代码等）
export function nextExampleId() {
  const seq = String(exampleSeq++).padStart(4, "0");
  return `EX-2026-${seq}`;
}
