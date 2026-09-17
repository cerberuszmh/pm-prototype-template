import { reactive } from "vue";

// ================================================================
// 告警信息悬浮按钮 mock 数据
// 新项目启动时按实际业务替换为后端告警接口数据
// ================================================================

export const alarmState = reactive({
  // 当前未处理告警列表
  alarms: [
    { id: 1, title: "服务器 CPU 使用率超过 80%", time: "5分钟前" },
    { id: 2, title: "数据库连接池剩余连接数不足", time: "10分钟前" },
  ],
});

// 计算未处理告警数量，用于徽标数字与状态切换
export function alarmCount() {
  return alarmState.alarms.length;
}
