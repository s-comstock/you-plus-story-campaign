function initLenis() {
  lenis = new Lenis({
    autoRaf: true,
    lerp: .06,
  });
}

initLenis();
lenis.resize();
ScrollTrigger.refresh();
