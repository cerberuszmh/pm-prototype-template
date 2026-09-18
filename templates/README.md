# 模板目录说明

本目录仅存放正式交付物模板。

## 分类

- `templates/requirements/`：P07 合并版 PRD、模块 PRD、SRS、需求变更说明、翻新决策、轻量需求摘要（双速轨工作件，非交付物）；结构化需求底稿和独立项目对齐稿仅为历史兼容模板
- `templates/design/`：业务流程说明、流程图类模板
- `templates/review/`：评审清单、原型评审结论与阶段决策模板
- `templates/testing/`：测试用例模板
- `templates/manuals/`：使用说明书模板
- `templates/acceptance/`：项目验收专用的 A01 需求规格说明书、A02 概要设计说明书、A03 详细设计说明书模板；不属于项目建设标准流程

## 使用建议

- 触发对应 SKILL（如 `项目与模块启动` / `文档生成与版本管理` 等），SKILL 内部会引用必要的 Template + 规则
- 项目验收模板仅由用户通过验收专用手动命令显式触发时使用，输出到 `docs/acceptance/`，不得由建设流程自动生成
- 最终交付物归档到 `docs/` 下对应子目录（详见 `.cursor/rules/doc-format.mdc §"交付物存储路径"`），本目录仅提供模板参照

## 模板、样例与正式交付物

- `templates/`：空白结构，规定章节和字段骨架，不代表填写完成。
- `docs/samples/`：虚构脱敏成品，用于观察填写深度、引用方式和评审结论。
- `docs/` 下各业务目录：真实项目正式交付物，由对应 SKILL 根据真实输入生成。

具体映射和阅读顺序见 [`docs/samples/README.md`](../docs/samples/README.md)。真实项目不得直接修改脱敏样例后改名交付。
