document.addEventListener("DOMContentLoaded", () => {
  const controls = document.querySelector(".research-controls");
  if (controls) {
    const buttons = [...controls.querySelectorAll("[data-research-filter]")];
    const sections = [...document.querySelectorAll("[data-research-category]")];
    function filter(category) {
      sections.forEach((section) => {
        section.hidden = category !== "all" && section.dataset.researchCategory !== category;
      });
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.researchFilter === category)));
    }
    buttons.forEach((button) => button.addEventListener("click", () => filter(button.dataset.researchFilter)));
    window.addEventListener("hashchange", () => {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      const section = target?.closest("[data-research-category]");
      if (section?.hidden) {
        filter("all");
        target.scrollIntoView();
      }
    });
    controls.hidden = false;
  }
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
