import { reactive } from "vue";

// ================================================================
// 示例模块 mock 数据 - 演示标准列表页的数据结构与字段约定
// 新项目启动时清空本文件，按业务模块逐个新增 mock
// ================================================================

// 跨页共享列表用 reactive 导出，保证 push 后 computed 自动更新
// 对应 vue-ui-implementation.mdc ## "新建 / 详情页布局" § Mock 响应式约定
// 2026-07-23 临时验证：为验证内容区滚动条，临时扩充为 20 条数据
// 验证完成后应删除 EX-2026-0011~0020，并把 exampleSeq 恢复为 11
export const exampleList = reactive([
  {
    id: "EX-2026-0020",
    name: "示例记录二十",
    status: "draft",
    createTime: "2026-07-16 10:00:00",
  },
  {
    id: "EX-2026-0019",
    name: "示例记录十九",
    status: "published",
    createTime: "2026-07-15 14:30:00",
  },
  {
    id: "EX-2026-0018",
    name: "示例记录十八",
    status: "published",
    createTime: "2026-07-14 09:15:00",
  },
  {
    id: "EX-2026-0017",
    name: "示例记录十七",
    status: "archived",
    createTime: "2026-07-13 16:45:00",
  },
  {
    id: "EX-2026-0016",
    name: "示例记录十六",
    status: "draft",
    createTime: "2026-07-12 11:20:00",
  },
  {
    id: "EX-2026-0015",
    name: "示例记录十五",
    status: "published",
    createTime: "2026-07-11 08:00:00",
  },
  {
    id: "EX-2026-0014",
    name: "示例记录十四",
    status: "archived",
    createTime: "2026-07-10 15:30:00",
  },
  {
    id: "EX-2026-0013",
    name: "示例记录十三",
    status: "draft",
    createTime: "2026-07-09 13:10:00",
  },
  {
    id: "EX-2026-0012",
    name: "示例记录十二",
    status: "published",
    createTime: "2026-07-08 09:50:00",
  },
  {
    id: "EX-2026-0011",
    name: "示例记录十一",
    status: "archived",
    createTime: "2026-07-07 14:00:00",
  },
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
// 2026-07-23 临时验证：因临时扩充到 20 条，计数器改为 21；验证后恢复为 11
let exampleSeq = 21;

// 工具函数：生成新记录 id
// 新项目启动时按业务规则替换（如带前缀、日期段、模块代码等）
export function nextExampleId() {
  const seq = String(exampleSeq++).padStart(4, "0");
  return `EX-2026-${seq}`;
}
