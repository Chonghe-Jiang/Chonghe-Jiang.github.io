(() => {
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

  const panel = document.getElementById("trajectory-panel");
  if (!panel) return;
  const ns = "http://www.w3.org/2000/svg";
  const make = (tag, attrs = {}, text) => {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    if (text !== undefined) node.textContent = text;
    return node;
  };

  fetch(panel.dataset.source)
    .then((response) => {
      if (!response.ok) throw new Error("Chart data unavailable");
      return response.json();
    })
    .then((data) => {
      const stage = panel.querySelector(".chart-stage");
      const controls = panel.querySelector(".chart-controls");
      const legend = panel.querySelector(".chart-legend");
      const budget = document.getElementById("chart-budget");
      const slider = document.getElementById("chart-round");
      const output = document.getElementById("chart-round-value");
      const readout = document.getElementById("chart-readout");
      const metricButtons = [...panel.querySelectorAll("[data-metric]")];
      const state = { metric: "best", maxRound: 30, round: 30 };
      const metricNames = { best: "Best observed score", mean: "Mean score · trailing 5 rounds", valid: "Validity (%) · trailing 5 rounds" };
      const labels = { best: "best", mean: "mean5", valid: "valid5" };
      const zoomLabel = document.createElement("label");
      zoomLabel.className = "range-select";
      const zoom = document.createElement("input");
      zoom.type = "checkbox";
      zoom.checked = true;
      zoom.id = "chart-zoom";
      zoomLabel.append(zoom, document.createTextNode(" Zoom best-score axis to 75–81"));
      controls.after(zoomLabel);
      for (const series of data.series) {
        const item = document.createElement("span");
        const swatch = document.createElement("i");
        swatch.style.setProperty("--series-color", series.color);
        swatch.setAttribute("aria-hidden", "true");
        item.append(swatch, document.createTextNode(series.label));
        legend.append(item);
      }

      function draw() {
        const width = Math.max(300, Math.round(stage.clientWidth));
        const height = width < 440 ? 290 : 340;
        const margins = { left: 39, right: 12, top: 29, bottom: 39 };
        const pw = width - margins.left - margins.right;
        const ph = height - margins.top - margins.bottom;
        const limits = state.metric === "best" ? (zoom.checked ? [75, 81] : [60, 82]) : [0, 100];
        const x = (r) => margins.left + ((r - 1) / (state.maxRound - 1)) * pw;
        const y = (v) => margins.top + ((limits[1] - v) / (limits[1] - limits[0])) * ph;
        const svg = make("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-labelledby": "trajectory-title trajectory-desc" });
        svg.append(make("title", { id: "trajectory-title" }, `${metricNames[state.metric]}, rounds 1–${state.maxRound}`));
        svg.append(
          make(
            "desc",
            { id: "trajectory-desc" },
            `${data.series.length} runs, 128 candidates per round. Vertical axis ${limits[0]} to ${limits[1]}. Series stop when the run ends. Use the round slider for exact values.`
          )
        );
        const defs = make("defs");
        const clip = make("clipPath", { id: "trajectory-clip" });
        clip.append(make("rect", { x: margins.left, y: margins.top, width: pw, height: ph }));
        defs.append(clip);
        svg.append(defs);
        const yTicks = state.metric === "best" ? (zoom.checked ? [75, 76, 77, 78, 79, 80, 81] : [60, 65, 70, 75, 80, 82]) : [0, 20, 40, 60, 80, 100];
        yTicks.forEach((t) => {
          svg.append(make("line", { x1: margins.left, y1: y(t), x2: width - margins.right, y2: y(t), class: "chart-grid" }));
          svg.append(make("text", { x: margins.left - 8, y: y(t) + 4, "text-anchor": "end", class: "chart-axis" }, String(t)));
        });
        const xTicks = state.maxRound === 30 ? [1, 10, 20, 30] : [1, 30, 60, 90, 119];
        xTicks.forEach((t) => svg.append(make("text", { x: x(t), y: height - 21, "text-anchor": "middle", class: "chart-axis" }, String(t))));
        svg.append(make("text", { x: margins.left, y: 13, class: "chart-axis" }, metricNames[state.metric]));
        svg.append(make("text", { x: width - margins.right, y: height - 2, "text-anchor": "end", class: "chart-axis" }, "Completed round"));
        const lines = make("g", { "clip-path": "url(#trajectory-clip)" });
        const key = labels[state.metric];
        data.series.forEach((series) => {
          const rows = series.rounds.filter((r) => r.round <= state.maxRound);
          lines.append(
            make("path", {
              d: rows.map((r, i) => `${i ? "L" : "M"}${x(r.round).toFixed(2)},${y(r[key]).toFixed(2)}`).join(" "),
              fill: "none",
              stroke: series.color,
              "stroke-width": 2.5,
              "stroke-dasharray": series.dash || "",
              "stroke-linejoin": "round",
            })
          );
        });
        lines.append(make("line", { x1: x(state.round), x2: x(state.round), y1: margins.top, y2: margins.top + ph, class: "chart-pointer" }));
        data.series.forEach((series) => {
          const row = series.rounds[state.round - 1];
          if (row)
            lines.append(
              make("circle", {
                cx: x(state.round),
                cy: y(row[key]),
                r: 3.8,
                fill: series.color,
                stroke: "var(--global-bg-color, white)",
                "stroke-width": 1.5,
              })
            );
        });
        svg.append(lines);
        svg.addEventListener("click", (event) => {
          const box = svg.getBoundingClientRect();
          const rel = ((event.clientX - box.left) * width) / box.width;
          state.round = Math.max(1, Math.min(state.maxRound, Math.round(1 + ((rel - margins.left) / pw) * (state.maxRound - 1))));
          slider.value = state.round;
          draw();
        });
        stage.replaceChildren(svg);
        output.textContent = state.round;
        readout.replaceChildren();
        data.series.forEach((series) => {
          const item = document.createElement("span");
          const value = document.createElement("strong");
          const row = series.rounds[state.round - 1];
          value.textContent = row ? row[key].toFixed(state.metric === "valid" ? 1 : 2) + (state.metric === "valid" ? "%" : "") : "—";
          item.append(document.createTextNode(series.label), value);
          if (!row) item.append(document.createTextNode(`Ended at round ${series.rounds.length}`));
          readout.append(item);
        });
      }

      budget.addEventListener("change", () => {
        state.maxRound = budget.value === "all" ? Math.max(...data.series.map((s) => s.rounds.length)) : 30;
        state.round = Math.min(state.round, state.maxRound);
        slider.max = state.maxRound;
        slider.value = state.round;
        draw();
      });
      slider.addEventListener("input", () => {
        state.round = Number(slider.value);
        draw();
      });
      zoom.addEventListener("change", draw);
      metricButtons.forEach((button) =>
        button.addEventListener("click", () => {
          state.metric = button.dataset.metric;
          metricButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
          zoomLabel.hidden = state.metric !== "best";
          draw();
        })
      );
      draw();
      controls.hidden = legend.hidden = panel.querySelector(".round-control").hidden = false;
      if ("ResizeObserver" in window) {
        let previousWidth = stage.clientWidth;
        new ResizeObserver(() => {
          if (stage.clientWidth !== previousWidth) {
            previousWidth = stage.clientWidth;
            draw();
          }
        }).observe(stage);
      }
    })
    .catch(() => {
      // Keep the static figure and downloadable data usable if enhancement fails.
    });
})();
