// 内容区高度变化时的过渡，与 useRowMotion 补位时长一致
const HEIGHT_TRANSITION_MS = 300;

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function animateHeightCollapse(element, startHeight) {
  if (!element || prefersReducedMotion()) {
    return Promise.resolve();
  }

  const endHeight = element.offsetHeight;
  if (startHeight === endHeight) {
    return Promise.resolve();
  }

  element.style.overflow = "hidden";
  element.style.height = `${startHeight}px`;
  void element.offsetHeight;
  element.style.transition = `height ${HEIGHT_TRANSITION_MS}ms ease-in-out`;
  element.style.height = `${endHeight}px`;

  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.height = "";
      element.style.overflow = "";
      element.style.transition = "";
      resolve();
    }, HEIGHT_TRANSITION_MS);
  });
}
