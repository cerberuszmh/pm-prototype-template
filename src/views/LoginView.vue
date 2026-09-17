<script setup>
import { h, onMounted, onUnmounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { message, notification } from "ant-design-vue";
import companyLogo from "../assets/company-logo.png";
import {
  LockOutlined,
  SafetyCertificateOutlined,
  SmileOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";

const router = useRouter();

// 模板验证码固定展示，但不参与登录校验，方便评审用户直接进入系统
// 接入真实项目后，应由后端验证码接口和校验规则替换当前演示逻辑
const verificationCode = "A7K9";

// 2026-07-22 修订：预填模板账号密码，打开页面后无需录入即可登录
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
function handleLogin() {
  message.success("登录成功");
  openWelcomeNotification();
  router.push("/");
}

// 登录成功后弹出全局欢迎通知，提示用户已进入系统
function openWelcomeNotification() {
  notification.open({
    message: "欢迎登录",
    description: "欢迎进入示例管理系统",
    icon: () =>
      h(SmileOutlined, {
        style: "color: #108ee9",
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
  <main class="template-login">
    <!-- 2026-07-22 修订：删除 Logo，品牌区只展示示例系统名称 -->
    <header class="template-login__brand">
      <span>示例管理系统</span>
    </header>

    <section class="template-login__content">
      <!-- 2026-07-22 修订：删除左侧装饰图形，仅保留背景氛围和右侧登录主任务 -->
      <a-card :bordered="false" class="template-login__card">
        <!-- 2026-07-22 修订：移除右上模板标签，避免无关标识干扰登录标题 -->
        <div class="template-login__card-heading">
          <div>
            <h1>登录</h1>
            <p>欢迎进入示例管理系统</p>
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
                placeholder="请输入验证码"
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
    </section>

    <!-- 企业标识独立放在视口底部，避免改变登录卡片的既有位置 -->
    <footer class="template-login__company">
      <img :src="companyLogo" alt="" />
      <span>辽宁鸣亿科技有限公司</span>
    </footer>
  </main>
</template>

<style scoped>
/*
 * 深蓝到青绿的分段渐变增强颜色辨识，同时让登录卡片保持稳定焦点。
 * 背景不使用客户标志、真实系统截图或业务专属素材。
 * 缓慢位移与局部柔光强化层次，避免整页使用同一亮度显得平淡。
 * 高度固定为 100vh 并裁剪溢出，防止 body 出现滚动条。
 * 使用 fixed 定位脱离文档流，确保不同浏览器下 body 均不会因内容产生滚动条。
 */
.template-login {
  --login-primary: #4f9cff;
  --login-accent: #5eead4;
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: #ffffff;
  background:
    linear-gradient(
      120deg,
      #050b1b 0%,
      #123d7a 38%,
      #0b7891 70%,
      #14a88f 100%
    );
  background-size: 200% 200%;
  animation: loginGradientShift 18s ease-in-out infinite;
}

/*
 * 细网格用于降低大面积渐变背景的空旷感。
 * 网格使用浅色细线增强中间区域层次，但不与输入框边界竞争。
 * pointer-events:none 确保装饰层不拦截表单交互。
 * 固定网格尺寸让不同视口下的视觉密度保持稳定。
 * 纵向遮罩让上下区域逐渐消失，仅保留中间部分的网格氛围。
 * 使用 CSS 绘制可避免模板引入额外图片资源。
 */
.template-login::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  content: "";
  pointer-events: none;
  opacity: 0.5;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.22) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image:
    linear-gradient(
      to bottom,
      transparent 0%,
      transparent 18%,
      #000000 34%,
      #000000 66%,
      transparent 82%,
      transparent 100%
    );
  mask-image:
    linear-gradient(
      to bottom,
      transparent 0%,
      transparent 18%,
      #000000 34%,
      #000000 66%,
      transparent 82%,
      transparent 100%
    );
}

/* 双层柔光使用 6 秒呼吸节奏，在深蓝与青绿区域分别加强局部色彩 */
.template-login::after {
  position: absolute;
  z-index: 0;
  inset: 0;
  content: "";
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 26%, rgba(96, 165, 250, 0.34), transparent 30%),
    radial-gradient(circle at 80% 70%, rgba(45, 212, 191, 0.32), transparent 34%);
  animation: loginGlowPulse 6s ease-in-out infinite;
}

/* 渐变缓慢往返移动，循环首尾保持连续 */
@keyframes loginGradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

/* 柔光仅改变透明度和缩放，避免触发布局重排 */
@keyframes loginGlowPulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.96);
  }

  50% {
    opacity: 0.68;
    transform: scale(1.06);
  }
}

/* 尊重系统减少动态效果设置，保留静态渐变作为降级 */
@media (prefers-reduced-motion: reduce) {
  .template-login,
  .template-login::after {
    animation: none;
  }
}

.template-login__brand {
  position: absolute;
  z-index: 2;
  top: 30px;
  left: clamp(24px, 7vw, 96px);
  display: flex;
  align-items: center;
  /* 2026-07-22 修订：桌面系统名称使用 48px，强化模板品牌识别 */
  font-size: 48px;
  font-weight: 700;
  /* 保留字体上下度量空间，避免 48px 行盒裁掉中文笔画底部 */
  line-height: 1.2;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 8px 28px rgba(2, 8, 23, 0.3);
}

/*
 * 主内容保留右侧登录卡片，左侧仅承担渐变背景留白。
 * 登录卡片列固定为 420px，避免大屏时表单被拉宽。
 * 空白列允许伸缩，使卡片在不同桌面宽度下稳定靠右。
 * 上方留白用于避开绝对定位的系统品牌区域。
 * 小视口通过媒体查询改为单列居中。
 */
.template-login__content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  align-items: center;
  width: min(1280px, calc(100% - 96px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 110px 0 64px;
}

/*
 * 深色玻璃面板通过半透明背景、细亮边与模糊效果建立现代层级。
 * 阴影只强化层级，不承担任何可点击状态表达。
 * backdrop-filter 不影响不支持该属性时的基础可读性。
 */
.template-login__card {
  grid-column: 2;
  width: 100%;
  height: 500px;
  background: rgba(7, 22, 40, 0.68);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  box-shadow:
    0 32px 80px rgba(2, 8, 23, 0.44),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(130%);
}

.template-login__card :deep(.ant-card-body) {
  height: 100%;
  padding: 32px 36px 16px;
}

.template-login__card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.template-login__card-heading h1 {
  margin: 0 0 6px;
  color: #ffffff;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.5px;
}

.template-login__card-heading p {
  margin: 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 14px;
  line-height: 21px;
}

/*
 * 输入框仅覆盖颜色，不重写 Ant Design 的交互结构。
 * 聚焦、禁用、密码显隐和校验状态仍由官方组件处理。
 * 前缀图标使用弱色，避免与用户输入内容争夺层级。
 * 占位文字降低对比度，但仍保持可识别。
 * 背景透明度让输入区与卡片形成细微层次。
 */
.template-login__card :deep(.ant-input-affix-wrapper) {
  height: 44px;
  color: rgba(248, 250, 252, 0.92);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.template-login__card :deep(.ant-input-affix-wrapper:hover),
.template-login__card :deep(.ant-input-affix-wrapper-focused) {
  border-color: var(--login-primary);
  background: rgba(255, 255, 255, 0.09);
  box-shadow: 0 0 0 3px rgba(79, 156, 255, 0.16);
}

.template-login__card :deep(.ant-input) {
  color: rgba(248, 250, 252, 0.92);
  background: transparent;
}

.template-login__card :deep(.ant-input::placeholder) {
  color: rgba(226, 232, 240, 0.42);
}

.template-login__card :deep(.ant-input-prefix),
.template-login__card :deep(.ant-input-password-icon) {
  color: rgba(203, 213, 225, 0.58);
}

/* 覆盖 Ant Design 默认深色交互态，保证深色输入框中的显隐图标始终清晰 */
.template-login__card :deep(.ant-input-password-icon:hover),
.template-login__card :deep(.ant-input-password-icon:focus),
.template-login__card :deep(.ant-input-password-icon:active) {
  color: #ffffff !important;
}

/*
 * 验证码与输入框保持同一行，便于快速完成登录。
 * 固定展示宽度参考目标页面，不随验证码字符数抖动。
 * 输入列使用 minmax，保证窄屏时优先压缩而不是溢出。
 * 验证码垂直居中，避免 35px 图片高度与 44px 输入框错位。
 * 字符间距只用于增强识别，不模拟真实验证码干扰算法。
 * 背景使用浅色以维持验证码字符的稳定对比度。
 * 手机宽度下由媒体查询进一步收窄展示列。
 */
.template-login__captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 105px;
  gap: 10px;
}

.template-login__captcha {
  display: flex;
  align-items: center;
  justify-content: center;
  /* 2026-07-22 修订：与左侧验证码输入框顶部对齐 */
  align-self: start;
  height: 35px;
  color: #0f3b52;
  font-family: Georgia, serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 5px;
  background: rgba(240, 253, 250, 0.94);
  border: 1px solid rgba(94, 234, 212, 0.36);
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  user-select: none;
}

.template-login__card :deep(.ant-form-item) {
  /* 参考页相邻输入框实测间距为 34px，同时使验证码到按钮间距达到 42px */
  margin-bottom: 34px;
}

.template-login__card :deep(.ant-btn-primary) {
  height: 46px;
  margin-top: 8px;
  font-size: 16px;
  letter-spacing: 6px;
  background: linear-gradient(135deg, #3b82f6 0%, #0891b2 100%);
  border-color: transparent;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(8, 145, 178, 0.22);
  transition: box-shadow 0.2s ease;
}

.template-login__card :deep(.ant-btn-primary:hover) {
  background: linear-gradient(135deg, #60a5fa 0%, #06b6d4 100%);
  border-color: transparent;
  box-shadow: 0 12px 28px rgba(8, 145, 178, 0.3);
}

.template-login__tip {
  margin: 30px 0 0;
  color: rgba(203, 213, 225, 0.52);
  font-size: 14px;
  line-height: 18px;
  text-align: center;
}

/*
 * 企业标识固定在视口底部居中，不参与主内容网格布局。
 * Logo 作为文字前置识别图形，使用空替代文本避免读屏重复播报公司信息。
 */
.template-login__company {
  position: absolute;
  z-index: 2;
  bottom: 24px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 14px;
  line-height: 28px;
  white-space: nowrap;
  transform: translateX(-50%);
}

.template-login__company img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

/*
 * 小视口优先保证登录任务完整显示。
 * 登录卡片保持单列居中，触控区域不被压缩。
 * 品牌仍固定在顶部，系统身份不会因响应式消失。
 * 页面继续保留四周安全间距，避免贴边显示。
 */
@media (max-width: 900px) {
  .template-login__content {
    grid-template-columns: minmax(0, 420px);
    justify-content: center;
    width: 100%;
    padding: 100px 24px 40px;
  }

  .template-login__card {
    grid-column: 1;
  }
}

@media (max-width: 520px) {
  .template-login__brand {
    top: 22px;
    left: 20px;
    font-size: 21px;
  }

  .template-login__card :deep(.ant-card-body) {
    padding: 22px;
  }

  .template-login__company {
    bottom: 16px;
    font-size: 12px;
  }

  .template-login__company img {
    width: 24px;
    height: 24px;
  }

  /* 手机宽度下缩短验证码展示区，防止输入框被固定列宽挤出卡片 */
  .template-login__captcha-row {
    grid-template-columns: minmax(0, 1fr) 80px;
  }
}
</style>
