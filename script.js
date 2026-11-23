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
const allPhotos = [...document.querySelectorAll('[data-photo]')];
let gallery = allPhotos;
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
allPhotos.forEach(button => {
  button.addEventListener('click', () => {
    opener = button;
    // Arrows only switch within the group of the clicked image (photos or floor plans).
    gallery = allPhotos.filter(item => item.dataset.group === button.dataset.group);
    showPhoto(gallery.indexOf(button));
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
  // Range calendar: one popover with two months (one on phones). A stay must be booked
  // at least 7 days before arrival; earlier days are struck through and cannot be chosen.
  const lang = document.documentElement.lang || 'de';
  const parse = value => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const iso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const addDays = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
  const now = new Date(); now.setHours(12, 0, 0, 0);
  const earliest = iso(addDays(now, 7));
  const latest = iso(addDays(now, 730));
  const nightsBetween = (from, to) => Math.round((parse(to) - parse(from)) / 86400000);
  const monthTitle = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' });
  const shortDate = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' });
  const dayMonth = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' });
  const weekday = new Intl.DateTimeFormat(lang, { weekday: 'narrow' });
  const labels = [checkin, checkout].map(input => input.closest('label'));
  const word = label => label.firstChild.textContent.trim();
  const placeholders = [word(labels[0]), word(labels[1])];
  for (const input of [checkin, checkout]) input.removeAttribute('required');
  labels.forEach(label => { label.hidden = true; });

  const field = document.createElement('div');
  field.className = 'range-field';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'range-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg><span class="range-text"></span>';
  const caption = document.createElement('span');
  caption.textContent = `${placeholders[0]} / ${placeholders[1]}`;
  field.append(caption, trigger);
  form.insertBefore(field, form.firstChild);

  const pop = document.createElement('div');
  pop.className = 'range-popover';
  pop.hidden = true;
  const guests = adults.closest('label');
  guests.after(pop);

  let start = null, end = null, view = earliest.slice(0, 7) + '-01';
  const text = trigger.querySelector('.range-text');
  function updateTrigger() {
    const from = start ? shortDate.format(parse(start)) : placeholders[0];
    const to = end ? shortDate.format(parse(end)) : placeholders[1];
    text.textContent = `${from} → ${to}`;
    text.classList.toggle('is-empty', !start);
  }
  function commit() {
    checkin.value = start && end ? start : '';
    checkout.value = start && end ? end : '';
    if (start && end) for (const input of [checkin, checkout]) input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const monthsShown = () => (matchMedia('(min-width: 700px)').matches ? 2 : 1);
  function render() {
    pop.textContent = '';
    const first = parse(view);
    const months = document.createElement('div');
    months.className = 'range-months';
    for (let offset = 0; offset < monthsShown(); offset++) {
      const month = new Date(first.getFullYear(), first.getMonth() + offset, 1, 12);
      const box = document.createElement('div');
      box.className = 'range-month';
      const title = document.createElement('p');
      title.className = 'range-title';
      title.textContent = monthTitle.format(month);
      box.append(title);
      const grid = document.createElement('div');
      grid.className = 'range-grid';
      // Monday first: 2024-01-01 is a Monday.
      for (let i = 0; i < 7; i++) { const w = document.createElement('span'); w.className = 'range-weekday'; w.textContent = weekday.format(new Date(2024, 0, 1 + i, 12)); grid.append(w); }
      const lead = (month.getDay() + 6) % 7;
      for (let i = 0; i < lead; i++) grid.append(document.createElement('span'));
      const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= days; day++) {
        const value = iso(new Date(month.getFullYear(), month.getMonth(), day, 12));
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'range-day';
        button.textContent = day;
        button.dataset.date = value;
        button.setAttribute('aria-label', new Intl.DateTimeFormat(lang, { dateStyle: 'full' }).format(parse(value)));
        if (value < earliest || value > latest) button.disabled = true;
        // The stay is at least 4 nights: while choosing the departure, the 3 days after the arrival are not available.
        if (start && !end && value > start && nightsBetween(start, value) < 4) button.disabled = true;
        if (value === start) button.classList.add('is-start');
        if (value === end) button.classList.add('is-end');
        if (start && end && value > start && value < end) button.classList.add('in-range');
        if (start && end && (value === start || value === end)) button.classList.add('in-range');
        grid.append(button);
      }
      box.append(grid);
      months.append(box);
    }
    const prev = document.createElement('button');
    prev.type = 'button'; prev.className = 'range-nav range-prev'; prev.textContent = '‹';
    prev.setAttribute('aria-label', monthTitle.format(new Date(first.getFullYear(), first.getMonth() - 1, 1, 12)));
    prev.disabled = view <= earliest.slice(0, 7) + '-01';
    const next = document.createElement('button');
    next.type = 'button'; next.className = 'range-nav range-next'; next.textContent = '›';
    next.setAttribute('aria-label', monthTitle.format(new Date(first.getFullYear(), first.getMonth() + monthsShown(), 1, 12)));
    next.disabled = iso(new Date(first.getFullYear(), first.getMonth() + monthsShown(), 1, 12)) > latest;
    prev.addEventListener('click', () => { view = iso(new Date(first.getFullYear(), first.getMonth() - 1, 1, 12)); render(); pop.querySelector('.range-day:not(:disabled)')?.focus({ preventScroll: true }); });
    next.addEventListener('click', () => { view = iso(new Date(first.getFullYear(), first.getMonth() + 1, 1, 12)); render(); pop.querySelector('.range-day:not(:disabled)')?.focus({ preventScroll: true }); });
    const stage = document.createElement('div');
    stage.className = 'range-stage';
    stage.append(prev, months, next);
    const foot = document.createElement('div');
    foot.className = 'range-foot';
    const clear = document.createElement('button');
    clear.type = 'button'; clear.className = 'range-clear'; clear.textContent = form.dataset.clear;
    clear.addEventListener('click', () => { start = end = null; commit(); updateTrigger(); render(); });
    const summary = document.createElement('p');
    summary.className = 'range-summary';
    if (start && end) summary.innerHTML = `<strong></strong><span></span>`;
    if (start && end) {
      summary.firstChild.textContent = `${form.dataset.nights}: ${nightsBetween(start, end)}`;
      summary.lastChild.textContent = `${dayMonth.format(parse(start))} – ${dayMonth.format(parse(end))}`;
    }
    const search = document.createElement('button');
    search.type = 'button'; search.className = 'range-search'; search.textContent = form.dataset.search;
    search.disabled = !(start && end);
    search.addEventListener('click', () => form.requestSubmit());
    foot.append(clear, summary, search);
    pop.append(stage, foot);
  }
  pop.addEventListener('click', event => {
    const day = event.target.closest('.range-day');
    if (!day) return;
    const value = day.dataset.date;
    if (!start || end || value <= start) { start = value; end = null; } else { end = value; }
    commit(); updateTrigger(); render();
    pop.querySelector(`.range-day[data-date="${value}"]`)?.focus({ preventScroll: true });
  });
  function setOpen(open) {
    pop.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) { if (start) view = start.slice(0, 7) + '-01'; render(); }
  }
  trigger.addEventListener('click', () => setOpen(pop.hidden));
  document.addEventListener('click', event => { if (!pop.hidden && !event.composedPath().includes(form)) setOpen(false); });
  form.addEventListener('keydown', event => { if (event.key === 'Escape' && !pop.hidden) { setOpen(false); trigger.focus({ preventScroll: true }); } });
  matchMedia('(min-width: 700px)').addEventListener('change', () => { if (!pop.hidden) render(); });
  // Without dates the main button opens the calendar instead of submitting.
  form.querySelector('button.button[type="submit"]').addEventListener('click', event => {
    if (checkin.value && checkout.value) return;
    event.preventDefault();
    setOpen(true);
  });
  updateTrigger();
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
