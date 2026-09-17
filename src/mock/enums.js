// ================================================================
// 示例枚举 - 演示 value/label/color 三元组结构
// 新项目启动时清空本文件，按业务模块逐个新增枚举常量
// 修改约束：枚举值的增减须先走需求变更流程，避免与 PRD/SRS 脱节
// ================================================================

// 示例状态：演示列表页 Tag 配色与状态机回显的标准写法
// 三态对应草稿/已发布/已归档，新模块可参照此结构定义自己的状态枚举
export const EXAMPLE_STATUS = [
  { value: "draft", label: "草稿", color: "blue" },
  { value: "published", label: "已发布", color: "green" },
  { value: "archived", label: "已归档", color: "default" },
];

// 工具函数：按 value 查找枚举 label，避免在视图中散落硬编码
// 用于 Tag / 详情态 / 列表单元格的回显
export function findEnumLabel(enumList, value) {
  const item = enumList.find((opt) => opt.value === value);
  return item ? item.label : value;
}

// 工具函数：将多选 value 数组转换为顿号拼接的中文展示串
// 对应 vue-ui-implementation §"多选下拉字段说明"的展示约定
export function joinEnumLabels(enumList, valueArray) {
  if (!Array.isArray(valueArray) || valueArray.length === 0) {
    return "—";
  }
  const labels = valueArray.map((value) => findEnumLabel(enumList, value));
  return labels.join("、");
}
