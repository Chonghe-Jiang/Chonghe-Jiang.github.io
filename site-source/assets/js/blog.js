(() => {
  const paperMap = document.getElementById("ppo-paper-map");
  if (paperMap) {
    const buttons = [...paperMap.querySelectorAll(".ppo-paper-select button")];
    const stages = [...paperMap.querySelectorAll(".ppo-stage")];
    const detail = paperMap.querySelector(".ppo-paper-detail");
    paperMap.querySelector(".ppo-map-interaction").hidden = false;
    buttons.forEach((button) =>
      button.addEventListener("click", () => {
        const all = button.dataset.paper === "all";
        const selected = (button.dataset.stages || "").split(" ");
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        stages.forEach((stage) => {
          stage.classList.toggle("is-selected", !all && selected.includes(stage.dataset.stage));
          stage.classList.toggle("is-muted", !all && !selected.includes(stage.dataset.stage));
        });
        paperMap.querySelectorAll(".ppo-stage-papers a").forEach((link) => {
          link.classList.toggle("is-selected", !all && link.dataset.paper === button.dataset.paper);
        });
        detail.querySelector(".ppo-detail-name").textContent = all ? "Explore the loop" : button.textContent;
        detail.querySelector("p").textContent = all ? "Select a paper to highlight the stages it changes." : button.dataset.detail;
        const source = detail.querySelector("a");
        source.hidden = all;
        if (all) source.removeAttribute("href");
        else source.href = button.dataset.url;
      })
    );
  }

  const tocLinks = [...document.querySelectorAll(".essay-toc a")];
  if ("IntersectionObserver" in window && tocLinks.length) {
    const sections = tocLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!active) return;
        tocLinks.forEach((a) => {
          if (a.hash === "#" + active.target.id) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-100px 0px -65% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
  }
})();

(() => {
  const map = document.getElementById("ar-map");
  if (!map) return;
  const controls = map.querySelector(".ar-map-controls");
  const buttons = [...controls.querySelectorAll("button")];
  const detail = map.querySelector(".ar-map-detail");
  const nodes = [...map.querySelectorAll("[data-component]")];
  const defaults = new Map(nodes.map((node) => [node.dataset.component, node.querySelector(".ar-node-copy").textContent]));
  const operations = {
    CCTS: {
      parent: "Fit good/bad concept distributions; reweight parents by their likelihood ratio.",
    },
    "Fork-and-Flush": {
      propose: "Fork several fresh-context continuations from the same workspace.",
      memory: "Continue the best branch after a fixed horizon; retain its workspace.",
    },
    Forgetting: {
      parent: "Restart the whole team from its best candidate.",
      memory: "Keep the best candidate and score; clear sessions and other candidate history.",
    },
    SLA: {
      parent: "A fresh Advisor assigns experiments from global evidence.",
      propose: "Workers run distinct assignments with focused, freshly rebuilt contexts.",
      memory: "Keep candidates and outcomes in the harness; rebuild context for each role.",
    },
    DuoDiscover: {
      parent: "Workers choose targets and build cheap, tailored evaluators.",
      evaluate: "Screen with proxies; confirm gains and recheck proxy rankings with full tests.",
    },
    IdeaScientist: {
      parent: "Train gap finding and innovation to develop research directions.",
      propose: "A trained report writer turns ideas into research proposals.",
      evaluate: "Assess novelty and proposal quality against the literature.",
    },
    "Guidance-TTT": {
      parent: "Learn strategic edits from verifier rewards; PUCT selects parents.",
      propose: "A frozen executor implements the guidance.",
    },
    "MIRA-AC": {
      parent: "Learn which investigation to run next, or when to stop, from downstream returns.",
    },
  };
  controls.hidden = false;
  buttons.forEach((button) =>
    button.addEventListener("click", () => {
      const changes = operations[button.dataset.method] || {};
      const overview = button.dataset.components === "all";
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      nodes.forEach((node) => {
        const key = node.dataset.component;
        const changed = Object.hasOwn(changes, key);
        node.classList.toggle("is-selected", changed);
        node.querySelector(".ar-node-copy").textContent = changes[key] || defaults.get(key);
      });
      detail.hidden = overview;
      detail.querySelector("strong").textContent = button.dataset.title;
      detail.querySelector("p").textContent = button.dataset.description;
      detail.querySelector(".ar-training-label").textContent = overview
        ? "Search-state updates; policy training is optional"
        : button.dataset.trainingLabel || "Training-free · frozen models";
      const link = detail.querySelector("a");
      link.hidden = !button.dataset.url;
      if (button.dataset.url) link.href = button.dataset.url;
      else link.removeAttribute("href");
    })
  );
})();
