---
layout: research-post
title: "Autoresearch as Optimization"
description: "How search, memory, and feedback shape what language-model agents discover."
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

Autoresearch systems repeatedly propose, test, and revise candidates. Recent work improves this loop through search strategies, selective memory, and cheaper feedback. These choices determine whether more compute produces new discoveries or more variations of the same idea.

<figure class="ar-figure ar-map" id="ar-map" aria-labelledby="ar-map-title">
<div class="ar-figure-heading"><span class="note-label">A map of the discovery loop</span><h3 id="ar-map-title">What changes the next experiment?</h3></div>
<ol class="ar-loop">
<li data-component="propose"><span class="ar-number">01</span><strong>Propose</strong><small>Choose a direction.<br>Write a candidate.</small></li>
<li data-component="test"><span class="ar-number">02</span><strong>Test</strong><small>Run an experiment.<br>Measure the outcome.</small></li>
<li data-component="select"><span class="ar-number">03</span><strong>Select</strong><small>Keep candidates.<br>Allocate more effort.</small></li>
<li data-component="remember"><span class="ar-number">04</span><strong>Remember</strong><small>Store evidence.<br>Build the next context.</small></li>
</ol>
<div class="ar-return">↶ Evidence and selected artifacts shape the next proposal</div>
<div class="ar-map-controls" hidden role="group" aria-label="Locate a paper in the discovery loop">
<button type="button" aria-pressed="true" data-components="all" data-title="The whole loop" data-description="The model proposes experiments; the surrounding system controls evidence, selection, and budget.">Overview</button>
<button type="button" aria-pressed="false" data-components="propose remember" data-title="DeltaEvolve" data-description="Carry forward semantic changes and their outcomes to guide future edits." data-url="https://arxiv.org/abs/2602.02919">DeltaEvolve</button>
<button type="button" aria-pressed="false" data-components="propose select" data-title="Contrastive Concept-Tree Search" data-description="Use concepts associated with strong and weak programs to guide parent selection and edits." data-url="https://arxiv.org/abs/2602.03132">CCTS</button>
<button type="button" aria-pressed="false" data-components="select remember" data-title="Fork-and-Flush" data-description="Fork the workspace into fresh-context continuations, then continue the best branch." data-url="https://arxiv.org/abs/2610.07447">Fork-and-Flush</button>
<button type="button" aria-pressed="false" data-components="select remember" data-title="Scaling Discovery Requires Forgetting" data-description="Restart the team from the best candidate after clearing sessions and the other candidate history." data-url="https://arxiv.org/abs/2610.20563">Forgetting</button>
<button type="button" aria-pressed="false" data-components="propose remember" data-title="Stateless Language Agents" data-description="The harness retains evidence and rebuilds each context; an Advisor assigns experiments to Workers." data-url="https://arxiv.org/abs/2610.07625">SLA</button>
<button type="button" aria-pressed="false" data-components="propose test select" data-title="DuoDiscover" data-description="Discover targets and cheap proxy evaluators together, and confirm gains with true evaluations." data-url="https://arxiv.org/abs/2610.17184">DuoDiscover</button>
<button type="button" aria-pressed="false" data-components="propose select" data-title="MIRA-AC" data-description="Learn research decisions from their downstream returns while keeping the executor fixed." data-url="https://arxiv.org/abs/2610.02525">MIRA-AC</button>
</div>
<div class="ar-map-detail" aria-live="polite" aria-atomic="true"><strong>The whole loop</strong><p>The model proposes experiments; the surrounding system controls evidence, selection, and budget.</p><a hidden>Read the paper ↗</a></div>
<figcaption>Select a paper to highlight the parts of the loop it changes.</figcaption>
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

Both methods reuse evidence to guide proposals. A complementary choice is when to reopen exploration: branching and restarting can expose directions that continued local refinement misses.

## Memory and restarts {#memory}

Three recent papers differ in what they preserve across attempts:

**[Fork-and-Flush](https://arxiv.org/abs/2610.07447)** keeps the workspace, forks fresh-context continuations, and continues the best branch. Its ablations show that branching and context resets each help, with a larger gain from combining them.

**[Scaling Discovery Requires Forgetting](https://arxiv.org/abs/2610.20563)** clears more: agent sessions and the other candidate history. The team restarts from its best candidate and score. Experiments cover heuristic programming, kernel optimization, and model training.

**[Stateless Language Agents](https://arxiv.org/abs/2610.07625)** retains research state in the harness and rebuilds every invocation’s context. An Advisor sees evidence across directions and assigns experiments; Workers receive focused local context.

<figure class="ar-figure" id="ar-memory" aria-labelledby="ar-memory-title">
<div class="ar-figure-heading"><span class="note-label">Three ways to start fresh</span><h3 id="ar-memory-title">What crosses the next boundary?</h3></div>
<div class="ar-memory-key"><span><i class="ar-dot ar-keep"></i>Retained</span><span><i class="ar-dot ar-reset"></i>Reset</span><span><i class="ar-dot ar-curate"></i>Selected for context</span></div>
<div class="ar-memory-grid">
<section class="ar-memory-card"><span class="ar-card-label">Periodic branching</span><h4>Fork-and-Flush</h4><div class="ar-state ar-keep">Accumulated workspace</div><div class="ar-state ar-reset">Chat context</div><div class="ar-fan" aria-hidden="true"><span>↙</span><span>↓</span><span>↘</span></div><div class="ar-branches"><span>Try</span><span>Try</span><span>Try</span></div><p>Explore several continuations.<br><strong>Continue the best branch.</strong></p></section>
<section class="ar-memory-card"><span class="ar-card-label">Periodic team reset</span><h4>Forgetting</h4><div class="ar-state ar-keep">Best candidate + score</div><div class="ar-state ar-reset">Sessions + other candidates</div><div class="ar-fan" aria-hidden="true"><span>↙</span><span>↓</span><span>↘</span></div><div class="ar-branches"><span>Fresh</span><span>Fresh</span><span>Fresh</span></div><p>Reseed the communicating team.<br><strong>Reopen search from the best.</strong></p></section>
<section class="ar-memory-card"><span class="ar-card-label">Every invocation</span><h4>Stateless agents</h4><div class="ar-state ar-keep">Harness research record</div><div class="ar-state ar-curate">Role-specific context</div><div class="ar-role-flow"><span>Advisor</span><span aria-hidden="true">↓</span><span>Workers</span></div><p>Rebuild context from evidence.<br><strong>Assign distinct experiments.</strong></p></section>
</div>
<figcaption>Schematic: what each method retains and resets.</figcaption>
</figure>

The distinction is between **stored evidence and visible context**. SLA keeps the record but controls who sees it; Forgetting removes most of the active search history. Neither requires carrying an entire conversation forward.

What survives must also preserve the meaning of a result. SLA distinguishes a measured non-improvement from an execution failure: code that never ran is not evidence that the underlying idea failed.

## The cost of feedback {#feedback}

**[DuoDiscover](https://arxiv.org/abs/2610.17184)** jointly discovers an optimization target and a cheap proxy evaluator, or _yardstick_. Workers iterate quickly against the proxy; full evaluations confirm gains and check whether its rankings remain reliable. A drifting yardstick is invalidated and rebuilt, or the worker changes target.

This increases the number of experiments the budget can support. It helps when a faithful proxy exists and the saved evaluation time outweighs its construction cost.

<figure class="ar-figure ar-duo" id="ar-duo" aria-labelledby="ar-duo-title">
<div class="ar-figure-heading"><span class="note-label">Two feedback timescales</span><h3 id="ar-duo-title">Explore cheaply. Confirm with the full test.</h3></div>
<div class="ar-duo-grid">
<section class="ar-fast"><span class="ar-card-label">Fast loop · frequent</span><div class="ar-mini-flow"><span>Choose target<br>+ yardstick</span><b aria-hidden="true">→</b><span>Edit<br>candidate</span><b aria-hidden="true">→</b><span>Proxy<br>evaluation</span></div><div class="ar-return">↶ Refine promising edits</div></section>
<div class="ar-bridge">Promising candidate ↓ <span>↑ Calibration feedback</span></div>
<section class="ar-slow"><span class="ar-card-label">Slow loop · selective</span><div class="ar-mini-flow"><span>True<br>evaluation</span><b aria-hidden="true">→</b><span>Confirm<br>gain</span><b aria-hidden="true">+</b><span>Recheck<br>yardstick</span></div></section>
</div>
<div class="ar-scenarios" hidden role="group" aria-label="Explore outcomes of true evaluation"><button type="button" data-outcome="confirmed" aria-pressed="true">Gain confirmed</button><button type="button" data-outcome="unconfirmed" aria-pressed="false">Proxy-only gain</button><button type="button" data-outcome="drift" aria-pressed="false">Yardstick drifts</button></div>
<div class="ar-duo-result" aria-live="polite" aria-atomic="true"><strong>Gain confirmed</strong><p>Accept the verified improvement. Recheck the yardstick with the new evidence.</p></div>
<figcaption>DuoDiscover’s feedback loop. Select an outcome to follow the decision.</figcaption>
</figure>

## Learning the next experiment {#learning}

**[MIRA-AC](https://arxiv.org/abs/2610.02525)** learns research decisions from their downstream returns. An outer policy selects investigations; a fixed executor carries them out. A shared generative critic estimates remaining return, allowing later gains to provide credit to earlier decisions. In a physics-discovery example, the policy requests a controlled parameter change that lets the executor distinguish two competing interaction laws.

**[IdeaScientist](https://arxiv.org/abs/2610.04074)** trains the proposal process instead: gap finding, innovation, and report writing each receive GRPO training with reference-grounded rewards, under a fixed orchestrator. Its output is a research proposal; MIRA-AC learns from executed investigations.

For test-time training, this leaves a concrete choice of target: reward the next candidate’s score, or credit decisions for the progress they enable over several experiments. The second requires preserving the links between decisions and later outcomes, even when agent contexts are reset.
