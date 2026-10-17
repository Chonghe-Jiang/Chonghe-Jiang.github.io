---
layout: research-post
title: "Revisiting Autoresearch for Scientific Discovery"
description: "How research agents manage context, choose experiments, and evaluate progress."
topic: Scientific discovery · Agents · Optimization
date: 2026-10-15 00:00:00 -0400
permalink: /blog/2026/revisiting-autoresearch/
research_blog: true
sections:
  - { id: methods, title: Methods }
  - { id: experiments, title: Models }
  - { id: evaluation-budget, title: Evaluation budget }
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

## Evaluation sample complexity {#evaluation-budget}

Evaluation counts for solving one problem, excluding offline policy training. Where papers report steps or proposals instead, the unit is kept explicit.

<div class="ar-study-table-wrap ar-eval-table" role="region" aria-label="Evaluation counts by paper" tabindex="0" markdown="1">

| Paper                                                     | Count per problem / run                                                                                                                                                                                                 | What the count covers                                                                                                                                                                                                                                                             |
| :-------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Fork-and-Flush](https://arxiv.org/html/2610.07447#S2)    | **No per-task total tabulated.** Runs use **6,000–100,000 Copilot credits**, depending on the task.                                                                                                                     | Agents choose how often to submit for grading. Four branches and three fan-outs describe the search schedule, not the number of evaluations. [Trajectory plots](https://arxiv.org/html/2610.07447#A7) mark graded submissions individually.                                       |
| [Forgetting](https://arxiv.org/pdf/2610.20563#page=6)     | **AHC014 ablation: 30 initial + 30 further proposals per agent.** For four agents, this gives **240 proposal slots** in total (derived), including the shared prefix.                                                   | Each new candidate is scored by the harness. Empty turns produce no candidate, so proposal slots need not equal evaluations. The main four-task comparison uses a dollar budget; its completed evaluation totals are not tabulated.                                               |
| [SLA](https://arxiv.org/html/2610.07625#A2.SS1)           | **9 candidate trials per full Advisor epoch** (derived: 3 Workers × 3 trials). **Whole-run evaluation totals are not tabulated.**                                                                                       | The harness evaluates Worker candidates. Runs stop at a token budget: e.g. **1B tokens** for VLIW and **700M** for FrontierSWE. These include input and output tokens; they cannot be converted directly into eval counts.                                                        |
| [CCTS](https://arxiv.org/html/2602.03132v1#S5.SS1)        | **25 child-evaluation steps** per run in the main mathematical comparison; **60 independent runs** per task. A [longer circle-packing example](https://arxiv.org/html/2602.03132v1#A6.SS1) runs for **120 iterations**. | One child is generated and evaluated per search iteration. The counts describe the search loop, excluding seed initialization and concept-extraction calls; 60 is the replicate count, not extra search within one run.                                                           |
| [MIRA / MIRA-AC](https://arxiv.org/html/2610.02525#A2)    | **At most 20 research decisions** per rollout in the four policy-evaluation environments, followed by **one final gold-evaluation stage**. **Total proxy calls are not reported.**                                      | An executor can run multiple experiments within one decision. Gold feedback is withheld during search. Separate untrained MIRA architecture campaigns use [**24 h** for RMT](https://arxiv.org/html/2610.02525#A5) and [**48 h** for Loop Transformer](https://arxiv.org/html/2610.02525#A6).                                                                     |
| [IdeaScientist](https://arxiv.org/html/2610.04074#A5.SS1) | **No executed candidate experiments.** The orchestrator has a **100-turn cap**; the number of in-loop reviewer calls is not tabulated.                                                                                  | It produces and reviews research proposals. Literature reads, reviewer verdicts and final proposal grading are distinct from executing an experiment to test the proposed idea.                                                                                                   |
| [DuoDiscover](https://arxiv.org/html/2610.17184#A6.SS1)   | **54 true evals per SOL-Exec kernel; 59 per SWE-fficiency task**, versus **76 / 72** for Claude Code. On SOL-Exec, **13 true evals** suffice to match Claude Code’s final score.                                        | Reported means for the analyzed benchmark subsets. Cheap yardstick evaluations are additional; these numbers count only full evaluations. [System case studies](https://arxiv.org/html/2610.17184#A4): **7** for vLLM, **6** for FreeToken, **17** for SQLite and **7** for zstd. |

</div>

## Tasks {#tasks}

<a class="essay-read" href="{{ '/blog/2026/revisiting-autoresearch/tasks/' | relative_url }}">See details on the tasks <span aria-hidden="true">→</span></a>
