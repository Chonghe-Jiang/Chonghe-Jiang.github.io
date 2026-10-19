---
layout: research-post
title: "Revisiting PPO for LLM Post-Training"
description: "PPO and related policy-gradient methods for LLM post-training."
topic: Reinforcement learning · LLM post-training
date: 2026-10-14 00:00:00 -0400
permalink: /blog/2026/revisiting-ppo/
research_blog: true
math: true
sections:
  - { id: literature, title: Recent work }
  - { id: comparison, title: Paper comparison }
  - { id: mechanisms, title: Key mechanisms }
---

This post reviews **PPO and related policy-gradient methods for large language models**.

<span id="ppo-review"></span>
Need a refresher on PPO? [Start with the basics]({{ '/blog/2026/revisiting-ppo/foundations/' | relative_url }}).

## Review of Recent Work {#literature}

<figure class="ppo-map" id="ppo-paper-map" aria-labelledby="ppo-map-title">
<div class="ppo-map-heading"><span class="note-label">From rollout to update</span><h3 id="ppo-map-title">Where recent papers change PPO</h3></div>
<ol class="ppo-stages">
<li class="ppo-stage" data-stage="1"><div class="ppo-stage-top"><span class="ppo-stage-number">01</span></div><strong>Rollouts</strong><p>Generate trajectories</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2607.07508" data-paper="sao"><span class="ppo-paper-name">SAO</span></a><a href="https://yifanzhang-pro.github.io/FlashREINFORCE/" data-paper="flash"><span class="ppo-paper-name">FlashREINFORCE</span></a></div></li>
<li class="ppo-stage" data-stage="2"><div class="ppo-stage-top"><span class="ppo-stage-number">02</span></div><strong>Reward & value</strong><p>Evaluate outcomes and prefixes</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2604.19295" data-paper="tempo"><span class="ppo-paper-name">TEMPO</span></a><a href="https://arxiv.org/abs/2609.39247" data-paper="ac2"><span class="ppo-paper-name">AC2</span></a><a href="https://arxiv.org/abs/2608.23566" data-paper="bpco"><span class="ppo-paper-name">BPCO</span></a><a href="https://arxiv.org/abs/2610.15840" data-paper="lvrl"><span class="ppo-paper-name">LVRL</span></a></div></li>
<li class="ppo-stage" data-stage="3"><div class="ppo-stage-top"><span class="ppo-stage-number">03</span></div><strong>Advantages</strong><p>Assign credit relative to a baseline</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2607.07508" data-paper="sao"><span class="ppo-paper-name">SAO</span></a><a href="https://arxiv.org/abs/2609.39247" data-paper="ac2"><span class="ppo-paper-name">AC2</span></a><a href="https://yifanzhang-pro.github.io/FlashREINFORCE/" data-paper="flash"><span class="ppo-paper-name">FlashREINFORCE</span></a><a href="https://arxiv.org/abs/2608.23566" data-paper="bpco"><span class="ppo-paper-name">BPCO</span></a><a href="https://arxiv.org/abs/2610.15840" data-paper="lvrl"><span class="ppo-paper-name">LVRL</span></a></div></li>
<li class="ppo-stage" data-stage="4"><div class="ppo-stage-top"><span class="ppo-stage-number">04</span></div><strong>Policy objective</strong><p>Correct probabilities and limit updates</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2609.20807" data-paper="centering"><span class="ppo-paper-name">Score Centering</span></a><a href="https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md" data-paper="decoupled"><span class="ppo-paper-name">Decoupled PPO</span></a><a href="https://arxiv.org/abs/2608.23566" data-paper="bpco"><span class="ppo-paper-name">BPCO</span></a></div></li>
<li class="ppo-stage" data-stage="5"><div class="ppo-stage-top"><span class="ppo-stage-number">05</span></div><strong>Updates</strong><p>Optimize actor and critic</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2609.36802" data-paper="easy"><span class="ppo-paper-name">EasyPPO</span></a><a href="https://arxiv.org/abs/2607.07508" data-paper="sao"><span class="ppo-paper-name">SAO</span></a><a href="https://arxiv.org/abs/2604.19295" data-paper="tempo"><span class="ppo-paper-name">TEMPO</span></a><a href="https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md" data-paper="decoupled"><span class="ppo-paper-name">Decoupled PPO</span></a><a href="https://arxiv.org/abs/2608.23566" data-paper="bpco"><span class="ppo-paper-name">BPCO</span></a><a href="https://arxiv.org/abs/2610.20597" data-paper="cope"><span class="ppo-paper-name">CoPE</span></a></div></li>
</ol>
<div class="ppo-loop"><span aria-hidden="true">↶</span> Updated policy and value model feed the next round</div>
<div class="ppo-map-interaction" hidden>
<div class="ppo-paper-select" role="group" aria-label="Highlight a paper's contributions"><button type="button" data-paper="all" aria-pressed="true">All papers</button>
<button type="button" data-paper="sao" data-stages="1 3 5" data-detail="Single-rollout asynchronous sampling, a learned value baseline, and strict double-sided token clipping." data-url="https://arxiv.org/abs/2607.07508" aria-pressed="false"><span class="ppo-paper-name">SAO</span></button>
<button type="button" data-paper="easy" data-stages="5" data-detail="Stabilize critic training with actor-only overlong filtering, noise-normalized regression, and smaller critic minibatches." data-url="https://arxiv.org/abs/2609.36802" aria-pressed="false"><span class="ppo-paper-name">EasyPPO</span></button>
<button type="button" data-paper="tempo" data-stages="2 5" data-detail="Use critic feedback for policy refinement on unlabeled questions, then recalibrate the critic on labeled data." data-url="https://arxiv.org/abs/2604.19295" aria-pressed="false"><span class="ppo-paper-name">TEMPO</span></button>
<button type="button" data-paper="ac2" data-stages="2 3" data-detail="Use generative critic estimates for action-chunk advantages and updates, gated by local readiness." data-url="https://arxiv.org/abs/2609.39247" aria-pressed="false"><span class="ppo-paper-name">AC2</span></button>
<button type="button" data-paper="flash" data-stages="1 3" data-detail="Single-rollout asynchronous learning with batch centering replaces the learned value baseline. This is a critic-free alternative to PPO." data-url="https://yifanzhang-pro.github.io/FlashREINFORCE/" aria-pressed="false"><span class="ppo-paper-name">FlashREINFORCE</span></button>
<button type="button" data-paper="centering" data-stages="4" data-detail="Apply an additive correction for gradient drift from training–inference mismatch. Score here means the log-probability gradient." data-url="https://arxiv.org/abs/2609.20807" aria-pressed="false"><span class="ppo-paper-name">Score Centering</span></button>
<button type="button" data-paper="decoupled" data-stages="4 5" data-detail="Separate behavior-policy importance correction from clipping around a recent proximal policy." data-url="https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md" aria-pressed="false"><span class="ppo-paper-name">Decoupled PPO</span></button>
<button type="button" data-paper="bpco" data-stages="2 3 4 5" data-detail="Bounded value predictions, Monte Carlo targets, raw advantages, length-adaptive GAE, and Divergence PPO clipping." data-url="https://arxiv.org/abs/2608.23566" aria-pressed="false"><span class="ppo-paper-name">BPCO</span></button>
<button type="button" data-paper="lvrl" data-stages="2 3" data-detail="A frozen LLM assigns step credit through anchored hindsight value differences, conditioned on group context." data-url="https://arxiv.org/abs/2610.15840" aria-pressed="false"><span class="ppo-paper-name">LVRL</span></button>
<button type="button" data-paper="cope" data-stages="5" data-detail="Add successful-trajectory action forecasting to GRPO using the policy backbone; no learned value critic." data-url="https://arxiv.org/abs/2610.20597" aria-pressed="false"><span class="ppo-paper-name">CoPE</span></button>
</div>
<div class="ppo-paper-detail" aria-live="polite" aria-atomic="true"><span class="ppo-detail-name">Explore the loop</span><p>Select a paper to highlight the stages it changes.</p><a hidden>Read the paper ↗</a></div>
</div>
<figcaption>Select a paper to locate its changes. FlashREINFORCE and CoPE use critic-free updates; LVRL uses a frozen critic.</figcaption>
</figure>

**Agent:** SAO, LVRL, CoPE, EasyPPO, FlashREINFORCE.

**LLM:** TEMPO, AC2, Score Centering, Decoupled PPO¹, BPCO, EasyPPO, FlashREINFORCE.

<span id="models"></span>

### Where the papers intervene {#comparison}

<div class="table-scroll ppo-literature-table" role="region" aria-label="PPO methods, experimental settings, models, critics and tasks" tabindex="0" markdown="1">

| Work                                                                                                  | RL setting | Component                     | What changes                                                                                                                                                                                                             | Models & Tasks                                                                                                                                                                                                                                                                                     | Critic / judge                                                                                           |
| :---------------------------------------------------------------------------------------------------- | :--------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| [SAO](https://arxiv.org/html/2607.07508v1)                                                            | Agent      | Rollouts · GAE · updates      | One rollout per prompt, asynchronous collection, skip-observation GAE, strict token masking, and more frequent critic updates.                                                                                           | **Models:** Qwen3-30B-A3B-Thinking-2507; TIR-finetuned initialization for math.<br><br>**Tasks:** [Math with Python](tasks/#math); [SWE-bench Verified](tasks/#coding) with OpenHands.                                                                                                             | Separate value model initialized from the policy checkpoint.                                             |
| [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/)                                    | Both       | Rollouts · baseline           | Uses $R_i-\bar R_{\mathrm{batch}}$, sequence admission and per-trajectory averaging. No learned critic or $L_V$.                                                                                                         | **Models:** DeepSeek-R1-Distill-Qwen-1.5B; Qwen2.5-Math-1.5B; Qwen2.5-7B-Instruct; Qwen3-30B-A3B.<br><br>**Tasks:** [Math and Python tool use](tasks/#math); [ALFWorld](tasks/#agents).                                                                                                            | No critic.                                                                                               |
| [TEMPO](https://arxiv.org/html/2604.19295v1)                                                          | LLM        | Value feedback                | Uses $V(y_{\mathrm{complete}})-V(s_t)$ on unlabeled questions, with periodic critic recalibration on labeled data.                                                                                                       | **Models:** Qwen3-8B/14B-Base; OLMO3-7B-Base, after PPO initialization.<br><br>**Tasks:** [Math and general reasoning](tasks/#math), with unlabeled adaptation sets and separate held-out sets.                                                                                                    | Learned critic; GPT-OSS-120B judges general-domain answers.                                              |
| [AC2](https://arxiv.org/html/2609.39247v2)                                                            | LLM        | Chunk values · advantages     | Uses $v_i-\bar v$ and critic target $\bar v$. For critic-ready problems, unfinished chunks receive $v_i=V(s\cdot c_i)$.                                                                                                  | **Models:** Qwen3-4B-Thinking-2507.<br><br>**Tasks:** [FineProofs-RL → IMO-ProofBench](tasks/#proofs).                                                                                                                                                                                             | Actor and generative critic share weights; DeepSeek-V4-Flash grades proofs.                              |
| [Score Centering](https://arxiv.org/html/2609.20807v1)                                                | LLM        | Actor gradient                | Centers the weighted score: $w\psi_\theta-c(s)$, where $w$ is the importance weight, $\psi_\theta=\nabla\log\pi_\theta$ and $c(s)=\mathbb E_{a\sim\mu}[w\psi_\theta]$. Addresses drift from training–inference mismatch. | **Models:** Qwen3-0.6B-Instruct; Qwen3-30B-A3B-Base.<br><br>**Tasks:** [Countdown and INTELLECT-2 math](tasks/#math), under controlled sampler–trainer mismatch.                                                                                                                                   | No learned critic in the controlled comparison; group-centered REINFORCE.                                |
| [Decoupled PPO](https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md) | LLM¹       | Probability ratios            | Separates behavior correction $\nu/\mu$ from clipping around $\pi_\theta/\nu$, where $\nu$ is a recent proximal policy.                                                                                                  | **Models:** Qwen2.5-1.5B-Instruct in the [AReaL example](https://github.com/areal-project/AReaL/blob/bb13e3bdb9a865608eafa017a70a790124c3d3bb/examples/math/gsm8k_ppo.yaml).<br><br>**Tasks:** [GSM8K](tasks/#math). This row describes a released configuration, not a separate paper experiment. | Separate critic initialized from the same checkpoint.                                                    |
| [EasyPPO](https://arxiv.org/html/2609.36802v1)                                                        | Both       | Critic weighting · updates    | Uses $\omega_x\propto1/\max(\hat\sigma_x,\varepsilon)$, retains truncated samples for the critic, filters them for the actor, and uses smaller critic minibatches.                                                       | **Models:** Qwen3.5-9B-Base for math/search; Qwen3.5-9B after SFT for coding.<br><br>**Tasks:** DAPO-Math-17K → AIME24; [FrontierSmith → FrontierCS](tasks/#coding); [Search-R1](tasks/#agents).                                                                                                   | Learned token-value critic. DeepSeek-V3.1 supplies coding SFT trajectories.                              |
| [BPCO](https://arxiv.org/html/2608.23566v2)                                                           | LLM        | Critic · GAE · clipping       | Bounds values to the reward range, uses $Y_t=R$, preserves raw advantages, and adapts $\lambda_\pi$ to length. Optional privileged critic inputs; Divergence PPO clipping.                                               | **Models:** DeepSeek-R1-Distill-Qwen-1.5B; Qwen3-30B-A3B Base/non-Base; Qwen3-4B-Base for rubrics.<br><br>**Tasks:** [Math](tasks/#math): DeepScaleR or DAPO-Math-17K → AIME25; [OpenRubrics](tasks/#rubrics).                                                                                     | Learned critic; optional answer/rubric inputs. Qwen3-4B-Instruct-2507 is the rubric judge.               |
| [LVRL](https://arxiv.org/html/2610.15840v1)                                                           | Agent      | Value estimates · step credit | A frozen LLM uses trajectory and group context to estimate values. Anchored value differences give action-level advantages; no critic optimization.                                                                      | **Models:** Qwen3-4B/8B for AppWorld and BabyAI; Qwen3-8B/32B for repository tasks.<br><br>**Tasks:** [AppWorld, BabyAI](tasks/#agents); [R2E-Gym → SWE-bench Verified](tasks/#coding).                                                                                                            | Frozen Claude Opus 4.6 value critic. LVOPD uses Qwen3-235B-A22B-Thinking-2507-FP8 as teacher and critic. |
| [CoPE](https://arxiv.org/html/2610.20597v2)                                                           | Agent      | Auxiliary policy loss         | Adds successful-trajectory action forecasting to GRPO on a shared backbone. It changes supervision, without adding a value critic.                                                                                       | **Models:** Qwen2.5-7B-Instruct; Qwen2.5-14B-Instruct for AppWorld.<br><br>**Tasks:** [ALFWorld, ScienceWorld, WebShop, τ²-bench and AppWorld](tasks/#agents).                                                                                                                                     | No value critic; acting and forecasting share one backbone.                                              |

</div>

¹ Decoupled PPO refers to the linked GSM8K example. AC2’s chunks divide a proof into segments, without external interaction.

<a class="essay-read" href="{{ '/blog/2026/revisiting-ppo/tasks/' | relative_url }}">See details on the tasks <span aria-hidden="true">→</span></a>

## Key mechanisms {#mechanisms}

### [SAO](https://arxiv.org/html/2607.07508v1#S3) {#sao}

- **Single-rollout sampling:** Collect one trajectory per prompt asynchronously. A learned critic supplies the baseline, so training need not wait for sibling rollouts.
- **Token masking:** Compare current token probabilities with logged rollout probabilities. Mask tokens whose ratio falls outside the allowed interval, regardless of advantage sign.
- **Skip-observation GAE:** Connect consecutive model actions across tool feedback, without computing GAE through observation tokens. The feedback remains in the next action’s context.
- **Critic updates:** Warm up the critic, freeze its attention layers, and update it twice per actor update to help it track the changing policy.

### [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/#method) {#flashreinforce}

- **No learned critic:** Sample once per prompt and subtract the batch mean reward, across different prompts, to obtain signed advantages.
- **Trajectory filtering:** Weight token updates by current-to-rollout probability ratios, then reject whole trajectories with excessive estimated policy divergence.
- **Equal trajectory weight:** Average over tokens within each trajectory, then over the batch. Long failures do not get extra weight simply for being long; each fresh batch receives one update.

### [TEMPO](https://arxiv.org/html/2604.19295v1#S3) {#tempo}

- **Critic feedback at test time:** On unlabeled questions, use the critic’s final-response score as reward and subtract its prefix predictions for token-level advantages.
- **Periodic recalibration:** Retrain the critic on labeled questions with verified rewards, then resume policy adaptation. This keeps feedback tied to external supervision as the actor changes.

### [AC2](https://arxiv.org/html/2609.39247v2#S3) {#ac2}

- **Short continuations:** Sample prefixes from a replay buffer and generate several continuations. Once the critic passes readiness checks, stop at a chunk boundary and estimate the unfinished response’s value.
- **Chunk advantages:** Subtract the group mean endpoint value from each continuation’s value. Train the shared generative critic to predict that group mean at the starting prefix.
- **Full-rollout audits:** Still complete a fraction of ready problems to check critic accuracy against actual outcomes.

### [Score Centering](https://arxiv.org/html/2609.20807v1#S4) {#score-centering}

- **Center the gradient:** “Score” means the log-probability gradient. Subtract its expected value under the sampler at each prefix to remove drift caused by sampler–trainer mismatch.
- **Practical correction:** Store the sampler’s top-token probabilities and approximate the remaining probability mass. The correction can also be combined with importance weighting.

### [Decoupled PPO](https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md#importance-weight-metrics) {#decoupled-ppo}

- **Two probability ratios:** Use proximal-policy / behavior-policy probabilities for sampling correction, and current-policy / proximal-policy probabilities for PPO clipping.
- **A recent clipping reference:** The proximal policy is one training step behind the current policy. This separates the size of a new update from how stale its rollout is.

### [EasyPPO](https://arxiv.org/html/2609.36802v1#S3) {#easyppo}

- **Actor-only truncation filtering:** Exclude overlong responses from actor updates but retain them for critic training, so value estimates include the risk of failing to finish.
- **Noise-weighted critic loss:** Weight each prompt’s critic loss by the inverse standard deviation of its sampled returns. Prompts with more variable rewards have less influence.
- **Smaller critic minibatches:** Apply gradient clipping to moderately smaller batches, limiting how many other samples an outlier can suppress. The actor retains the PPO objective.

<span id="bpco-change-what-the-critic-learns"></span>

### [BPCO](https://arxiv.org/html/2608.23566v2#S3) {#bpco}

- **Ground the critic:** Bound predictions to the reward range and regress directly on observed final rewards. Optional reference answers or rubrics go to the critic only.
- **Preserve the learning signal:** Keep raw advantages and adapt GAE’s decay to response length, avoiding batch normalization that can amplify small residual signals.
- **Divergence PPO:** Make clipping depend on the sampled token’s probability, rather than applying the same ratio bounds everywhere. This differs from Decoupled PPO above.

<span id="lvrl-redistribute-the-outcome-across-actions"></span>

### [LVRL](https://arxiv.org/html/2610.15840v1) {#lvrl}

- **Frozen LLM critic:** Read completed trajectories and related rollouts to estimate intermediate values in hindsight; no critic training is needed.
- **Anchored credit:** Fix the starting value to the group mean reward and the final value to the observed reward. Adjacent value differences assign credit to actions and sum to the outcome’s improvement over the group mean, before normalization.

<span id="cope-learn-more-from-successful-trajectories"></span>

### [CoPE](https://arxiv.org/html/2610.20597v2) {#cope}

- **Forecast successful actions:** Add a supervised loss that predicts several subsequent actions from a history in a successful rollout.
- **Shared policy backbone:** Train acting with GRPO and forecasting with the auxiliary loss. At inference the model still acts one step at a time; the extra supervision does not require a value critic.
