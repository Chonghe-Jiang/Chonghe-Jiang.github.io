---
layout: research-post
title: "Autoresearch as Optimization"
description: "One self-evolution loop, different ways to use feedback."
topic: Scientific discovery · Agents · Optimization
date: 2026-10-15 00:00:00 -0400
permalink: /blog/2026/autoresearch-as-optimization/
research_blog: true
math: true
sections:
  - { id: search, title: Search over ideas }
  - { id: memory, title: Memory and restarts }
  - { id: feedback, title: The cost of feedback }
  - { id: learning, title: Learning the next experiment }
---

Most autoresearch systems share a self-evolution loop: select a starting point, generate a candidate, evaluate it, and use the result to shape the next attempt. The methods below change particular operations within that loop. The comparison is clearest when we keep the loop fixed and show what each method changes.

<figure class="ar-figure ar-map ar-evolution" id="ar-map" aria-labelledby="ar-map-title">
<div class="ar-figure-heading"><span class="note-label">One self-evolution loop</span><h3 id="ar-map-title">Same loop. Different update rules.</h3></div>
<div class="ar-map-controls" hidden role="group" aria-label="Locate a paper in the discovery loop">
<button type="button" aria-pressed="true" data-components="all" data-title="Shared loop" data-description="Candidates and feedback carry progress around the loop. Most methods change search state; MIRA-AC also trains the decision policy.">Overview</button>
<button type="button" aria-pressed="false" data-components="memory adapt" data-title="DeltaEvolve" data-description="Carry forward semantic changes and their outcomes to guide future edits." data-url="https://arxiv.org/abs/2602.02919">DeltaEvolve</button>
<button type="button" aria-pressed="false" data-components="parent adapt" data-title="Contrastive Concept-Tree Search" data-description="Use concepts associated with strong and weak programs to guide parent selection and edits." data-url="https://arxiv.org/abs/2602.03132">CCTS</button>
<button type="button" aria-pressed="false" data-components="propose select memory" data-title="Fork-and-Flush" data-description="Fork the workspace into fresh-context continuations, then continue the best branch." data-url="https://arxiv.org/abs/2610.07447">Fork-and-Flush</button>
<button type="button" aria-pressed="false" data-components="parent memory" data-title="Scaling Discovery Requires Forgetting" data-description="Restart the team from the best candidate after clearing sessions and the other candidate history." data-url="https://arxiv.org/abs/2610.20563">Forgetting</button>
<button type="button" aria-pressed="false" data-components="parent propose memory" data-title="Stateless Language Agents" data-description="The harness retains evidence and rebuilds each context; an Advisor assigns experiments to Workers." data-url="https://arxiv.org/abs/2610.07625">SLA</button>
<button type="button" aria-pressed="false" data-components="parent evaluate" data-title="DuoDiscover" data-description="Discover targets and cheap proxy evaluators together, and confirm gains with true evaluations." data-url="https://arxiv.org/abs/2610.17184">DuoDiscover</button>
<button type="button" aria-pressed="false" data-components="parent adapt" data-title="MIRA-AC" data-description="Learn research decisions from their downstream returns while keeping the executor fixed." data-url="https://arxiv.org/abs/2610.02525">MIRA-AC</button>
</div>
<div class="ar-evo-canvas">
<svg class="ar-evo-edges ar-evo-wide" viewBox="0 0 720 398" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="ar-arrow-wide" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="currentColor"/></marker></defs><g fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#ar-arrow-wide)"><path d="M224 81H246"/><path d="M472 81H494"/><path d="M608 162V234"/><path d="M496 317H474"/><path d="M248 317H226"/><path d="M112 236V164"/></g></svg>
<svg class="ar-evo-edges ar-evo-narrow" viewBox="0 0 340 622" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="ar-arrow-narrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="currentColor"/></marker></defs><g fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#ar-arrow-narrow)"><path d="M162 95H176"/><path d="M259 190V214"/><path d="M259 406V430"/><path d="M178 527H164"/><path d="M81 432V408"/><path d="M81 216V192"/></g></svg>
<ol class="ar-evo-nodes">
<li class="ar-evo-node ar-evo-parent" data-component="parent"><span class="ar-number">01</span><strong>Choose a starting point</strong><p class="ar-node-copy">Select a parent or research direction.</p><span class="ar-node-tag">CCTS · SLA · MIRA-AC</span></li>
<li class="ar-evo-node ar-evo-propose" data-component="propose"><span class="ar-number">02</span><strong>Generate a candidate</strong><p class="ar-node-copy">Revise code or execute an investigation.</p><span class="ar-node-tag">Fork-and-Flush · SLA</span></li>
<li class="ar-evo-node ar-evo-evaluate" data-component="evaluate"><span class="ar-number">03</span><strong>Evaluate</strong><p class="ar-node-copy">Measure quality and correctness.</p><span class="ar-node-tag">DuoDiscover</span></li>
<li class="ar-evo-node ar-evo-select" data-component="select"><span class="ar-number">04</span><strong>Select results</strong><p class="ar-node-copy">Retain candidates worth continuing.</p><span class="ar-node-tag">Fork-and-Flush</span></li>
<li class="ar-evo-node ar-evo-memory" data-component="memory"><span class="ar-number">05</span><strong>Update memory</strong><p class="ar-node-copy">Store artifacts, outcomes, and evidence.</p><span class="ar-node-tag">DeltaEvolve · Forgetting · SLA</span></li>
<li class="ar-evo-node ar-evo-adapt" data-component="adapt"><span class="ar-number">06</span><strong>Adapt the search</strong><p class="ar-node-copy">Use feedback to shape the next proposal.</p><span class="ar-node-tag">DeltaEvolve · CCTS · MIRA-AC</span></li>
</ol>
<div class="ar-evo-center">Repeat on the same task · keep the best verified candidate</div>
</div>
<div class="ar-map-detail" aria-live="polite" aria-atomic="true"><span class="ar-training-label">Search-state updates; policy training is optional</span><strong>Shared loop</strong><p>Candidates and feedback carry progress around the loop. Most methods change search state; MIRA-AC also trains the decision policy.</p><a hidden>Read the paper ↗</a></div>
<figcaption>Select a method to replace the highlighted nodes with its specific operations. This is a common abstraction of the methods, not their literal execution schedules.</figcaption>
</figure>

## Search over ideas {#search}

A [comment by tsuname](https://x.com/tsuname/status/2109876913544298678) connects autoresearch with momentum, cross-entropy search, and simulated annealing. The connection starts with a simple objective: find the best verified candidate within a budget.

<aside class="ar-equation" markdown="1">

$$
C_t=\mathcal M(H_t),\qquad x_{t+1}\sim p_\theta(\cdot\mid C_t),\qquad y_{t+1}=f(x_{t+1}).
$$

The system selects context $C_t$ from history $H_t$, generates candidate $x$, and evaluates it with $f$. **Changing context changes the search distribution, even with fixed model weights.**

</aside>

**[DeltaEvolve](https://arxiv.org/abs/2602.02919): carry useful changes forward.** It records semantic deltas describing how a program changed and whether the change helped. These deltas guide later edits. The momentum analogy concerns accumulated directions of improvement; the system does not compute numerical gradients through programs.

**[Contrastive Concept-Tree Search](https://arxiv.org/abs/2602.03132): learn where to sample.** It represents programs through a concept hierarchy, fits concept distributions to high- and low-performing programs, and guides parent selection with their likelihood ratio. A concept gains weight when it distinguishes strong programs from weak ones. The cross-entropy update changes concept-space sampling statistics, not LLM weights.

## Memory and restarts {#memory}

At the memory step, three methods make different choices about what survives:

**[Fork-and-Flush](https://arxiv.org/abs/2610.07447)** keeps the workspace, forks fresh-context continuations, and continues the best branch. Its ablations show that branching and context resets each help, with a larger gain from combining them.

**[Scaling Discovery Requires Forgetting](https://arxiv.org/abs/2610.20563)** clears more: agent sessions and the other candidate history. The team restarts from its best candidate and score. Experiments cover heuristic programming, kernel optimization, and model training.

**[Stateless Language Agents](https://arxiv.org/abs/2610.07625)** retains research state in the harness and rebuilds every invocation’s context. An Advisor sees evidence across directions and assigns experiments; Workers receive focused local context.

The distinction is between **stored evidence and visible context**. SLA keeps the record but controls who sees it; Forgetting removes most of the active search history. Neither requires carrying an entire conversation forward.

What survives must also preserve the meaning of a result. SLA distinguishes a measured non-improvement from an execution failure: code that never ran is not evidence that the underlying idea failed.

## The cost of feedback {#feedback}

**[DuoDiscover](https://arxiv.org/abs/2610.17184)** jointly discovers an optimization target and a cheap proxy evaluator, or _yardstick_. Workers iterate quickly against the proxy; full evaluations confirm gains and check whether its rankings remain reliable. A drifting yardstick is invalidated and rebuilt, or the worker changes target.

This increases the number of experiments the budget can support. It helps when a faithful proxy exists and the saved evaluation time outweighs its construction cost.

## Learning the next experiment {#learning}

**[MIRA-AC](https://arxiv.org/abs/2610.02525)** learns research decisions from their downstream returns. An outer policy selects investigations; a fixed executor carries them out. A shared generative critic estimates remaining return, allowing later gains to provide credit to earlier decisions. In a physics-discovery example, the policy requests a controlled parameter change that lets the executor distinguish two competing interaction laws.

**[IdeaScientist](https://arxiv.org/abs/2610.04074)** trains the proposal process instead: gap finding, innovation, and report writing each receive GRPO training with reference-grounded rewards, under a fixed orchestrator. Its output is a research proposal; MIRA-AC learns from executed investigations.

For test-time training, this leaves a concrete choice of target: reward the next candidate’s score, or credit decisions for the progress they enable over several experiments. The second requires preserving the links between decisions and later outcomes, even when agent contexts are reset.
