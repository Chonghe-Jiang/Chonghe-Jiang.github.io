---
layout: research-post
title: "Revisiting Autoresearch for Scientific Discovery"
description: "How research agents manage context, choose experiments, and evaluate progress."
topic: Scientific discovery · Agents · Optimization
date: 2026-10-15 00:00:00 -0400
permalink: /blog/2026/autoresearch-as-optimization/
research_blog: true
sections:
  - { id: methods, title: Methods }
  - { id: experiments, title: Models }
  - { id: tasks, title: Tasks }
---

## Methods {#methods}

<figure class="ar-figure ar-map ar-evolution" id="ar-map" aria-labelledby="ar-map-title">
<div class="ar-figure-heading"><h3 id="ar-map-title">Same loop. Different update rules.</h3></div>
<div class="ar-map-controls ar-grouped-controls" hidden role="group" aria-label="Papers grouped by contribution">
<button type="button" aria-pressed="true" data-components="all" data-title="Shared loop" data-description="Candidates and feedback carry progress around the loop. Most methods change search state; MIRA-AC also trains the decision policy.">Overview</button>
<div class="ar-method-group" role="group" aria-labelledby="ar-group-state"><span class="ar-group-label" id="ar-group-state">State &amp; context</span><div class="ar-group-papers">
<button type="button" aria-pressed="false" data-components="propose memory" data-title="Fork-and-Flush" data-description="Fork the workspace into fresh-context continuations, then continue the best branch." data-url="https://arxiv.org/abs/2610.07447">Fork-and-Flush</button>
<button type="button" aria-pressed="false" data-components="parent memory" data-title="Scaling Discovery Requires Forgetting" data-description="Restart the team from the best candidate after clearing sessions and the other candidate history." data-url="https://arxiv.org/abs/2610.20563">Forgetting</button>
<button type="button" aria-pressed="false" data-components="parent propose memory" data-title="Stateless Language Agents" data-description="The harness retains evidence and rebuilds each context; an Advisor assigns experiments to Workers." data-url="https://arxiv.org/abs/2610.07625">SLA</button>
</div></div>
<div class="ar-method-group" role="group" aria-labelledby="ar-group-decisions"><span class="ar-group-label" id="ar-group-decisions">Search decisions</span><div class="ar-group-papers">
<button type="button" aria-pressed="false" data-components="parent" data-title="Contrastive Concept-Tree Search" data-description="Use concepts associated with strong and weak programs to guide parent selection and edits." data-url="https://arxiv.org/abs/2602.03132">CCTS</button>
<button type="button" aria-pressed="false" data-components="parent" data-title="MIRA-AC" data-description="Learn research decisions from their downstream returns while keeping the executor fixed." data-url="https://arxiv.org/abs/2610.02525">MIRA-AC</button>
<button type="button" aria-pressed="false" data-components="parent propose evaluate" data-title="IdeaScientist" data-description="GRPO trains gap finding, innovation and report writing; a fixed orchestrator coordinates research proposal generation." data-url="https://arxiv.org/abs/2610.04074">IdeaScientist</button>
</div></div>
<div class="ar-method-group" role="group" aria-labelledby="ar-group-evaluation"><span class="ar-group-label" id="ar-group-evaluation">Evaluation</span><div class="ar-group-papers">
<button type="button" aria-pressed="false" data-components="parent evaluate" data-title="DuoDiscover" data-description="Discover targets and cheap proxy evaluators together, and confirm gains with true evaluations." data-url="https://arxiv.org/abs/2610.17184">DuoDiscover</button>
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
<div class="ar-map-detail" hidden aria-live="polite" aria-atomic="true"><span class="ar-training-label">Search-state updates; policy training is optional</span><strong>Shared loop</strong><p>Candidates and feedback carry progress around the loop. Most methods change search state; MIRA-AC also trains the decision policy.</p><a hidden>Read the paper ↗</a></div>
<figcaption>Select a paper to see how it changes the loop.</figcaption>
</figure>

## Models {#experiments}

<div class="ar-study-table-wrap ar-model-table" role="region" aria-label="Models and agents by paper" tabindex="0" markdown="1">

| Paper                                                      | Models                                                                      | Agent setup                                                                         |
| :--------------------------------------------------------- | :-------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| [Fork-and-Flush](https://arxiv.org/html/2610.07447#S5.SS1) | GPT-5.6-terra (high); GPT-5.5 (extra-high) for VLIW and tinyCIFAR.          | Copilot CLI; four branches per fork.                                                |
| [Forgetting](https://arxiv.org/pdf/2610.20563#page=5)      | DeepSeek V4.1 Flash.                                                        | Pi; four communicating agents with periodic resets.                                 |
| [SLA](https://arxiv.org/html/2610.07625#S4.SS1)            | GPT-5.5 or Opus 4.8.                                                        | Codex or Claude Code; stateless Advisor and Workers.                                |
| [CCTS](https://arxiv.org/html/2602.03132v1#S5)             | Gemini 2.0 Flash.                                                           | Program generation and concept extraction; statistical parent selection.            |
| [MIRA / MIRA-AC](https://arxiv.org/html/2610.02525#S6)     | Qwen3.6-27B for MIRA-AC; GPT-5.5 and GPT-6 Astra in untrained MIRA studies. | Trained decision policy and shared critic; fixed curator and fresh Codex executors. |
| [IdeaScientist](https://arxiv.org/html/2610.04074#S5)      | Qwen3.6-27B; base variants include Gemma-4-31B and GPT-OSS-120B.            | GRPO-trained ideation roles; fixed orchestrator.                                    |
| [DuoDiscover](https://arxiv.org/html/2610.17184#S3)        | Opus 5 with Sonnet 5 helper; Gemini 3.8 Flash in additional runs.           | Claude Code or Antigravity; four Workers by default.                                |

</div>

## Tasks {#tasks}

<a class="essay-read" href="{{ '/blog/2026/autoresearch-as-optimization/tasks/' | relative_url }}">See details on the tasks <span aria-hidden="true">→</span></a>
