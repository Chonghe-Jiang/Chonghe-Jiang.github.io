(() => {
  document.querySelectorAll(".cl-window-figure").forEach((figure) => {
    const controls = figure.querySelector(".cl-window-controls");
    const buttons = [...controls.querySelectorAll("button")];
    const subscript = ["₀", "₁", "₂", "₃", "₄"];
    const select = (stage) => {
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.stage) === stage)));
      figure.querySelector(".cl-window-status").textContent =
        stage === 4 ? "All four windows have arrived." :
        stage === 1 ? "Window 1 has arrived; windows 2–4 are still ahead." :
        `Windows 1–${stage} have arrived; ${stage === 3 ? "window 4 is" : "windows 3–4 are"} still ahead.`;
      figure.querySelectorAll(".cl-window-row").forEach((row) => {
        const mode = row.dataset.mode;
        row.querySelectorAll(".cl-window-chip").forEach((chip) => {
          const window = Number(chip.dataset.window);
          const state = window > stage ? "future" : (mode === "joint" || window === stage) ? "used" : "past";
          chip.className = `cl-window-chip is-${state}`;
          chip.querySelector("span").textContent = { future: "Not yet available", used: "Used now", past: "Not used now" }[state];
        });
        row.querySelector("[data-start]").textContent = mode === "continual" ?
          `${stage === 1 ? "Initial" : "Previous"} model θ${subscript[stage - 1]}` : "Same initial model θ₀";
        row.querySelector("[data-train]").textContent = "RL on " + (mode === "joint" ?
          Array.from({ length: stage }, (_, i) => `W${subscript[i + 1]}`).join(" ∪ ") : `W${subscript[stage]}`);
        if (mode === "continual") {
          row.querySelector("[data-result]").textContent = `Updated model θ${subscript[stage]}`;
          row.querySelector("[data-note]").textContent = stage === 1 ?
            "The first stage is shared; the setups diverge when later windows arrive." :
            "Earlier learning survives through the weights; old-task performance can fall.";
        }
      });
    };
    controls.hidden = false;
    buttons.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.stage))));
    select(3);
  });

  document.querySelectorAll(".ppo-family-figure").forEach((figure) => {
    const controls = figure.querySelector(".ppo-variant-controls");
    if (!controls) return;
    const buttons = [...controls.querySelectorAll("button")];
    const panels = [...figure.querySelectorAll(".ppo-variant")];
    const select = (button) => {
      buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.variant !== button.dataset.variant;
      });
    };
    controls.hidden = false;
    select(buttons[0]);
    buttons.forEach((button) => button.addEventListener("click", () => select(button)));
  });

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
    "RSI-top": {
      parent: "When progress stalls, inspect different metric subsets and retrieve useful trajectories.",
      propose: "Propose portfolios with verbalized probabilities, grounded in different search lineages.",
      memory: "Index full trajectories with fixed task-specific metrics; keep details available on demand.",
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
      link.textContent = button.dataset.sourceLabel || "Read the paper ↗";
      link.hidden = !button.dataset.url;
      if (button.dataset.url) link.href = button.dataset.url;
      else link.removeAttribute("href");
    })
  );
})();

(() => {
  const variants = {
    fork: {
      first: "Accumulated workspace",
      firstCopy: "Artifacts from the search so far.",
      second: "Fresh contexts",
      secondCopy: "Each branch starts a new conversation.",
      reset: "Reset chat history",
      third: "Parallel attempts",
      thirdCopy: "Run each branch for a fixed horizon.",
      feedback: "Continue from the best branch",
      note: "The workspace survives the reset; the winning branch supplies the next starting point.",
      url: "https://arxiv.org/abs/2610.07447",
    },
    forget: {
      first: "Best candidate",
      firstCopy: "Keep the strongest solution and its score.",
      second: "Restarted team",
      secondCopy: "Start new sessions from that candidate.",
      reset: "Discard other candidate history",
      third: "New search",
      thirdCopy: "Agents explore and share new candidates.",
      feedback: "Retain the best result for the next reset",
      note: "Forgetting reaches beyond chat: the team also discards the other candidate history.",
      url: "https://arxiv.org/abs/2610.20563",
    },
    sla: {
      first: "External research record",
      firstCopy: "The harness keeps candidates and outcomes.",
      second: "Role-specific context",
      secondCopy: "Rebuild context for each invocation.",
      reset: "No conversation carried over",
      third: "Assigned experiments",
      thirdCopy: "An Advisor directs fresh Workers.",
      feedback: "Write results back to the research record",
      note: "The search retains state outside conversations. The Advisor also decides what each Worker investigates.",
      url: "https://arxiv.org/abs/2610.07625",
    },
    rsi: {
      first: "Full search history",
      firstCopy: "Keep code, reasoning, outcomes and failures.",
      second: "Dashboard + retrieval",
      secondCopy: "Give planners different metric views; unfold relevant trajectories.",
      reset: "Retrieve selectively; retain the archive",
      third: "Diverse directions",
      thirdCopy: "Propose alternative ideas across different search lineages.",
      feedback: "Return new candidates to the native search",
      note: "When progress stalls, planners propose portfolios with verbalized probabilities to surface less-obvious ideas. Model weights and native search rules stay fixed.",
      url: "https://rsi-top.github.io/",
      sourceLabel: "Read the blog ↗",
    },
    guidance: {
      first: "Guidance model θ",
      firstCopy: "Propose strategic edits to a parent solution.",
      middleRole: "Execute",
      second: "Frozen executor",
      secondCopy: "Implement the edits as a complete program.",
      third: "Task verifier",
      thirdCopy: "Run the program and measure its quality.",
      feedback: "Verifier reward updates guidance θ",
      note: "Learning happens on the current task. Only the guidance model changes; the executor stays frozen.",
      url: "https://arxiv.org/abs/2610.06269",
    },
    mira: {
      first: "Meta-reasoner θ",
      firstCopy: "Choose the next work order, or stop.",
      middleRole: "Execute",
      second: "Fresh executor",
      secondCopy: "Carry out the investigation without policy updates.",
      third: "Downstream return",
      thirdCopy: "Assess progress over later investigations.",
      feedback: "Actor–critic updates research decisions θ",
      note: "MIRA-AC learns decisions at investigation boundaries, using a shared model for policy and value estimation.",
      url: "https://arxiv.org/abs/2610.02525",
    },
    idea: {
      first: "Ideation roles θ",
      firstCopy: "Learn gap finding, innovation and report writing.",
      middleRole: "Develop",
      second: "Research proposal",
      secondCopy: "A fixed orchestrator coordinates the trained roles.",
      third: "Proposal assessment",
      thirdCopy: "Judge novelty and quality against literature.",
      feedback: "RL trains the ideation roles θ",
      note: "IdeaScientist trains several roles. Its output is a proposal; evaluation does not execute the proposed experiment.",
      url: "https://arxiv.org/abs/2610.04074",
    },
  };
  document.querySelectorAll(".ar-takeaway-panel").forEach((figure) => {
    const controls = figure.querySelector(".ar-takeaway-switch");
    if (!controls) return;
    controls.hidden = false;
    const buttons = [...controls.querySelectorAll("button")];
    buttons.forEach((button) =>
      button.addEventListener("click", () => {
        const variant = variants[button.dataset.variant];
        if (!variant) return;
        buttons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
        figure.querySelectorAll("[data-field]").forEach((field) => {
          field.textContent = variant[field.dataset.field];
        });
        figure.querySelector("[data-source]").href = variant.url;
        figure.querySelector("[data-source]").textContent = variant.sourceLabel || "Read the paper ↗";
      })
    );
  });
  const takeaway = document.getElementById("ar-takeaways");
  if (!takeaway) return;
  const modes = takeaway.querySelector(".ar-takeaway-modes");
  const tabs = [...modes.querySelectorAll('[role="tab"]')];
  const selectMode = (tab) => {
    tabs.forEach((other) => {
      const selected = other === tab;
      other.setAttribute("aria-selected", String(selected));
      other.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(other.getAttribute("aria-controls"));
      panel.hidden = !selected;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", other.id);
    });
  };
  modes.hidden = false;
  selectMode(tabs[0]);
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectMode(tab));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectMode(tabs[next]);
      tabs[next].focus();
    });
  });
})();
