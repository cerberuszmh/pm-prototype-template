import { createApp } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

import App from "./App.vue";
import router from "./router";
import { appConfig } from "./config/app";

import "ant-design-vue/dist/reset.css";
import "./styles/global.css";

// 浏览器标签页标题由入口统一设置为系统名称，路由切换不逐页变更；
// index.html 中只保留通用回退标题，品牌替换只需改 src/config/app.js
document.title = appConfig.systemName;

// favicon 同样由入口按品牌配置设置，避免 index.html 与配置各存一份 Logo 路径
function applyFavicon(href) {
  let link = document.querySelector("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = href;
}

applyFavicon(appConfig.systemLogo);

dayjs.locale("zh-cn");

createApp(App).use(router).mount("#app");
