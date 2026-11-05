// 工作台示例待办
// 本文件只给模板工作台页提供可点击的待办样例，不定义真实业务流程。
// 记录编号和名称必须与 src/mock/example.js 中已有示例记录一致，
// 避免工作台出现示例列表里不存在的业务对象。

export const workbenchTodos = [
  {
    id: "WB-TODO-001",
    recordId: "EX-2026-0016",
    recordName: "示例记录十六",
    // 草稿记录用来演示「还能去处理」的待办，不在这里改记录状态
    note: "草稿记录，可从本页进入示例列表继续查看",
    done: false,
  },
  {
    id: "WB-TODO-002",
    recordId: "EX-2026-0012",
    recordName: "示例记录十二",
    note: "另一条草稿记录，用来撑开待办列表示例",
    done: false,
  },
  {
    id: "WB-TODO-003",
    recordId: "EX-2026-0011",
    recordName: "示例记录十一",
    note: "已发布记录，演示待办可以指向不同状态的示例记录",
    done: false,
  },
];
