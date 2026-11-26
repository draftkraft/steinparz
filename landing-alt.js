// Alternative family page: fade supporting copy in once, and let the scene photo drift a few
// pixels while it scrolls through the viewport. Scrolling stays native; nothing moves with reduced motion.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
  document.documentElement.classList.add('ff-motion');
  const reveal = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.ff-reveal').forEach(element => reveal.observe(element));

  const scenes = [...document.querySelectorAll('.ff-scene')].map(section => ({ section, visible: false }));
  let frame = 0;
  function render() {
    frame = 0;
    scenes.forEach(scene => {
      if (!scene.visible) return;
      const rect = scene.section.getBoundingClientRect();
      // -1 when the scene enters from below, 0 when centred, 1 when it leaves at the top.
      const progress = (innerHeight / 2 - rect.top - rect.height / 2) / ((innerHeight + rect.height) / 2);
      scene.section.style.setProperty('--ff-p', Math.max(-1, Math.min(1, progress)).toFixed(3));
    });
  }
  function queue() {
    if (!frame && !reducedMotion.matches) frame = requestAnimationFrame(render);
  }
  const watch = new IntersectionObserver(entries => {
    entries.forEach(entry => { scenes.find(scene => scene.section === entry.target).visible = entry.isIntersecting; });
    queue();
  });
  scenes.forEach(scene => watch.observe(scene.section));
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return queue();
    scenes.forEach(scene => scene.section.style.removeProperty('--ff-p'));
    document.documentElement.classList.remove('ff-motion');
  });
})();
