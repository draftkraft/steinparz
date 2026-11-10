// Safari can restore the sideways offset left by an older, wider page. Correct
// only that offset on entry/rotation; retain vertical anchors and pinch zoom.
function alignPageViewport() {
  if (window.visualViewport && window.visualViewport.scale > 1) return;
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
}
window.addEventListener('pageshow', () => requestAnimationFrame(alignPageViewport));
window.addEventListener('orientationchange', () => requestAnimationFrame(alignPageViewport));

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
document.querySelectorAll('.language-select').forEach(select => select.addEventListener('change', event => {
  const target = event.target.value;
  if (/^\/(?:en|it|fr|sl|hu|cs|sk)?\/?$/.test(target)) location.assign(target + location.hash);
}));

// Move only photographs; copy and controls stay anchored and scrolling stays native.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const scenes = [...document.querySelectorAll('.hero, .nature-scene, .garden-scene, .winter-scene, .booking')].map(section => ({
    section, image: section.querySelector('img'), x: 0, y: 0, targetX: 0, targetY: 0,
    pointerX: 0, pointerY: 0, visible: false,
  })).filter(scene => scene.image);
  let frame = 0;
  let previousTime = 0;
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
  function queue() {
    if (!frame && !reducedMotion.matches && finePointer.matches && !document.hidden) frame = requestAnimationFrame(render);
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
      scene.section.classList.toggle('depth-active', !reducedMotion.matches && finePointer.matches);
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

// Use the compact footer switcher whenever the full language list would wrap.
(() => {
  const container = document.querySelector('.footer-languages');
  if (!container) return;
  const links = container.querySelector('.language-links');
  function updateFooterLanguages() {
    const gap = parseFloat(getComputedStyle(links).columnGap) || 0;
    const required = [...links.children].reduce((width, link) => width + link.getBoundingClientRect().width, 0) + gap * (links.children.length - 1);
    container.classList.toggle('is-compact', required > container.clientWidth);
  }
  new ResizeObserver(updateFooterLanguages).observe(container);
  document.fonts.ready.then(updateFooterLanguages);
  updateFooterLanguages();
})();

// The booking search sends the chosen stay to the freetobook booking page in the
// page language. Dates and guest count are translated into the page's own query
// parameters on submit; without JavaScript the form still opens the booking page.
(() => {
  const form = document.querySelector('.booking-search');
  if (!form) return;
  const checkin = form.querySelector('[name="checkin"]');
  const checkout = form.querySelector('[name="checkout"]');
  const adults = form.querySelector('[name="adults"]');
  const isoDate = date => date.toISOString().slice(0, 10);
  const shift = (value, days) => { const date = new Date(`${value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return isoDate(date); };
  checkin.min = isoDate(new Date());
  checkout.min = shift(checkin.min, 1);
  checkin.addEventListener('change', () => {
    if (!checkin.value) return;
    checkout.min = shift(checkin.value, 1);
    if (!checkout.value || checkout.value <= checkin.value) checkout.value = shift(checkin.value, 4);
  });
  form.addEventListener('submit', () => {
    const hidden = (name, value) => {
      const input = form.querySelector(`input[name="${name}"]`) || form.appendChild(Object.assign(document.createElement('input'), { type: 'hidden', name }));
      input.value = value;
    };
    hidden('search_stay_dates', JSON.stringify({ checkInDate: checkin.value, checkOutDate: checkout.value }));
    hidden('search_occupancies', JSON.stringify([{ numberOfAdults: Number(adults.value), children: [] }]));
    for (const field of [checkin, checkout, adults]) field.removeAttribute('name');
  });
})();

// Give the fixed header a solid background once the page is scrolled.
const siteHeader = document.querySelector('header');
function markScrolled() { if (siteHeader) siteHeader.classList.toggle('is-scrolled', scrollY > 40); }
addEventListener('scroll', markScrolled, { passive: true });
markScrolled();
