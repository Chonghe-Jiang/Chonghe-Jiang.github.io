---
layout: research-post
title: "Revisiting PPO for LLM Post-Training"
description: "Can a model learn to discover better solutions? Recent PPO work and our first experiments with test-time training."
topic: Reinforcement learning · Test-time discovery
date: 2026-10-14 00:00:00 -0400
permalink: /blog/2026/revisiting-ppo/
research_blog: true
math: true
og_image: /assets/img/blog/ppo-trajectories.png
sections:
  - { id: recent-work, title: Revisiting PPO }
  - { id: special, title: What makes TTT special }
  - { id: results, title: PPO for discovery }
  - { id: achieved, title: What we achieved }
  - { id: improve, title: What needs improvement }
---

A model can get better at producing working code while barely improving the best solution it has found. That gap is what interests me about PPO for test-time training.

In post-training, we usually want a model to perform well across many questions. In test-time discovery, we spend a budget on one problem, learn from our attempts, and keep the best result. A training method that improves the average response may still struggle to make the next discovery.

Recent work on PPO offers several ways to rethink that loop: how we sample, what the critic learns, and how much we trust an update. We have started testing these ideas by training a small model to guide a larger one through a programming search.

## Revisiting PPO {#recent-work}

PPO gives the actor and critic different jobs. The actor learns which actions to make more likely. The critic estimates the return expected from the current prompt and generated prefix, providing a baseline for the actor’s update.

With a complete rollout, a terminal reward, and γ = λ = 1, the advantage simplifies to:

$$
A_t = R - V_{\mathrm{old}}(s_t).
$$

The execution supplies the outcome; the critic helps decide whether it was better or worse than expected. A useful baseline can reduce gradient variance without perfectly ranking finished answers. [PPO](https://arxiv.org/abs/1707.06347) and [GAE](https://arxiv.org/abs/1506.02438) provide the foundations; recent LLM work changes how these pieces fit together.

<div class="table-scroll" role="region" aria-label="Recent PPO and related methods" tabindex="0" markdown="1">

| Work                                                                                                  | Main idea                                                                                          | Why it matters                                                                 |
| :---------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| [SAO](https://arxiv.org/abs/2607.07508)                                                               | Single-rollout asynchronous training with a value model and strict double-sided token clipping.    | Learn without waiting for a group of sibling executions.                       |
| [EasyPPO](https://arxiv.org/abs/2609.36802)                                                           | Actor-only overlong filtering, noise-normalized critic regression, and smaller critic minibatches. | How we train the critic can matter as much as having one.                      |
| [TEMPO](https://arxiv.org/abs/2604.19295)                                                             | Alternate policy refinement on unlabeled questions with critic recalibration on labeled data.      | Learned feedback needs to keep up with the policy.                             |
| [AC2](https://arxiv.org/abs/2609.39247)                                                               | Use a generative critic for action-chunk updates, gated by local readiness.                        | A sufficiently reliable critic can support updates before a full rollout ends. |
| [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/)                                    | Single-rollout asynchronous learning with batch centering and no critic.                           | Single-rollout learning does not require a value model.                        |
| [Score Centering](https://arxiv.org/abs/2609.20807)                                                   | Correct gradient drift caused by training–inference mismatch.                                      | Biased updates can arise even with a good advantage estimator.                 |
| [Decoupled PPO](https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md) | Separate behavior-policy correction from clipping around a recent policy.                          | Correcting stale data and limiting update size are different jobs.             |

</div>

These papers use the critic in different ways. A baseline reduces variance after we observe an outcome. A learned evaluator supplies feedback when a real outcome is unavailable or expensive. The second role asks much more of the model.

For our first discovery experiments, we kept the critic in the baseline role and evaluated every generated program. This lets us study what PPO learns from real execution feedback before asking the critic to replace any of it.

## What makes TTT special? {#special}

### One problem, many attempts

Here, **sample = 1 at the task level**. We adapt to one target problem, rather than training over a broad collection of unrelated questions. We can still generate many candidates and evaluate them on many cases. All those attempts serve the same search.

This also changes the input distribution. Each successful revision becomes a possible starting point for the next attempt. The model learns while the problem in front of it changes.

### We keep the best of all attempts

At the end, we want the strongest verified solution found anywhere in the history. The objective is closer to:

$$
\mathbb E\!\left[\max_{1\leq k\leq N} S(c_k)\right],
$$

where later candidates can depend on earlier results. Repeatedly producing a good existing solution helps average reward but adds little to that maximum. We need enough reliability to keep the search moving, alongside a willingness to try changes that might fail.

### Discovery needs depth

An experiment often reveals what to try next. Generating a large batch before receiving feedback delays that process: every candidate in the batch starts from the same available history.

With a fixed candidate budget, larger batches leave fewer rounds to learn from the results. Smaller batches give later attempts more opportunities to build on earlier discoveries.

<figure class="concept-figure depth-figure">
<span class="note-label">The same 64 executions, different feedback schedules</span>
<div class="depth-row"><div class="depth-label"><strong>Batch 32</strong><small>2 feedback rounds</small></div><div class="depth-rounds depth-two"><span>Round 1</span><span>Round 2</span></div></div>
<div class="depth-row"><div class="depth-label"><strong>Batch 8</strong><small>8 feedback rounds</small></div><div class="depth-rounds depth-eight"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span></div></div>
<figcaption>A fixed-budget illustration: smaller batches let later candidates use feedback from more rounds.</figcaption>
</figure>

Parallel exploration still matters, and smaller batches can make updates noisier. The question is how much breadth we can afford before sacrificing useful feedback depth. We have yet to test that tradeoff with a matched-budget batch-size study.

## PPO for discovery {#results}

We used Reef to search for C++ solutions to **FrontierCS Polyomino packing**. A Qwen3-8B editor proposed natural-language guidance; a frozen GPT-OSS-120B executor turned it into code. Training changed the editor, while the executor stayed fixed.

Each round selected eight parent programs from the search history and sampled 16 guidance responses per parent: **128 candidates per round**. The editor could generate up to 10,240 tokens, including thinking. We evaluated programs on 70 cases and returned scores and error feedback to the search history.

We compared PPO with Guidance-TTT, our group-based discovery recipe. PPO used a learned critic, five critic-only warmup rounds, and an exponential transform of the program score as reward. Guidance-TTT used adaptive-entropic, leave-one-out advantages to emphasize stronger candidates within each group. Both started from the same editor model and seed program.

The first 30 rounds give each method **3,840 candidate attempts**:

<figure class="trajectory-panel" id="trajectory-panel" data-source="/assets/data/ppo-ttt/trajectories.json">
<div class="figure-heading"><div><span class="note-label">Polyomino packing</span><h3>Reliability and discovery</h3></div></div>
<div class="chart-controls" hidden>
<div class="control-group" role="group" aria-label="Chart metric"><button type="button" data-metric="best" aria-pressed="true">Best score</button><button type="button" data-metric="mean" aria-pressed="false">Mean score</button><button type="button" data-metric="valid" aria-pressed="false">Validity</button></div>
<label class="range-select">Budget <select id="chart-budget"><option value="30">First 30 rounds</option><option value="all">Full trajectories</option></select></label>
</div>
<div class="chart-stage"><img src="/assets/img/blog/ppo-trajectories.png" alt="PPO and Guidance-TTT: best score and program validity over training." width="2550" height="731" loading="lazy"></div>
<div class="chart-legend" hidden></div>
<div class="round-control" hidden><label for="chart-round">Inspect round <output id="chart-round-value">30</output></label><input id="chart-round" type="range" min="1" max="30" value="30"><div id="chart-readout" aria-live="polite" aria-atomic="true"></div></div>
<figcaption id="chart-caption">Mean score and validity use a trailing five-round average. Each curve ends at its last completed round.</figcaption>
<div class="figure-downloads"><a href="/assets/data/ppo-ttt/round-metrics.csv" download>Download round metrics · CSV</a><a href="/assets/img/blog/ppo-trajectories.pdf">Static figure · PDF</a></div>
</figure>

<div class="table-scroll" role="region" aria-label="PPO and Guidance-TTT results" tabindex="0" markdown="1">

| Method       | Best score by round 30 | Mean score, rounds 16–30 | Valid programs, rounds 16–30 |
| :----------- | ---------------------: | -----------------------: | ---------------------------: |
| Guidance-TTT |              **80.45** |                    68.23 |                        93.4% |
| PPO          |                  78.48 |                **74.28** |                    **96.6%** |

</div>

Means include failed candidates. These are initial results from one run per configuration, using the same cases throughout search. PPO trained full parameters while Guidance-TTT used LoRA; their learning rates and regularization also differed. The comparison therefore describes the two systems, without isolating the effect of the critic.

## What we achieved {#achieved}

PPO produced working programs consistently and maintained higher average quality in the later half of the shared 30-round window. Most attempts reached evaluation successfully, even though the model we trained only wrote guidance for another model.

That is a useful property for discovery. Broken implementations consume budget and interrupt the chain of experiments. An editor that can propose executable changes gives us a stronger base to build on.

The best-score curve tells a different story. Guidance-TTT reached 80.45, while PPO reached 78.48. **Reliable generation and discovery progress can move at different speeds.** Improving the first does not automatically improve the second.

## What needs improvement {#improve}

### Give useful improvements more influence

PPO reached 78.484 by round 12. After 119 rounds, its best score was 78.522, a gain of just 0.038. It kept producing reasonably strong programs but rarely pushed past its early best.

Our reward helps explain why this can happen. Under its exponential transform, a score of 78.48 earns about 0.596 reward; 80.45 earns about 0.626. Avoiding a zero-reward failure offers a much larger gain than finding that better solution. This does not establish the cause of the plateau, but it makes the incentive visible.

Guidance-TTT puts more weight on the strongest outcomes within a parent’s group. I would like to test whether that relative emphasis can improve discovery while retaining PPO’s update constraint. It would change how actor advantages are constructed, so it needs a controlled comparison.

Simply subtracting the parent’s score is less decisive than it sounds. If the critic learns the same shift, reward minus value stays unchanged. The important question is how much influence a useful improvement has on the policy update.

### Give the critic a clear job

Our critic predicts the return of the current attempt. It has no training target for what a branch might achieve after several future revisions. A change that opens a promising direction can therefore look unremarkable today.

The first step is to measure whether the baseline reduces gradient variance and assigns sensible advantages to improvements and failures. We also need to compare trained editors on a fixed set of parent programs: in an evolving search, higher scores can come from better starting points as well as better guidance.

A critic that predicts downstream progress is an appealing next step. It would need evidence from longer search trajectories, where we can see which revisions actually enabled later gains.

### Make room for successive discoveries

The best Guidance-TTT solution accumulated changes over many rounds:

<figure class="milestone-figure">
<ol class="milestones">
<li><span>Round 4</span><strong>77.08</strong><small>Fit existing gaps</small></li>
<li><span>Round 9</span><strong>78.91</strong><small>Estimate future space</small></li>
<li><span>Round 13</span><strong>79.90</strong><small>Target board dimensions</small></li>
<li><span>Round 21</span><strong>80.22</strong><small>Critical piece dimensions</small></li>
<li><span>Round 28</span><strong>80.45</strong><small>Refine aspect prediction</small></li>
</ol>
<figcaption>Changes along the best Guidance-TTT solution’s ancestry.</figcaption>
</figure>

It remained a greedy packing algorithm, with improvements to ordering, board dimensions, and placement decisions. The gains came from revising an approach repeatedly as new results arrived.

That makes smaller, more frequent batches a useful next experiment. Under the same execution budget, can more feedback rounds help PPO move beyond its early plateau? I want to preserve its ability to produce working changes while giving each new result more chances to shape the next attempt.
