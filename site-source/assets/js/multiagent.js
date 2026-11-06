/* Progressive enhancement: every diagram remains readable without JavaScript. */
(() => {
  document.querySelectorAll("[data-ma-explorer]").forEach((figure) => {
    const controls = figure.querySelector("[data-ma-controls]");
    const buttons = [...controls.querySelectorAll("button[data-ma-select]")];
    const panels = [...figure.querySelectorAll("[data-ma-panel]")];
    const status = figure.querySelector("[data-ma-status]");

    const select = (button, announce = true) => {
      const key = button.dataset.maSelect;
      buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.maPanel !== key;
      });
      if (status && announce) status.textContent = button.dataset.maAnnouncement;
    };

    controls.hidden = false;
    figure.dataset.maReady = "true";
    select(buttons.find((button) => button.getAttribute("aria-pressed") === "true") || buttons[0], false);
    buttons.forEach((button) => button.addEventListener("click", () => select(button)));

    // Buttons retain their native Tab / Enter / Space behavior; arrows also work.
    controls.addEventListener("keydown", (event) => {
      const index = buttons.indexOf(document.activeElement);
      if (index < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? buttons.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      select(buttons[next]);
    });
  });
})();
