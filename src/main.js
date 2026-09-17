import { createApp } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

import App from "./App.vue";
import router from "./router";

import "ant-design-vue/dist/reset.css";
import "./styles/global.css";

dayjs.locale("zh-cn");

createApp(App).use(router).mount("#app");
