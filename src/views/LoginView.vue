<script setup>
import { h, onMounted, onUnmounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { message, notification } from "ant-design-vue";
import companyLogo from "../assets/company-logo.png";
import { appConfig } from "../config/app";
import {
  LockOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SmileOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";
import AiSparkleIcon from "../layouts/AiSparkleIcon.vue";

const router = useRouter();

// 品牌文案统一来自品牌配置，新项目只需修改 src/config/app.js
const systemName = appConfig.systemName;
const companyName = appConfig.companyName;
// 登录卡副标题与登录成功通知共用同一句欢迎语，避免两处文案漂移
const loginWelcome = `欢迎进入${systemName}`;

// 模板验证码固定展示，但不参与登录校验，方便评审用户直接进入系统
// 接入真实项目后，应由后端验证码接口和校验规则替换当前演示逻辑
const verificationCode = "A7K9";

// 预填模板账号密码，打开页面后无需录入即可登录
const formData = reactive({
  username: "admin",
  password: "123456",
  captcha: "",
});

const formRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

// 原型阶段不接入真实鉴权，校验通过后进入系统首页
// 成功反馈只保留右上角通知，避免与 message 重复弹出
function handleLogin() {
  openWelcomeNotification();
  router.push("/");
}

// 登录成功后弹出全局欢迎通知，提示用户已进入系统
function openWelcomeNotification() {
  notification.open({
    message: "欢迎登录",
    description: loginWelcome,
    icon: () =>
      h(SmileOutlined, {
        style: "color: #1677ff",
      }),
  });
}

// 必填字段均在当前视口内，失败时保留字段红框并给出统一提示
function handleLoginFailed() {
  message.warning("请完善必填项后再操作");
}

// 登录页为全屏固定布局，必须禁止 html/body 出现滚动条，避免右侧出现不必要的滚动条
// 进入页面时给 html/body 加标记类，离开时移除，确保不影响工作台等其他页面的自然滚动
onMounted(() => {
  document.documentElement.classList.add("login-page-open");
  document.body.classList.add("login-page-open");
});

onUnmounted(() => {
  document.documentElement.classList.remove("login-page-open");
  document.body.classList.remove("login-page-open");
});
</script>

<template>
  <!-- V0.x 修订：登录页与工作台通栏 #001529 对齐，左右分栏 + 白底登录卡 - RB-041 -->
  <main class="template-login">
    <!-- 左宽右窄全高分栏：左侧格子氛围区，右侧浅底且表单在列内居中（不贴右缘） -->
    <section class="template-login__hero" aria-hidden="false">
      <div class="template-login__hero-inner">
        <div class="template-login__hero-brand">
          <div class="template-login__hero-icon">
            <SettingOutlined />
          </div>
          <div class="template-login__hero-title-row">
            <h1 class="template-login__hero-title">{{ systemName }}</h1>
            <span class="template-login__ai-badge" aria-label="AI 助力">
              <span class="template-login__ai-badge-content">
                <AiSparkleIcon />
                <span>AI 助力</span>
              </span>
            </span>
          </div>
        </div>
        <p class="template-login__hero-desc">
          登录后进入系统首页与功能模块。
        </p>
      </div>
    </section>

    <section class="template-login__panel">
      <div class="template-login__panel-inner">
        <a-card :bordered="false" class="template-login__card">
          <div class="template-login__card-heading">
            <div>
              <h2>登录</h2>
              <p>{{ loginWelcome }}</p>
            </div>
          </div>

          <a-form
            :model="formData"
            :rules="formRules"
            layout="vertical"
            @finish="handleLogin"
            @finish-failed="handleLoginFailed"
          >
            <a-form-item name="username">
              <a-input
                v-model:value="formData.username"
                size="large"
                placeholder="请输入用户名"
                autocomplete="username"
              >
                <template #prefix><UserOutlined /></template>
              </a-input>
            </a-form-item>

            <a-form-item name="password">
              <a-input-password
                v-model:value="formData.password"
                size="large"
                placeholder="请输入密码"
                autocomplete="current-password"
              >
                <template #prefix><LockOutlined /></template>
              </a-input-password>
            </a-form-item>

            <div class="template-login__captcha-row">
              <a-form-item name="captcha">
                <a-input
                  v-model:value="formData.captcha"
                  size="large"
                  placeholder="请输入验证码（原型可不填）"
                  :maxlength="4"
                >
                  <template #prefix><SafetyCertificateOutlined /></template>
                </a-input>
              </a-form-item>
              <div class="template-login__captcha" aria-label="验证码">
                {{ verificationCode }}
              </div>
            </div>

            <a-button type="primary" html-type="submit" size="large" block>
              登录
            </a-button>

            <p class="template-login__tip">
              温馨提示：推荐使用 Chrome、Edge 等现代浏览器，并保持浏览器为最新版本。
            </p>
          </a-form>
        </a-card>

        <footer class="template-login__company">
          <img :src="companyLogo" alt="" />
          <span>{{ companyName }}</span>
        </footer>
      </div>
    </section>
  </main>
</template>

<style scoped>
/*
 * 全视口双栏：左侧大面积格子底图 + 品牌，右侧浅底；表单在右栏内水平居中，避免贴边或挤在小卡片组里。
 */
.template-login {
  --login-primary: #1677ff;
  --login-panel-bg: #f0f2f5;
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(420px, 0.85fr);
  width: 100%;
  height: 100%;
  overflow: hidden;
}

@keyframes loginGradientShift {
  0%,
  100% {
    background-position:
      0% 35%,
      100% 65%,
      40% 0%;
  }

  50% {
    background-position:
      100% 55%,
      0% 45%,
      70% 100%;
  }
}

/* 色光在左栏内漂移：对比度拉大，但仍避免高频闪烁 */
@keyframes loginHeroColorFlow {
  0%,
  100% {
    opacity: 0.58;
    transform: scale(1) translate(0, 0);
  }

  50% {
    opacity: 1;
    transform: scale(1.08) translate(-2.5%, 2%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .template-login__hero::after {
    animation: none;
  }

  .template-login__ai-badge,
  .template-login__ai-badge-content {
    animation: none;
  }
}

/* 左侧氛围区：保留格子底图，品牌文案只占内容宽度，其余留白展示网格 */
.template-login__hero {
  position: relative;
  z-index: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 100%;
  overflow: hidden;
  isolation: isolate;
  /* 品牌区靠上排列，与通栏 Header 视觉高度大致对齐，不做整列垂直居中 */
  padding: clamp(72px, 14vh, 128px) clamp(32px, 8vw, 120px) clamp(48px, 10vh, 120px);
  color: rgba(255, 255, 255, 0.88);
  background-color: #001529;
}

/* 色光仅左栏：右缘做遮罩，避免视觉上染到右侧灰底 */
.template-login__hero::after {
  position: absolute;
  z-index: 0;
  inset: 0;
  content: "";
  pointer-events: none;
  background:
    radial-gradient(circle at 22% 38%, rgba(22, 119, 255, 0.52), transparent 52%),
    radial-gradient(circle at 68% 72%, rgba(56, 189, 248, 0.38), transparent 50%),
    radial-gradient(circle at 45% 12%, rgba(105, 177, 255, 0.28), transparent 46%);
  background-size: 165% 165%;
  -webkit-mask-image: linear-gradient(
    to right,
    #000000 0%,
    #000000 78%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    #000000 0%,
    #000000 78%,
    transparent 100%
  );
  animation:
    loginGradientShift 22s ease-in-out infinite,
    loginHeroColorFlow 22s ease-in-out infinite;
}

.template-login__hero::before {
  position: absolute;
  z-index: 1;
  inset: 0;
  content: "";
  pointer-events: none;
  opacity: 0.48;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 48px 48px;
  -webkit-mask-image:
    linear-gradient(
      to bottom,
      transparent 0%,
      #000000 12%,
      #000000 88%,
      transparent 100%
    ),
    linear-gradient(to right, #000000 0%, #000000 82%, transparent 100%);
  mask-image:
    linear-gradient(
      to bottom,
      transparent 0%,
      #000000 12%,
      #000000 88%,
      transparent 100%
    ),
    linear-gradient(to right, #000000 0%, #000000 82%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
}

.template-login__hero-inner {
  position: relative;
  z-index: 2;
  max-width: 480px;
}

.template-login__hero-brand {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}

.template-login__hero-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  min-width: 0;
}

/* 视觉语言与通栏 workspace-ai-entry 一致：白芯、渐变描边、三星芒 + 渐变字 */
.template-login__ai-badge {
  --login-ai-gradient: linear-gradient(
    100deg,
    #1677ff 0%,
    #722ed1 24%,
    #eb2f96 48%,
    #13c2c2 72%,
    #1677ff 100%
  );
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 13px;
  border: 2px solid transparent;
  border-radius: 999px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.82))
      padding-box,
    linear-gradient(
        100deg,
        rgba(22, 119, 255, 0.18) 0%,
        rgba(114, 46, 209, 0.18) 24%,
        rgba(235, 47, 150, 0.18) 48%,
        rgba(19, 194, 194, 0.18) 72%,
        rgba(22, 119, 255, 0.18) 100%
      )
      padding-box,
    var(--login-ai-gradient) border-box,
    linear-gradient(
        100deg,
        rgba(22, 119, 255, 0.18) 0%,
        rgba(114, 46, 209, 0.18) 24%,
        rgba(235, 47, 150, 0.18) 48%,
        rgba(19, 194, 194, 0.18) 72%,
        rgba(22, 119, 255, 0.18) 100%
      )
      border-box;
  background-position:
    0 0,
    0% 50%,
    0% 50%,
    0% 50%;
  background-size:
    100% 100%,
    300% 100%,
    300% 100%,
    300% 100%;
  box-shadow: 0 4px 14px rgba(82, 46, 214, 0.28);
  animation: loginAiBorderGradient 30s linear infinite;
}

.template-login__ai-badge-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: transparent;
  background-image: var(--login-ai-gradient);
  background-position: 0% 50%;
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: loginAiTextGradient 30s linear infinite;
}

.template-login__ai-badge-content :deep(.ai-sparkle) {
  font-size: 14px;
}

@keyframes loginAiBorderGradient {
  0% {
    background-position:
      0 0,
      0% 50%,
      0% 50%,
      0% 50%;
  }

  23.333%,
  100% {
    background-position:
      0 0,
      300% 50%,
      300% 50%,
      300% 50%;
  }
}

@keyframes loginAiTextGradient {
  0% {
    background-position: 0% 50%;
  }

  23.333%,
  100% {
    background-position: 300% 50%;
  }
}

.template-login__hero-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 22px;
  color: #ffffff;
  background: var(--login-primary);
  border-radius: 10px;
}

.template-login__hero-title {
  margin: 0;
  font-size: clamp(26px, 3.2vw, 36px);
  font-weight: 600;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.96);
}

.template-login__hero-desc {
  margin: 0;
  max-width: 360px;
  font-size: 15px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.55);
}

.template-login__panel {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: clamp(40px, 8vh, 80px) clamp(40px, 6vw, 96px);
  background: var(--login-panel-bg);
  border-left: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: -8px 0 24px rgba(0, 21, 41, 0.12);
}

.template-login__panel-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 440px;
}

.template-login__card {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.template-login__card :deep(.ant-card-body) {
  padding: 40px 40px 32px;
}

.template-login__card-heading {
  margin-bottom: 28px;
}

.template-login__card-heading h2 {
  margin: 0 0 8px;
  color: rgba(0, 0, 0, 0.88);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}

.template-login__card-heading p {
  margin: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 21px;
}

.template-login__captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 105px;
  gap: 10px;
}

.template-login__captcha {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: start;
  height: 40px;
  color: #001529;
  font-family: Georgia, serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 4px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  user-select: none;
}

.template-login__card :deep(.ant-form-item) {
  margin-bottom: 24px;
}

.template-login__card :deep(.ant-btn-primary) {
  height: 46px;
  margin-top: 6px;
  font-size: 16px;
  letter-spacing: 4px;
}

.template-login__tip {
  margin: 28px 0 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  line-height: 18px;
  text-align: center;
}

.template-login__company {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  margin-top: 20px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  line-height: 28px;
  white-space: nowrap;
}

.template-login__company img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

@media (max-width: 900px) {
  .template-login {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .template-login__hero {
    justify-content: flex-start;
    min-height: auto;
    padding: 48px 24px 72px;
  }

  .template-login__hero::before {
    -webkit-mask-image: none;
    mask-image: none;
  }

  .template-login__hero-desc {
    display: none;
  }

  .template-login__panel {
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding: 32px 24px 48px;
  }
}

@media (max-width: 520px) {
  .template-login__card :deep(.ant-card-body) {
    padding: 28px 22px 24px;
  }

  .template-login__captcha-row {
    grid-template-columns: minmax(0, 1fr) 80px;
  }
}
</style>
