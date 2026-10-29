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
matchMedia('(min-width: 701px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});
const track = document.querySelector('.gallery-track');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
for (const [selector, direction] of [['.strip-prev', -1], ['.strip-next', 1]]) {
  document.querySelector(selector).addEventListener('click', () => {
    track.scrollBy({ left: direction * track.clientWidth * 0.72, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
}
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
