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
  - { id: memory, title: What should survive? }
  - { id: feedback, title: The cost of feedback }
  - { id: learning, title: Learning the next experiment }
  - { id: questions, title: Where to go next }
---

An agent edits a program, runs an experiment, and gets a better score. It repeats the process. Early progress comes quickly; later, the edits become smaller and the score barely moves. The agent is still working. What would make the next hour useful?

This question connects several recent papers on LLMs for scientific discovery. Some redesign the search over candidate solutions. Others change what agents remember, how they divide work, or how they measure progress. I find it useful to read them together: each changes how a research system spends its next unit of effort.

The examples here involve computational discovery, where programs, models, and algorithms can be tested repeatedly. They make a broader question concrete: how can a system accumulate useful evidence without becoming trapped by the path that produced it?

<figure class="ar-figure ar-map" id="ar-map" aria-labelledby="ar-map-title">
<div class="ar-figure-heading"><span class="note-label">A map of the discovery loop</span><h3 id="ar-map-title">What changes the next experiment?</h3><p>Select a paper to locate its main intervention.</p></div>
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
<figcaption>Conceptual map of selected contributions. Stages overlap; the highlighted components are not an exhaustive description of each system.</figcaption>
</figure>

## Search over ideas {#search}

A [comment by tsuname](https://x.com/tsuname/status/2109876913544298678) compares autoresearch methods with familiar optimization ideas: momentum, cross-entropy search, simulated annealing. It is a useful starting point. Once a model can propose meaningful edits, the remaining choices look like questions an optimizer must answer: where to sample, which results to retain, and when to leave a promising neighborhood.

For a fixed task, I would describe the loop with the following bookkeeping:

<aside class="ar-equation" markdown="1">

$$
C_t=\mathcal M(H_t),\qquad x_{t+1}\sim p_\theta(\cdot\mid C_t),\qquad y_{t+1}=f(x_{t+1}).
$$

$H_t$ is the research record; $\mathcal M$ chooses what enters the context $C_t$; the model proposes candidate $x$; the evaluator returns $y$. With budget $B$, the search aims for a strong **best verified candidate**:

$$
\mathbb E\!\left[\max_{t:\,\text{cost}(1{:}t)\leq B} f(x_t)\right].
$$

</aside>

This view separates improving a candidate from changing how candidates are proposed. Even with frozen model weights, the system can adapt its search through parent selection, context, and experiment allocation. The equations describe that interface; they do not assume an analytic gradient through a running program.

Consider a packing solver. Changing a tie-breaking rule and replacing the entire placement strategy can both be short code edits. Their distance in lines of code says little about their distance as ideas. That makes the representation of search experience especially important.

Two earlier papers give useful ways to think about it. **[DeltaEvolve](https://arxiv.org/abs/2602.02919)** represents program history through semantic deltas: descriptions of what changed and whether it helped. Future proposals receive these changes as inspiration. Its momentum analogy is about carrying useful directions forward. It does not imply that natural-language edits are numerical gradients. A compact account of an improvement can be more useful than another full snapshot of the program.

**[Contrastive Concept-Tree Search](https://arxiv.org/abs/2602.03132)** instead organizes programs through a hierarchy of concepts. It fits distributions to concepts in high- and low-performing programs using cross-entropy updates, then uses their likelihood ratio to guide parent selection. The comparison is informative: a concept common in good programs may also be common everywhere. Contrasting good and bad outcomes helps identify which concepts distinguish them. The learned sampling statistics live in concept space; this is not an LLM weight update.

There is also a distinction between accepting a temporary regression and preserving the best result. An annealing-style search can move through weaker candidates while keeping a separate incumbent. Likewise, a research system can give an unfinished direction time to mature without replacing its best verified artifact. The optimization analogy is most useful when it exposes these choices explicitly.

## What should survive? {#memory}

The search record has two jobs that can conflict. It preserves discoveries, but it also conditions the next proposal. A long account of failed approaches may prevent repetition. It may also convince the agent that a broader direction has been exhausted when only one implementation failed.

This is where optimization and agent architecture meet. In the notation above, changing $\mathcal M$ changes the proposal distribution even if $\theta$ stays fixed. Memory policy affects where the search goes.

**[Fork-and-Flush](https://arxiv.org/abs/2610.07447)** studies runs that remain in localized regions of idea space. It periodically copies the accumulated workspace into parallel continuations with fresh chat contexts, gives each time to explore, and continues the best branch. Forking provides alternatives; flushing changes the history conditioning each alternative. Its ablations find gains from each operation and a larger gain from their combination. The paper also visualizes a polyomino trajectory that moves beyond the region occupied by local refinements.

**[Scaling Discovery Requires Forgetting](https://arxiv.org/abs/2610.20563)** makes a stronger reset. At round boundaries, the communicating team retains the best candidate and its score, discards agent sessions and the other candidate history, and starts again. The experiments span heuristic programming, kernel optimization, and model training. The useful distinction is what crosses the boundary: the successful artifact survives, while the path used to find it is removed from the active search state.

**[Stateless Language Agents](https://arxiv.org/abs/2610.07625)** makes context reconstruction routine. The harness retains candidates and measured outcomes; every Advisor and Worker invocation starts fresh. The Advisor receives evidence across directions and assigns experiments. Workers receive their assignment, local candidate, and focused feedback. State persists outside the conversations. The harness also distinguishes an evaluated non-improvement from an inconclusive execution failure, so the Advisor can reason about what was actually tested.

<figure class="ar-figure" id="ar-memory" aria-labelledby="ar-memory-title">
<div class="ar-figure-heading"><span class="note-label">Three ways to start fresh</span><h3 id="ar-memory-title">What crosses the next boundary?</h3></div>
<div class="ar-memory-key"><span><i class="ar-dot ar-keep"></i>Retained</span><span><i class="ar-dot ar-reset"></i>Reset</span><span><i class="ar-dot ar-curate"></i>Selected for context</span></div>
<div class="ar-memory-grid">
<section class="ar-memory-card"><span class="ar-card-label">Periodic branching</span><h4>Fork-and-Flush</h4><div class="ar-state ar-keep">Accumulated workspace</div><div class="ar-state ar-reset">Chat context</div><div class="ar-fan" aria-hidden="true"><span>↙</span><span>↓</span><span>↘</span></div><div class="ar-branches"><span>Try</span><span>Try</span><span>Try</span></div><p>Explore several continuations.<br><strong>Continue the best branch.</strong></p></section>
<section class="ar-memory-card"><span class="ar-card-label">Periodic team reset</span><h4>Forgetting</h4><div class="ar-state ar-keep">Best candidate + score</div><div class="ar-state ar-reset">Sessions + other candidates</div><div class="ar-fan" aria-hidden="true"><span>↙</span><span>↓</span><span>↘</span></div><div class="ar-branches"><span>Fresh</span><span>Fresh</span><span>Fresh</span></div><p>Reseed the communicating team.<br><strong>Reopen search from the best.</strong></p></section>
<section class="ar-memory-card"><span class="ar-card-label">Every invocation</span><h4>Stateless agents</h4><div class="ar-state ar-keep">Harness research record</div><div class="ar-state ar-curate">Role-specific context</div><div class="ar-role-flow"><span>Advisor</span><span aria-hidden="true">↓</span><span>Workers</span></div><p>Rebuild context from evidence.<br><strong>Assign distinct experiments.</strong></p></section>
</div>
<figcaption>Conceptual comparison of <a href="https://arxiv.org/abs/2610.07447">Fork-and-Flush</a>, <a href="https://arxiv.org/abs/2610.20563">Forgetting</a>, and <a href="https://arxiv.org/abs/2610.07625">SLA</a>. Branch symbols illustrate the mechanism, not a shared experimental agent count.</figcaption>
</figure>

These designs suggest a practical separation between the artifact, evidence about it, and the conversation that produced it. Each can have a different lifetime. Keeping the artifact preserves progress. Keeping testable evidence can prevent repeated mistakes. Keeping every interpretation may preserve assumptions that deserve another look.

The hard case is a failed experiment. “This idea does not work” and “this implementation never ran correctly” are different observations. If both become a negative entry in memory, future search may avoid an unexplored direction. If both disappear, the next agent may waste its budget repeating the same error. I would want a memory policy to preserve the reason a conclusion is justified, while allowing the conclusion itself to be reconsidered.

## The cost of feedback {#feedback}

More promising candidates help only if we can evaluate enough of them. A search with an hour-long test has a very different budget from one with a one-second test. The cost of feedback determines how many sequential decisions can fit into the run.

**[DuoDiscover](https://arxiv.org/abs/2610.17184)** co-discovers optimization targets and cheap proxy evaluators, called _yardsticks_. Workers iterate against these proxies, while true evaluations confirm gains and recheck proxy fidelity. An orchestrator coordinates the workers. A yardstick must rank candidates usefully; its score need not match the true score. This saves time only when a faithful proxy exists and its construction cost is worthwhile.

<figure class="ar-figure ar-duo" id="ar-duo" aria-labelledby="ar-duo-title">
<div class="ar-figure-heading"><span class="note-label">Two feedback timescales</span><h3 id="ar-duo-title">Explore cheaply. Confirm with the full test.</h3></div>
<div class="ar-duo-grid">
<section class="ar-fast"><span class="ar-card-label">Fast loop · frequent</span><div class="ar-mini-flow"><span>Choose target<br>+ yardstick</span><b aria-hidden="true">→</b><span>Edit<br>candidate</span><b aria-hidden="true">→</b><span>Proxy<br>evaluation</span></div><div class="ar-return">↶ Refine promising edits</div></section>
<div class="ar-bridge">Promising candidate ↓ <span>↑ Calibration feedback</span></div>
<section class="ar-slow"><span class="ar-card-label">Slow loop · selective</span><div class="ar-mini-flow"><span>True<br>evaluation</span><b aria-hidden="true">→</b><span>Confirm<br>gain</span><b aria-hidden="true">+</b><span>Recheck<br>yardstick</span></div></section>
</div>
<div class="ar-scenarios" hidden role="group" aria-label="Explore outcomes of true evaluation"><button type="button" data-outcome="confirmed" aria-pressed="true">Gain confirmed</button><button type="button" data-outcome="unconfirmed" aria-pressed="false">Proxy-only gain</button><button type="button" data-outcome="drift" aria-pressed="false">Yardstick drifts</button></div>
<div class="ar-duo-result" aria-live="polite" aria-atomic="true"><strong>Gain confirmed</strong><p>Accept the verified improvement. Recheck the yardstick with the new evidence.</p></div>
<figcaption>Conceptual illustration of <a href="https://arxiv.org/abs/2610.17184">DuoDiscover</a>; no experimental scores are plotted.</figcaption>
</figure>

This changes how I would compare research systems. Candidate count alone hides the quality and cost of feedback. Parallel workers may reduce elapsed time, while a cheaper evaluator may also permit more rounds of dependent experimentation. These are different ways of spending compute. A useful comparison needs to show what the budget buys: proposals, verified experiments, or opportunities to act on new evidence.

## Learning the next experiment {#learning}

The systems above expose decisions that could themselves be learned: which direction to pursue, what evidence to retrieve, and when to stop. The training target matters. An experiment that fails to improve the incumbent can still make a later breakthrough possible.

**[MIRA](https://arxiv.org/abs/2610.02525)** separates an outer research decision from the executor carrying it out. MIRA-AC trains a shared generative actor–critic at those decision boundaries. The critic forecasts remaining return; policy learning targets the research decision response, while execution remains fixed. Under its proxy feedback, reward is an increase in best-so-far quality, so later gains can be credited across a sequence of investigations.

A concrete example is its physics discovery task. The outer policy asks for an experiment that independently varies a particle parameter, allowing the executor to distinguish competing interaction laws. The decision is useful because it asks a discriminating question. That is a more specific learning target than simply generating another plausible modification.

**[IdeaScientist](https://arxiv.org/abs/2610.04074)** trains a different part of research. It separately trains gap-finding, innovation, and report-writing roles with GRPO, using reference-grounded rewards, and then combines them under a fixed orchestrator. Its main output is a research proposal. It asks how to produce better ideas before execution; MIRA-AC asks how to choose investigations as experimental evidence accumulates. Both are relevant, but proposal quality and experimental progress require different evidence.

For test-time training, I am especially interested in the gap between immediate score and future usefulness. A policy can become good at producing valid candidates and still rarely change the best result. Learning which experiments create opportunities for later progress seems closer to the behavior we want from a research agent.

## Where to go next {#questions}

I would judge a discovery system by what happens after its first plateau. Does it keep producing variants of the same idea? Can it tell whether a direction failed or merely lacked a working implementation? Does a restart recover exploration, or just repeat the opening moves?

A useful next experiment would begin from the same checkpoint and spend the same remaining budget under different memory policies. Compare the best verified result, but also inspect the sequence of decisions: which hypotheses changed, which experiments ruled something out, and which findings survived the reset. Code-edit size alone cannot establish that the agent explored a new idea.

There is a similar experiment to run on feedback. Keep the proposal mechanism fixed and vary how the system purchases evidence: full evaluations, cheap proxies with calibration, or targeted tests that distinguish competing explanations. The most valuable test may be the one that changes the next decision, even when its immediate score is unimpressive.

The question I want to carry forward is simple: **what should a research system learn from an unsuccessful experiment, and what should it be willing to forget?**
