document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.querySelector(".figure-dialog");
  if (!dialog) return;
  const image = dialog.querySelector("img");
  const caption = dialog.querySelector(".figure-caption");
  document.querySelectorAll(".paper-figure").forEach((button) => {
    button.addEventListener("click", () => {
      image.src = button.querySelector("img").src;
      image.alt = button.dataset.figureTitle;
      caption.textContent = button.dataset.figureTitle;
      dialog.showModal();
    });
  });
  dialog.querySelector(".figure-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  window.addEventListener("hashchange", () => dialog.close());
});
