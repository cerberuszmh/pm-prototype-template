import { reactive } from "vue";

// ================================================================
// 示例模块 mock 数据 - 演示标准列表页的数据结构与字段约定
// 新项目启动时清空本文件，按业务模块逐个新增 mock
// ================================================================

// 跨页共享列表用 reactive 导出，保证 push 后 computed 自动更新
// 对应 vue-ui-implementation.mdc ## "新建 / 详情页布局" § Mock 响应式约定
// V0.x 修订：新增 category 分类字段，取值见 enums.js EXAMPLE_CATEGORY - RB-027
// 三类分类轮流分配，保证多选筛选时每个选项都有命中数据
// FIX-003 修订：分组记录与示例记录统一为同一对象，新增 groupKey 引用 exampleGroupTree 节点；
// 示例列表与分组列表共用本数组，任一页面的维护结果在另一页面同步体现
// R3 P3-005 修订：少量记录直接挂在非站点层级（上海分部为分部级、华南区域为区域级），
// 用于演示「包含下级」勾选与否的差异；
// 0011～0018 的创建时间避开 07-01～07-03，保持 SRS-AC-07 的命中结果不变
export const exampleList = reactive([
  {
    id: "EX-2026-0018",
    name: "示例记录十八",
    category: "policy",
    groupKey: "east-sh-pd",
    status: "published",
    createTime: "2026-07-14 10:00:00",
  },
  {
    id: "EX-2026-0017",
    name: "示例记录十七",
    category: "activity",
    groupKey: "east-sh-mh",
    status: "published",
    createTime: "2026-07-13 13:30:00",
  },
  {
    id: "EX-2026-0016",
    name: "示例记录十六",
    category: "notice",
    groupKey: "east-sh",
    status: "draft",
    createTime: "2026-07-12 08:50:00",
  },
  {
    id: "EX-2026-0015",
    name: "示例记录十五",
    category: "policy",
    groupKey: "east-hz",
    status: "published",
    createTime: "2026-07-11 16:20:00",
  },
  {
    id: "EX-2026-0014",
    name: "示例记录十四",
    category: "activity",
    groupKey: "north-bj",
    status: "archived",
    createTime: "2026-07-10 11:40:00",
  },
  {
    id: "EX-2026-0013",
    name: "示例记录十三",
    category: "notice",
    groupKey: "east-sh-pd",
    status: "published",
    createTime: "2026-07-09 14:00:00",
  },
  {
    id: "EX-2026-0012",
    name: "示例记录十二",
    category: "policy",
    groupKey: "north-tj",
    status: "draft",
    createTime: "2026-07-08 10:15:00",
  },
  {
    id: "EX-2026-0011",
    name: "示例记录十一",
    category: "activity",
    groupKey: "south-gz",
    status: "published",
    createTime: "2026-07-07 09:30:00",
  },
  {
    id: "EX-2026-0010",
    name: "示例记录十",
    category: "notice",
    groupKey: "north-bj",
    status: "draft",
    createTime: "2026-07-06 10:00:00",
  },
  {
    id: "EX-2026-0009",
    name: "示例记录九",
    category: "activity",
    groupKey: "north-tj",
    status: "published",
    createTime: "2026-07-05 14:30:00",
  },
  {
    id: "EX-2026-0008",
    name: "示例记录八",
    category: "policy",
    groupKey: "south-gz",
    status: "published",
    createTime: "2026-07-04 09:15:00",
  },
  {
    id: "EX-2026-0007",
    name: "示例记录七",
    category: "notice",
    groupKey: "east-sh-pd",
    status: "archived",
    createTime: "2026-07-03 16:45:00",
  },
  {
    id: "EX-2026-0006",
    name: "示例记录六",
    category: "activity",
    groupKey: "east-sh-mh",
    status: "draft",
    createTime: "2026-07-02 11:20:00",
  },
  {
    id: "EX-2026-0005",
    name: "示例记录五",
    category: "policy",
    groupKey: "east-sh",
    status: "published",
    createTime: "2026-07-01 08:00:00",
  },
  {
    id: "EX-2026-0004",
    name: "示例记录四",
    category: "notice",
    groupKey: "east-hz",
    status: "archived",
    createTime: "2026-06-30 15:30:00",
  },
  {
    id: "EX-2026-0003",
    name: "示例记录三",
    category: "activity",
    groupKey: "north-bj",
    status: "draft",
    createTime: "2026-06-29 13:10:00",
  },
  {
    id: "EX-2026-0002",
    name: "示例记录二",
    category: "policy",
    groupKey: "south-gz",
    status: "published",
    createTime: "2026-06-28 09:50:00",
  },
  {
    id: "EX-2026-0001",
    name: "示例记录一",
    category: "notice",
    groupKey: "south",
    status: "archived",
    createTime: "2026-06-27 14:00:00",
  },
]);

// ================================================================
// V0.x 修订：分组列表页 mock - 左侧分组树筛选右侧列表 - RB-028
// ================================================================

// 分组树：区域 → 分部 → 站点三级，key 全局唯一，供示例记录 groupKey 引用
// 树结构只读，不需要响应式
export const exampleGroupTree = [
  {
    key: "east",
    title: "华东区域",
    children: [
      {
        key: "east-sh",
        title: "上海分部",
        children: [
          { key: "east-sh-pd", title: "浦东站点" },
          { key: "east-sh-mh", title: "闵行站点" },
        ],
      },
      { key: "east-hz", title: "杭州分部" },
    ],
  },
  {
    key: "north",
    title: "华北区域",
    children: [
      { key: "north-bj", title: "北京分部" },
      { key: "north-tj", title: "天津分部" },
    ],
  },
  {
    key: "south",
    title: "华南区域",
    children: [{ key: "south-gz", title: "广州分部" }],
  },
];

// R3 P3-003 修订：key → 「区域 / 分部 / 站点」完整路径，示例列表与分组列表共用，
// 路径格式只在此处定义一次，避免两个页面各自拼接后出现口径分叉
export const exampleGroupPathMap = {};

function indexGroupPath(nodes, parentPath) {
  nodes.forEach((node) => {
    let path = node.title;
    if (parentPath) {
      path = `${parentPath} / ${node.title}`;
    }
    exampleGroupPathMap[node.key] = path;
    if (node.children) {
      indexGroupPath(node.children, path);
    }
  });
}
indexGroupPath(exampleGroupTree, "");

// 自增计数器：用于新建记录时生成唯一 id
// FIX-003 修订：种子数据扩充到 0018，新建编号从 0019 起，避免与种子编号重复
let exampleSeq = 19;

// 工具函数：生成新记录 id
// 新项目启动时按业务规则替换（如带前缀、日期段、模块代码等）
export function nextExampleId() {
  const seq = String(exampleSeq++).padStart(4, "0");
  return `EX-2026-${seq}`;
}
