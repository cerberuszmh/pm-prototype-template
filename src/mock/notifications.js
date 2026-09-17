import { reactive } from "vue";

// ================================================================
// 通知中心 mock 数据 - 按通知、公告、待办三个分组组织
// 新项目启动时按实际业务替换为后端接口数据
// ================================================================

export const notificationState = reactive({
  // 通知：与个人相关的消息提醒
  notifications: [
    {
      id: "N-001",
      type: "message",
      title: "系统通知",
      description: "您的账号密码即将过期，请及时修改",
      time: "10分钟前",
    },
    {
      id: "N-002",
      type: "system",
      title: "审核提醒",
      description: "您提交的示例申请已通过审核",
      time: "1小时前",
    },
    {
      id: "N-003",
      type: "message",
      title: "评论回复",
      description: "管理员回复了您的留言",
      time: "2小时前",
    },
  ],

  // 公告：面向全员的广播类信息
  announcements: [
    {
      id: "A-001",
      type: "announcement",
      title: "系统升级公告",
      description: "本周六凌晨 02:00 进行系统维护",
      time: "昨天",
    },
    {
      id: "A-002",
      type: "announcement",
      title: "功能上线",
      description: "新增导出报表功能，欢迎使用",
      time: "3天前",
    },
  ],

  // 待办：需要用户处理的任务
  todos: [
    {
      id: "T-001",
      type: "todo",
      title: "待审批",
      description: "您有 2 条待审批记录",
      time: "今天",
    },
    {
      id: "T-002",
      type: "todo",
      title: "待填写",
      description: "请完善项目档案信息",
      time: "昨天",
    },
  ],
});

// 计算三个分组中消息总数，用于徽标数字（原型中所有消息均视为未读）
export function totalUnreadCount() {
  return [
    ...notificationState.notifications,
    ...notificationState.announcements,
    ...notificationState.todos,
  ].length;
}
