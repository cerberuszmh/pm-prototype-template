# PM 初始化项目模板

> 本仓库是产品经理（PM）启动新项目时使用的**通用模板项目**，已内置 AI 治理规则、SKILL 工作流、文档模板与最小可运行的 Vue 原型骨架。
>
> **首次启动新项目，请先阅读** [`如何使用本模板.md`](./如何使用本模板.md)。

## 5 分钟开始

这条路径只帮助你完成**启动准备**，不代表 5 分钟内产出需求文档或原型。

1. **选择工作模式**：只做文档，或同时制作 Vue 原型。
2. **完成必要替换**：按 [`如何使用本模板.md`](./如何使用本模板.md) §“5 分钟开始”确认项目名称、系统名称和工作模式。
3. **按模式验证**：
   - 只做文档：跳过 Node 和原型启动，直接进入下一步。
   - 文档 + 原型：执行 `npm install`、`npm run dev`，确认示例列表可访问。
4. **在 Cursor 启动**：输入 `/项目总入口`，或直接说“我要启动一个新项目，请从产品发现开始”。

想先看成品应填写到什么程度，请打开 [`docs/samples/README.md`](./docs/samples/README.md)；完整流程见 [`项目全流程操作手册.md`](./项目全流程操作手册.md)。

## 技术栈

- Vue 3 + Vite 6.x
- Ant Design Vue 4.2.6
- Vue Router 5.x
- dayjs（中文 locale）

## 启动方式

```bash
npm install
npm run dev
```

启动后访问 `http://localhost:5173/`。

## 目录结构

```
PM 初始化项目模板/
├── .cursor/
│   ├── rules/          ← AI 治理规则（自动生效）
│   └── skills/         ← 工作流 Skills（按需触发）
├── docs/
│   ├── user-requirements/    ← 用户原始需求材料、待确认问题清单
│   ├── formal-requirements/  ← P07、模块 PRD/SRS、变更及历史兼容文档
│   ├── review/               ← 严格审查报告、原型评审结论
│   ├── flow/                 ← 业务流程说明
│   ├── data/                 ← 数据字典等开发交接物
│   └── samples/              ← PM 脱敏成品样例包（非正式交付物）
├── templates/          ← 文档模板（通用）
├── prompts/            ← 输入模板（通用）
├── scripts/            ← 死引用检查等辅助脚本
├── src/
│   ├── layouts/        ← 整体布局（WorkspaceLayout / PageTabs）
│   ├── views/          ← 各模块页面（按需在子目录中创建）
│   ├── mock/           ← 模块 Mock 与共享枚举
│   ├── router/         ← 路由配置
│   ├── composables/    ← 复用逻辑（如 useOpenedTabs）
│   └── styles/         ← 全局样式
└── public/
```

## SKILL 速查表

| Skill | 用途 |
|-------|------|
| `/项目总入口` | 不确定下一步时统一分流 |
| `/产品发现` | 项目级一次性完成需求提炼、功能模块与 IA |
| `/项目与模块启动` | 项目级生成 P07；模块级按 PRD → SRS → 流程图 → 原型推进；翻新走 §2.3-翻新 |
| `/评审` | 两阶段评审；`/严格审查`、`/原型评审` 是阶段别名，不是独立 SKILL |
| `/需求变更` | 需求变更影响分析与变更说明 |
| `/文档生成与版本管理` | 生成或升版 P07 / 模块 PRD / SRS / 流程图等 |
| `/开发交接` | 原型评审通过后生成数据字典并校验 PM 开发交接包 |
| `/交付检查` | PM 评审前或程序员交付前的一致性核查 |
| `/接口对齐` | 程序员主责：前端 Mock 字段与真实接口对比 |
| `/启动项目` | 启动 Vite 开发服务器 |

## 模板状态说明

- 路由表（`src/router/index.js`）与侧边栏菜单（`src/layouts/WorkspaceLayout.vue`）只保留**系统首页 + 1 个「示例模块」分组**，作为新增页面时的参照样板。
- `docs/` 的业务交付目录仅留 `.gitkeep`；`docs/samples/` 保留一套虚构脱敏成品，用于对照 P07、模块 PRD/SRS 与两阶段评审的填写深度。
- `package.json` 中 `name` 为 `pm-prototype-template`、`version` 为 `0.0.1`，新项目启动时按需替换。
