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

<figure class="ppo-map" id="ppo-paper-map" aria-labelledby="ppo-map-title">
<div class="ppo-map-heading"><span class="note-label">From rollout to update</span><h3 id="ppo-map-title">Where recent papers change PPO</h3></div>
<ol class="ppo-stages">
<li class="ppo-stage" data-stage="1"><div class="ppo-stage-top"><span class="ppo-stage-number">01</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h7m-7 6h7m-7 6h7m4-12 5 6-5 6M12 12h8"/></svg></div><strong>Rollouts</strong><p>Generate trajectories</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2607.07508" data-paper="sao">SAO</a><a href="https://yifanzhang-pro.github.io/FlashREINFORCE/" data-paper="flash">FlashREINFORCE</a></div></li>
<li class="ppo-stage" data-stage="2"><div class="ppo-stage-top"><span class="ppo-stage-number">02</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5m0 14h16M8 15l4-5 4 2 4-7"/><circle cx="12" cy="10" r="1"/></svg></div><strong>Reward & value</strong><p>Evaluate outcomes and prefixes</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2604.19295" data-paper="tempo">TEMPO</a><a href="https://arxiv.org/abs/2609.39247" data-paper="ac2">AC2</a></div></li>
<li class="ppo-stage" data-stage="3"><div class="ppo-stage-top"><span class="ppo-stage-number">03</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M12 4v16m-5-5 5 5 5-5M7 9l5-5 5 5"/></svg></div><strong>Advantages</strong><p>Assign credit relative to a baseline</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2607.07508" data-paper="sao">SAO</a><a href="https://arxiv.org/abs/2609.39247" data-paper="ac2">AC2</a><a href="https://yifanzhang-pro.github.io/FlashREINFORCE/" data-paper="flash">FlashREINFORCE</a></div></li>
<li class="ppo-stage" data-stage="4"><div class="ppo-stage-top"><span class="ppo-stage-number">04</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h13l-3-3m3 3-3 3M20 17H7l3-3m-3 3 3 3"/></svg></div><strong>Policy correction</strong><p>Account for distribution mismatch</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2609.20807" data-paper="centering">Score Centering</a><a href="https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md" data-paper="decoupled">Decoupled PPO</a></div></li>
<li class="ppo-stage" data-stage="5"><div class="ppo-stage-top"><span class="ppo-stage-number">05</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h4v-5H4zm6 0h4V9h-4zm6 0h4V5h-4z"/></svg></div><strong>Updates</strong><p>Optimize actor and critic</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2609.36802" data-paper="easy">EasyPPO</a><a href="https://arxiv.org/abs/2607.07508" data-paper="sao">SAO</a><a href="https://arxiv.org/abs/2604.19295" data-paper="tempo">TEMPO</a><a href="https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md" data-paper="decoupled">Decoupled PPO</a></div></li>
</ol>
<div class="ppo-loop"><span aria-hidden="true">↶</span> Updated policy and value model feed the next round</div>
<div class="ppo-map-interaction" hidden>
<div class="ppo-paper-select" role="group" aria-label="Highlight a paper's contributions"><button type="button" data-paper="all" aria-pressed="true">All papers</button>
<button type="button" data-paper="sao" data-stages="1 3 5" data-detail="Single-rollout asynchronous sampling, a learned value baseline, and strict double-sided token clipping." data-url="https://arxiv.org/abs/2607.07508" aria-pressed="false">SAO</button>
<button type="button" data-paper="easy" data-stages="5" data-detail="Stabilize critic training with actor-only overlong filtering, noise-normalized regression, and smaller critic minibatches." data-url="https://arxiv.org/abs/2609.36802" aria-pressed="false">EasyPPO</button>
<button type="button" data-paper="tempo" data-stages="2 5" data-detail="Use critic feedback for policy refinement on unlabeled questions, then recalibrate the critic on labeled data." data-url="https://arxiv.org/abs/2604.19295" aria-pressed="false">TEMPO</button>
<button type="button" data-paper="ac2" data-stages="2 3" data-detail="Use generative critic estimates for action-chunk advantages and updates, gated by local readiness." data-url="https://arxiv.org/abs/2609.39247" aria-pressed="false">AC2</button>
<button type="button" data-paper="flash" data-stages="1 3" data-detail="Single-rollout asynchronous learning with batch centering replaces the learned value baseline. This is a critic-free alternative to PPO." data-url="https://yifanzhang-pro.github.io/FlashREINFORCE/" aria-pressed="false">FlashREINFORCE</button>
<button type="button" data-paper="centering" data-stages="4" data-detail="Apply an additive correction for gradient drift from training–inference mismatch. Score here means the log-probability gradient." data-url="https://arxiv.org/abs/2609.20807" aria-pressed="false">Score Centering</button>
<button type="button" data-paper="decoupled" data-stages="4 5" data-detail="Separate behavior-policy importance correction from clipping around a recent proximal policy." data-url="https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md" aria-pressed="false">Decoupled PPO</button>
</div>
<div class="ppo-paper-detail" aria-live="polite" aria-atomic="true"><span class="ppo-detail-name">Explore the loop</span><p>Select a paper to highlight the stages it changes.</p><a hidden>Read the paper ↗</a></div>
</div>
<figcaption>Selected contributions across PPO and related methods. A paper can span several stages; FlashREINFORCE removes the critic.</figcaption>
</figure>

## Revisiting PPO {#recent-work}

PPO gives the actor and critic different jobs. The actor learns which actions to make more likely. The critic estimates the return expected from the current prompt and generated prefix, providing a baseline for the actor’s update.

<aside class="ppo-math-block" aria-labelledby="ppo-components-title" markdown="1">

<h3 id="ppo-components-title">Two updates, different interventions</h3>

For actor $\pi_\theta$ and critic $V_\phi$, write $\psi_\theta=\nabla_\theta\log\pi_\theta(a\mid s)$. Their updates expose the main components:

$$
\begin{aligned}
g_{\mathrm{actor}}&=\mathbb E_{\mathcal D}\!\left[m\,\hat A\,(w\psi_\theta-c(s))\right],\\[4pt]
L_V&=\mathbb E_{\mathcal D}\!\left[m^V\omega_x\,\ell(V_\phi(s),Y)\right].
\end{aligned}
$$

$\mathcal D$: sampled trajectories · $m,m^V$: masks and aggregation · $\hat A$: advantage · $w$: probability correction · $c$: score correction · $\omega_x,Y$: critic weight and target. This is a component map: clipping enters through effective weights/masks; KL terms are omitted.

<div class="table-scroll" role="region" aria-label="Papers mapped to mathematical components" tabindex="0" markdown="1">

| Work                                                                                                  | Main intervention                                                                                                              |
| :---------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| [SAO](https://arxiv.org/html/2607.07508v1)                                                            | $\mathcal D$: one rollout per prompt; $\hat A$: skip-observation GAE; $w$: strict token masking; more frequent critic updates. |
| [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/)                                    | $\hat A_i=R_i-\bar R_{\mathrm{batch}}$; single rollouts, sequence admission, per-trajectory averaging; no $L_V$.               |
| [AC2](https://arxiv.org/html/2609.39247v2)                                                            | $\hat A_i=v_i-\bar v$, $Y=\bar v$; critic-ready problems use $v_i=V(s\cdot c_i)$ for unfinished chunks.                        |
| [TEMPO](https://arxiv.org/html/2604.19295v1)                                                          | $\hat A_t=V(y_{\mathrm{complete}})-V(s_t)$; periodically recalibrate $V$ on labeled data.                                      |
| [Score Centering](https://arxiv.org/html/2609.20807v1)                                                | $c(s)=\mathbb E_{a\sim\mu(\cdot\mid s)}[w\psi_\theta]$: center the weighted score under the sampler $\mu$.                     |
| [Decoupled PPO](https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md) | Separate $\nu/\mu$ for behavior correction from $\pi_\theta/\nu$ for PPO clipping; $\nu$ is a recent policy.                   |
| [EasyPPO](https://arxiv.org/html/2609.36802v1)                                                        | $\omega_x\propto1/\max(\hat\sigma_x,\varepsilon)$; $m^V$ retains truncated samples; smaller critic minibatches.                |

</div>

For complete terminal-return PPO with $\gamma=\lambda=1$, $\hat A_t=R-V_{\mathrm{old}}(s_t)$. Reward centering changes $\hat A$; score centering changes the gradient term $c(s)$.

</aside>

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
