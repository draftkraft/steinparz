const dialog = document.querySelector('dialog');
const photo = dialog.querySelector('img');
const gallery = [...document.querySelectorAll('[data-photo]')];
let opener;
let current = 0;
function showPhoto(index) {
  current = (index + gallery.length) % gallery.length;
  const item = gallery[current];
  photo.src = item.dataset.photo;
  photo.alt = item.querySelector('img').alt;
  dialog.querySelector('p').textContent = item.dataset.caption;
  dialog.querySelector('.photo-count').textContent = `${current + 1} / ${gallery.length}`;
}
gallery.forEach((button, index) => {
  button.addEventListener('click', () => {
    opener = button;
    showPhoto(index);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  });
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.querySelector('.photo-prev').addEventListener('click', () => showPhoto(current - 1));
dialog.querySelector('.photo-next').addEventListener('click', () => showPhoto(current + 1));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  opener?.focus();
});
// Never intercept scrolling; reveal only supporting copy, with motion preferences respected.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.intro > div, .wildlife > div, .story-copy, .together-copy, .section-heading, .quotes figure').forEach(element => {
    element.classList.add('reveal');
    observer.observe(element);
  });
  document.documentElement.classList.add('motion-ready');
}

const menuButton = document.querySelector('.menu-toggle');
function closeMenu() {
  document.body.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('#main-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
    closeMenu();
    menuButton.focus();
  }
});
matchMedia('(min-width: 1101px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});
let progressQueued = false;
function updateProgress() {
  const height = document.documentElement.scrollHeight - innerHeight;
  document.querySelector('.reading-progress').style.transform = `scaleX(${height > 0 ? Math.min(1, Math.max(0, scrollY / height)) : 0})`;
  progressQueued = false;
}
addEventListener('scroll', () => {
  if (!progressQueued) {
    progressQueued = true;
    requestAnimationFrame(updateProgress);
  }
}, { passive: true });
addEventListener('resize', updateProgress);
updateProgress();

document.querySelector('.language-select').addEventListener('change', event => {
  const target = event.target.value;
  if (/^\/(?:en|it|fr|sl|hu|cs|sk)?\/?$/.test(target)) location.assign(target + location.hash);
});

// Move only photographs; copy and controls stay anchored and scrolling stays native.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const scenes = [...document.querySelectorAll('.hero, .nature-scene, .garden-scene, .winter-scene, .booking')].map(section => ({
    section, image: section.querySelector(':scope > img'), x: 0, y: 0, targetX: 0, targetY: 0,
    pointerX: 0, pointerY: 0, visible: false,
  })).filter(scene => scene.image);
  let frame = 0;
  let previousTime = 0;
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
  function queue() {
    if (!frame && !reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(render);
  }
  function render(time) {
    frame = 0;
    const blend = 1 - Math.exp(-Math.min(64, time - (previousTime || time - 16)) / 110);
    previousTime = time;
    let moving = false;
    scenes.forEach(scene => {
      if (!scene.visible) return;
      const rect = scene.section.getBoundingClientRect();
      const travel = Math.min(28, rect.height * .035);
      const progress = clamp((innerHeight / 2 - rect.top - rect.height / 2) / ((innerHeight + rect.height) / 2), 1);
      scene.targetX = scene.pointerX * 6;
      scene.targetY = progress * travel + scene.pointerY * 5;
      scene.x += (scene.targetX - scene.x) * blend;
      scene.y += (scene.targetY - scene.y) * blend;
      scene.image.style.transform = `translate3d(${scene.x.toFixed(2)}px, ${scene.y.toFixed(2)}px, 0) scale(1.12)`;
      if (Math.abs(scene.targetX - scene.x) + Math.abs(scene.targetY - scene.y) > .05) moving = true;
    });
    if (moving) queue();
  }
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const scene = scenes.find(item => item.section === entry.target);
      scene.visible = entry.isIntersecting;
    });
    queue();
  });
  scenes.forEach(scene => {
    observer.observe(scene.section);
    scene.section.addEventListener('pointermove', event => {
      if (!finePointer.matches || event.pointerType !== 'mouse') return;
      const rect = scene.section.getBoundingClientRect();
      scene.pointerX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, 1);
      scene.pointerY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, 1);
      queue();
    }, { passive: true });
    scene.section.addEventListener('pointerleave', () => {
      scene.pointerX = scene.pointerY = 0;
      queue();
    });
  });
  function syncMotion() {
    cancelAnimationFrame(frame);
    frame = previousTime = 0;
    scenes.forEach(scene => {
      scene.x = scene.y = scene.pointerX = scene.pointerY = 0;
      scene.section.classList.toggle('depth-active', !reducedMotion.matches);
      scene.image.style.removeProperty('transform');
    });
    queue();
  }
  reducedMotion.addEventListener('change', syncMotion);
  finePointer.addEventListener('change', syncMotion);
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = previousTime = 0;
    } else queue();
  });
  syncMotion();
})();
