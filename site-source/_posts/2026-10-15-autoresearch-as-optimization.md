---
layout: research-post
title: "Revisiting Recent Trends in Self-Improving Agents for Autoresearch"
description: "LLM agents work on one problem, using evaluation feedback to search for the best solution within a fixed evaluation budget."
topic: Scientific discovery · Agents · Optimization
date: 2026-10-15 00:00:00 -0400
permalink: /blog/2026/revisiting-autoresearch/
research_blog: true
sections:
  - { id: methods, title: Methods }
  - { id: takeaways, title: Takeaways }
---

## Methods {#methods}

<figure class="ar-figure ar-map ar-evolution" id="ar-map" aria-label="Methods in the self-improvement loop">
<div class="ar-map-controls ar-grouped-controls" hidden role="group" aria-label="Papers grouped by contribution">
<button type="button" aria-pressed="true" data-components="all" data-title="Shared loop" data-description="Feedback updates the search state; marked methods also train model parameters." data-method="Overview">Overview</button>
<div class="ar-method-group" role="group" aria-labelledby="ar-group-state"><span class="ar-group-label" id="ar-group-state">Context management</span><div class="ar-group-papers">
<button type="button" aria-pressed="false" data-components="propose memory" data-title="Fork-and-Flush" data-description="Fork the workspace into fresh-context continuations, then continue the best branch." data-url="https://arxiv.org/abs/2610.07447" data-method="Fork-and-Flush">Fork-and-Flush</button>
<button type="button" aria-pressed="false" data-components="parent memory" data-title="Scaling Discovery Requires Forgetting" data-description="Restart the team from the best candidate after clearing sessions and the other candidate history." data-url="https://arxiv.org/abs/2610.20563" data-method="Forgetting">Forgetting</button>
<button type="button" aria-pressed="false" data-components="parent propose memory" data-title="Stateless Language Agents" data-description="The harness retains evidence and rebuilds each context; an Advisor assigns experiments to Workers." data-url="https://arxiv.org/abs/2610.07625" data-method="SLA">SLA</button>
</div></div>
<div class="ar-method-group" role="group" aria-labelledby="ar-group-decisions"><span class="ar-group-label" id="ar-group-decisions">Search decisions</span><div class="ar-group-papers">
<button type="button" aria-pressed="false" data-components="parent" data-title="Contrastive Concept-Tree Search" data-description="Use concepts associated with strong and weak programs to guide parent selection and edits." data-url="https://arxiv.org/abs/2602.03132" data-method="CCTS">CCTS</button>
<button type="button" aria-pressed="false" data-components="parent" data-title="MIRA-AC" data-description="Learn research decisions from their downstream returns while keeping the executor fixed." data-url="https://arxiv.org/abs/2610.02525" data-training-label="Trained decision policy · fixed executor" data-method="MIRA-AC">MIRA-AC <span class="ar-training-dot" role="img" aria-label="Updates model parameters" title="Updates model parameters"></span></button>
<button type="button" aria-pressed="false" data-components="parent propose evaluate" data-title="IdeaScientist" data-description="GRPO trains gap finding, innovation and report writing; a fixed orchestrator coordinates research proposal generation." data-url="https://arxiv.org/abs/2610.04074" data-training-label="Trained ideation roles · fixed orchestrator" data-method="IdeaScientist">IdeaScientist <span class="ar-training-dot" role="img" aria-label="Updates model parameters" title="Updates model parameters"></span></button>
<button type="button" aria-pressed="false" data-components="parent propose" data-method="Guidance-TTT" data-title="Evolving in Thought Space" data-description="Train strategic guidance at test time; a frozen executor implements it." data-training-label="Test-time training · frozen executor" data-url="https://arxiv.org/abs/2610.06269">Evolving in Thought Space <span class="ar-training-dot" role="img" aria-label="Updates model parameters" title="Updates model parameters"></span></button>
</div></div>
<div class="ar-method-group" role="group" aria-labelledby="ar-group-evaluation"><span class="ar-group-label" id="ar-group-evaluation">Candidate evaluation</span><div class="ar-group-papers">
<button type="button" aria-pressed="false" data-components="parent evaluate" data-title="DuoDiscover" data-description="Discover targets and cheap proxy evaluators together, and confirm gains with true evaluations." data-url="https://arxiv.org/abs/2610.17184" data-method="DuoDiscover">DuoDiscover</button>
</div></div>
</div>
<div class="ar-evo-canvas">
<svg class="ar-evo-edges ar-evo-wide" viewBox="0 0 720 322" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="ar-arrow-wide" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="currentColor"/></marker></defs><g fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#ar-arrow-wide)"><path d="M336 72H382"/><path d="M552 144V176"/><path d="M384 250H338"/><path d="M168 178V146"/></g></svg>
<svg class="ar-evo-edges ar-evo-narrow" viewBox="0 0 340 406" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="ar-arrow-narrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="currentColor"/></marker></defs><g fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#ar-arrow-narrow)"><path d="M162 95H176"/><path d="M259 190V214"/><path d="M178 311H164"/><path d="M81 216V192"/></g></svg>
<ol class="ar-evo-nodes">
<li class="ar-evo-node ar-evo-parent" data-component="parent"><span class="ar-number">01</span><strong>Select &amp; adapt</strong><p class="ar-node-copy">Choose a parent and use feedback to steer the next attempt.</p></li>
<li class="ar-evo-node ar-evo-propose" data-component="propose"><span class="ar-number">02</span><strong>Generate</strong><p class="ar-node-copy">Revise a candidate or carry out an investigation.</p></li>
<li class="ar-evo-node ar-evo-evaluate" data-component="evaluate"><span class="ar-number">03</span><strong>Evaluate</strong><p class="ar-node-copy">Measure quality and correctness.</p></li>
<li class="ar-evo-node ar-evo-memory" data-component="memory"><span class="ar-number">04</span><strong>Select &amp; remember</strong><p class="ar-node-copy">Retain useful candidates and evidence for the next round.</p></li>
</ol>
</div>
<div class="ar-map-detail" hidden aria-live="polite" aria-atomic="true"><span class="ar-training-label">Search-state updates; policy training is optional</span><strong>Shared loop</strong><p>Feedback updates the search state; marked methods also train model parameters.</p><a hidden>Read the paper ↗</a></div>
<figcaption>Select a paper to see its changes. <span class="ar-training-key"><span class="ar-training-dot" aria-hidden="true"></span> Updates model parameters</span></figcaption>
</figure>

## Takeaways {#takeaways}

These papers highlight two ways to improve research agents: refresh their context, or train the roles that decide what to investigate next.

<figure class="ar-takeaway" id="ar-takeaways" aria-label="Two perspectives on research agents">
<div class="ar-takeaway-modes" hidden role="tablist" aria-label="Training approach">
<button type="button" id="ar-mode-context" role="tab" aria-selected="true" aria-controls="ar-context-takeaway" tabindex="0">Training-free</button>
<button type="button" id="ar-mode-learning" role="tab" aria-selected="false" aria-controls="ar-learning-takeaway" tabindex="-1">With training</button>
</div>
<div class="ar-takeaway-panel" id="ar-context-takeaway">
<header class="ar-takeaway-heading"><h3 id="ar-context-title">Refresh context</h3><p>Carry useful results forward while giving the next attempt a fresh context.</p></header>
<div class="ar-takeaway-switch" hidden role="group" aria-label="Compare context management methods">
<button type="button" data-variant="fork" aria-pressed="true">Fork-and-Flush</button>
<button type="button" data-variant="forget" aria-pressed="false">Forgetting</button>
<button type="button" data-variant="sla" aria-pressed="false">SLA</button>
</div>
<div class="ar-takeaway-diagram" aria-live="polite" aria-atomic="true">
<div class="ar-takeaway-flow">
<div class="ar-takeaway-node"><span class="ar-takeaway-role">Retain</span><strong data-field="first">Accumulated workspace</strong><p data-field="firstCopy">Artifacts from the search so far.</p></div>
<span class="ar-takeaway-arrow" aria-hidden="true">→</span>
<div class="ar-takeaway-node ar-takeaway-focus"><span class="ar-takeaway-role">Rebuild</span><strong data-field="second">Fresh contexts</strong><p data-field="secondCopy">Each branch starts a new conversation.</p><span class="ar-reset-note" data-field="reset">Reset chat history</span></div>
<span class="ar-takeaway-arrow" aria-hidden="true">→</span>
<div class="ar-takeaway-node"><span class="ar-takeaway-role">Explore</span><strong data-field="third">Parallel attempts</strong><p data-field="thirdCopy">Run each branch for a fixed horizon.</p></div>
</div>
<div class="ar-takeaway-return"><span data-field="feedback">Continue from the best branch</span></div>
</div>
<p class="ar-takeaway-caption"><span data-field="note">The workspace survives the reset; the winning branch supplies the next starting point.</span> <a data-source href="https://arxiv.org/abs/2610.07447">Read the paper ↗</a></p>
</div>

<div class="ar-takeaway-panel" id="ar-learning-takeaway">
<header class="ar-takeaway-heading"><h3 id="ar-learning-title">Train the research decisions.</h3><p>Give high-level decisions a dedicated learning role, with feedback on the work they produce.</p></header>
<div class="ar-takeaway-switch" hidden role="group" aria-label="Compare trainable research roles">
<button type="button" data-variant="mira" aria-pressed="false">MIRA-AC</button>
<button type="button" data-variant="idea" aria-pressed="false">IdeaScientist</button>
<button type="button" data-variant="guidance" aria-pressed="true">Evolving in Thought Space</button>
</div>
<div class="ar-takeaway-diagram" aria-live="polite" aria-atomic="true">
<div class="ar-takeaway-flow">
<div class="ar-takeaway-node ar-takeaway-focus"><span class="ar-takeaway-role">Learn</span><strong data-field="first">Guidance model θ</strong><p data-field="firstCopy">Propose strategic edits to a parent solution.</p></div>
<span class="ar-takeaway-arrow" aria-hidden="true">→</span>
<div class="ar-takeaway-node"><span class="ar-takeaway-role" data-field="middleRole">Execute</span><strong data-field="second">Frozen executor</strong><p data-field="secondCopy">Implement the edits as a complete program.</p></div>
<span class="ar-takeaway-arrow" aria-hidden="true">→</span>
<div class="ar-takeaway-node"><span class="ar-takeaway-role">Assess</span><strong data-field="third">Task verifier</strong><p data-field="thirdCopy">Run the program and measure its quality.</p></div>
</div>
<div class="ar-takeaway-return"><span data-field="feedback">Verifier reward updates guidance θ</span></div>
</div>
<p class="ar-takeaway-caption"><span data-field="note">Learning happens on the current task. Only the guidance model changes; the executor stays frozen.</span> <a data-source href="https://arxiv.org/abs/2610.06269">Read the paper ↗</a></p>
</div>

</figure>

Working on self-improving agents, I’m always interested in the models people choose and the tasks they test them on. Some familiar tasks, such as Erdős problems and packing benchmarks, already seem close to saturation. I’ve collected the models and tasks from these papers below as a reference for planning new experiments.

- [Models]({{ '/blog/2026/revisiting-autoresearch/models/' | relative_url }}) — model choices, agent setups and evaluation budgets.
- [Tasks]({{ '/blog/2026/revisiting-autoresearch/tasks/' | relative_url }}) — benchmarks, evaluation time and recent progress.
