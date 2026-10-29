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
