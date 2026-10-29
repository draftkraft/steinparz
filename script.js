const dialog = document.querySelector('dialog');
const photo = dialog.querySelector('img');
let opener;
document.querySelectorAll('[data-photo]').forEach(button => {
  button.addEventListener('click', () => {
    opener = button;
    photo.src = button.dataset.photo;
    photo.alt = button.querySelector('img').alt;
    dialog.querySelector('p').textContent = button.dataset.caption;
    dialog.showModal();
  });
});
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
dialog.addEventListener('close', () => opener?.focus());
