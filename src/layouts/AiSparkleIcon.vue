<template>
  <!-- AI 入口共用的三星芒图标：顶部栏入口与右下角悬浮入口必须使用同一组件，避免两处图标走样 -->
  <!-- 使用文字字符而非 SVG：顶部入口依赖 background-clip: text 实现渐变流动，SVG 无法被文字裁剪着色 -->
  <span class="ai-sparkle" aria-hidden="true">
    <span class="ai-sparkle__star ai-sparkle__star--large">✦</span>
    <span class="ai-sparkle__star ai-sparkle__star--medium">✦</span>
    <span class="ai-sparkle__star ai-sparkle__star--small">✦</span>
  </span>
</template>

<style scoped>
/* 网格布局摆放三颗星，不用绝对定位，确保星芒仍属于父级文字流、能被渐变裁剪 */
/* 尺寸统一用 em，随所在按钮字号缩放，两处入口无需各自维护像素值 */
.ai-sparkle {
  display: inline-grid;
  grid-template-areas:
    "large medium"
    "large small";
  align-items: center;
  justify-items: center;
  line-height: 1;
}

.ai-sparkle__star {
  display: block;
  line-height: 1;
}

.ai-sparkle__star--large {
  grid-area: large;
  font-size: 1em;
}

/* 中星贴近大星右上角，略微内收，形成错落的簇状感 */
.ai-sparkle__star--medium {
  grid-area: medium;
  align-self: end;
  margin-left: -0.05em;
  font-size: 0.55em;
}

/* 小星位于右下，尺寸最小，与大星、中星形成三级大小层次 */
.ai-sparkle__star--small {
  grid-area: small;
  align-self: start;
  margin-left: 0.1em;
  font-size: 0.38em;
}
</style>
