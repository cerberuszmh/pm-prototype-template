import {
  BellOutlined,
  CheckSquareOutlined,
  MailOutlined,
  SoundOutlined,
} from "@ant-design/icons-vue";

// 通知中心各类型对应的图标与色值，铃铛浮层与工作台卡片共用，避免两处漂移

export const notificationTypeIcons = {
  message: MailOutlined,
  system: BellOutlined,
  announcement: SoundOutlined,
  todo: CheckSquareOutlined,
};

export const notificationTypeColors = {
  message: "#1677ff",
  system: "#ff4d4f",
  announcement: "#722ed1",
  todo: "#52c41a",
};
