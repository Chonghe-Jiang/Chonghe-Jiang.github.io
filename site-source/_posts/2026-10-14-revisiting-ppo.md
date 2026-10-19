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
  - { id: without-critic, title: Without critic networks }
  - { id: critic-roles, title: What critics do }
  - { id: critic-inputs, title: What critics see }
  - { id: update-stability, title: Stable updates }
  - { id: grpo-supervision, title: Beyond GRPO rewards }
  - { id: comparison, title: Paper comparison }
---

This post reviews **PPO and related policy-gradient methods for large language models** from five perspectives.

<span id="ppo-review"></span>
Need a refresher on PPO? [Start with the basics]({{ '/blog/2026/revisiting-ppo/foundations/' | relative_url }}).

<span id="literature"></span>
<span id="ppo-paper-map"></span>
<nav class="ppo-directions" aria-label="Five directions in policy optimization">
<a href="#without-critic"><span class="ppo-direction-number">01</span><span><strong>Learning without critic networks</strong><small>FlashREINFORCE · SPO</small></span><span aria-hidden="true">↗</span></a>
<a href="#critic-roles"><span class="ppo-direction-number">02</span><span><strong>Changing what critics do</strong><small>TEMPO · AC2</small></span><span aria-hidden="true">↗</span></a>
<a href="#critic-inputs"><span class="ppo-direction-number">03</span><span><strong>Changing what critics see</strong><small>BPCO · LVRL</small></span><span aria-hidden="true">↗</span></a>
<a href="#update-stability"><span class="ppo-direction-number">04</span><span><strong>Stabilizing policy updates</strong><small>SAO · Score Centering · EasyPPO</small></span><span aria-hidden="true">↗</span></a>
<a href="#grpo-supervision"><span class="ppo-direction-number">05</span><span><strong>Augmenting GRPO with supervision</strong><small>CoPE</small></span><span aria-hidden="true">↗</span></a>
</nav>

<span id="mechanisms"></span>

## Learning without critic networks {#without-critic}

Replace learned value networks and same-prompt rollout groups with statistical baselines.

<figure class="ppo-family-figure" aria-label="statistical baselines mechanism comparison">
<div class="ppo-variant-controls" role="group" aria-label="Choose a method" hidden><button type="button" data-variant="flash" aria-pressed="true" aria-controls="statistical-baselines-flash">FlashREINFORCE</button><button type="button" data-variant="spo" aria-pressed="false" aria-controls="statistical-baselines-spo">SPO</button></div>
<div class="ppo-variant-display" aria-live="polite"><div class="ppo-variant" id="statistical-baselines-flash" data-variant="flash"><div class="ppo-flow"><div class="ppo-flow-node"><span>Collect</span><strong>One rollout per prompt</strong><p>Independent completions form a batch.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Baseline</span><strong>Current batch mean</strong><p>Subtract the mean reward across prompts.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Policy update</strong><p>Filter divergent trajectories; average within each.</p></div></div><p class="ppo-flow-note"><strong>FlashREINFORCE.</strong> Each fresh batch supplies its baseline and receives one update.</p></div>
<div class="ppo-variant" id="statistical-baselines-spo" data-variant="spo"><div class="ppo-flow"><div class="ppo-flow-node"><span>Collect</span><strong>One new outcome</strong><p>Read the prompt’s existing tracker.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Baseline</span><strong>Per-prompt history</strong><p>Use the prior success-rate estimate.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn &amp; retain</span><strong>Policy + tracker updates</strong><p>Learn from the outcome and refresh prompt statistics.</p></div></div><p class="ppo-flow-note"><strong>SPO.</strong> Compute advantage before incorporating the new outcome.</p></div>
</div>
</figure>

### [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/#method) {#flashreinforce}

- **No learned critic:** Sample once per prompt and subtract the batch mean reward, across different prompts, to obtain signed advantages.
- **Trajectory filtering:** Weight token updates by current-to-rollout probability ratios. For each sampled token, let $p_t$ and $q_t$ be its rollout and current-policy probabilities at the same history:

  $$
  \begin{aligned}
  d_t &= p_t\log\frac{p_t}{q_t}+(1-p_t)\log\frac{1-p_t}{1-q_t},\\
  \bar D &= \frac{1}{T}\sum_{t=1}^{T}d_t,\qquad m=\mathbf{1}[\bar D\leq\delta].
  \end{aligned}
  $$

  Keep the whole trajectory only when $m=1$; $T$ counts model-generated tokens and $\delta$ is the threshold. This Bernoulli KL is a lower-bound proxy for full-vocabulary KL. [Details](https://yifanzhang-pro.github.io/FlashREINFORCE/FlashREINFORCE.pdf#page=4).

- **Equal trajectory weight:** Average over tokens within each trajectory, then over the batch. Long failures do not get extra weight simply for being long; each fresh batch receives one update.

### [SPO](https://arxiv.org/html/2509.13232v2#S4) {#spo}

- **Persistent baseline:** Track each prompt’s success rate from past outcomes. Compute advantage against the tracker before adding the current result.
- **Adaptive memory:** Forget older outcomes faster when the policy changes more. Normalize advantages across the batch; use the tracker to prioritize prompts.

## Changing what critics do {#critic-roles}

Use value estimates when a verified outcome is unavailable or costly to obtain.

<figure class="ppo-family-figure" aria-label="critic roles mechanism comparison">
<div class="ppo-variant-controls" role="group" aria-label="Choose a method" hidden><button type="button" data-variant="tempo" aria-pressed="true" aria-controls="critic-roles-tempo">TEMPO</button><button type="button" data-variant="ac2" aria-pressed="false" aria-controls="critic-roles-ac2">AC2</button></div>
<div class="ppo-variant-display" aria-live="polite"><div class="ppo-variant" id="critic-roles-tempo" data-variant="tempo"><div class="ppo-flow"><div class="ppo-flow-node"><span>Generate</span><strong>Complete response</strong><p>The test question has no label.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Estimate</span><strong>Critic supplies reward</strong><p>Score the answer and its prefixes.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Adapt the policy</strong><p>Final score minus prefix value guides updates.</p></div></div><p class="ppo-flow-note"><strong>TEMPO.</strong> Periodically recalibrate the critic on labeled questions with verified rewards.</p></div>
<div class="ppo-variant" id="critic-roles-ac2" data-variant="ac2"><div class="ppo-flow"><div class="ppo-flow-node"><span>Generate</span><strong>Several short chunks</strong><p>Start from a stored trajectory prefix.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Estimate</span><strong>Critic supplies endpoint values</strong><p>Predict outcomes without finishing every response.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Compare continuations</strong><p>Center chunk values within their group.</p></div></div><p class="ppo-flow-note"><strong>AC2.</strong> Readiness checks permit short rollouts; full-rollout audits check the critic.</p></div>
</div>
</figure>

### [TEMPO](https://arxiv.org/html/2604.19295v1#S3) {#tempo}

- **Critic feedback at test time:** On unlabeled questions, use the critic’s final-response score as reward and subtract its prefix predictions for token-level advantages.
- **Periodic recalibration:** Retrain the critic on labeled questions with verified rewards, then resume policy adaptation. This keeps feedback tied to external supervision as the actor changes.

### [AC2](https://arxiv.org/html/2609.39247v2#S3) {#ac2}

- **Short continuations:** Sample prefixes from a replay buffer and generate several continuations. Once the critic passes readiness checks, stop at a chunk boundary and estimate the unfinished response’s value.
- **Chunk advantages:** Subtract the group mean endpoint value from each continuation’s value. Train the shared generative critic to predict that group mean at the starting prefix.
- **Full-rollout audits:** Still complete a fraction of ready problems to check critic accuracy against actual outcomes.

## Changing what critics see {#critic-inputs}

Give the critic additional evidence for estimating value and assigning credit.

<figure class="ppo-family-figure" aria-label="critic inputs mechanism comparison">
<div class="ppo-variant-controls" role="group" aria-label="Choose a method" hidden><button type="button" data-variant="bpco" aria-pressed="true" aria-controls="critic-inputs-bpco">BPCO</button><button type="button" data-variant="lvrl" aria-pressed="false" aria-controls="critic-inputs-lvrl">LVRL</button></div>
<div class="ppo-variant-display" aria-live="polite"><div class="ppo-variant" id="critic-inputs-bpco" data-variant="bpco"><div class="ppo-flow"><div class="ppo-flow-node is-focus"><span>Extra input</span><strong>Answer or rubric</strong><p>Optional reward-defining information.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Estimate</span><strong>Trainable critic</strong><p>Predict return from the response prefix.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Actor advantages</strong><p>The actor never receives the extra input.</p></div></div><p class="ppo-flow-note"><strong>BPCO.</strong> BPCO also bounds values, uses outcome targets, and preserves raw advantages.</p></div>
<div class="ppo-variant" id="critic-inputs-lvrl" data-variant="lvrl"><div class="ppo-flow"><div class="ppo-flow-node is-focus"><span>Extra input</span><strong>Completed trajectories</strong><p>The target trace, its outcome, and related rollouts.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Estimate</span><strong>Frozen LLM critic</strong><p>Assign intermediate values in hindsight.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Action-level credit</strong><p>Take adjacent differences with anchored endpoints.</p></div></div><p class="ppo-flow-note"><strong>LVRL.</strong> Group reward fixes the starting value; the observed outcome fixes the ending value.</p></div>
</div>
</figure>

<span id="bpco-change-what-the-critic-learns"></span>

### [BPCO](https://arxiv.org/html/2608.23566v2#S3) {#bpco}

- **Ground the critic:** Bound predictions to the reward range and regress directly on observed final rewards. Optional reference answers or rubrics go to the critic only.
- **Preserve the learning signal:** Keep raw advantages and adapt GAE’s decay to response length, avoiding batch normalization that can amplify small residual signals.
- **Divergence PPO:** Make clipping depend on the sampled token’s probability, rather than applying the same ratio bounds everywhere.

<span id="lvrl-redistribute-the-outcome-across-actions"></span>

### [LVRL](https://arxiv.org/html/2610.15840v1) {#lvrl}

- **Frozen LLM critic:** Read completed trajectories and related rollouts to estimate intermediate values in hindsight; no critic training is needed.
- **Anchored credit:** Fix the starting value to the group mean reward and the final value to the observed reward. Adjacent value differences assign credit to actions and sum to the outcome’s improvement over the group mean, before normalization.

## Stabilizing policy updates {#update-stability}

Control errors from asynchronous sampling, mismatched probabilities, and noisy critic training.

<figure class="ppo-family-figure" aria-label="update stability mechanism comparison">
<div class="ppo-variant-controls" role="group" aria-label="Choose a method" hidden><button type="button" data-variant="sao" aria-pressed="true" aria-controls="update-stability-sao">SAO</button><button type="button" data-variant="centering" aria-pressed="false" aria-controls="update-stability-centering">Score Centering</button><button type="button" data-variant="easy" aria-pressed="false" aria-controls="update-stability-easy">EasyPPO</button></div>
<div class="ppo-variant-display" aria-live="polite"><div class="ppo-variant" id="update-stability-sao" data-variant="sao"><div class="ppo-flow"><div class="ppo-flow-node"><span>Collect</span><strong>Asynchronous rollouts</strong><p>Behavior policies can lag behind the learner.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Correct</span><strong>Mask divergent tokens</strong><p>Use logged rollout probabilities.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Actor + critic</strong><p>Skip observations in GAE; update the critic faster.</p></div></div><p class="ppo-flow-note"><strong>SAO.</strong> Control policy lag while keeping a learned baseline for one-rollout sampling.</p></div>
<div class="ppo-variant" id="update-stability-centering" data-variant="centering"><div class="ppo-flow"><div class="ppo-flow-node"><span>Sample</span><strong>Sampler ≠ trainer</strong><p>Quantization or staleness changes probabilities.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Correct</span><strong>Center the score</strong><p>Subtract the sampler’s expected gradient.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Actor update</strong><p>Remove the mismatch-induced drift term.</p></div></div><p class="ppo-flow-note"><strong>Score Centering.</strong> The correction acts on the log-probability gradient, not the reward.</p></div>
<div class="ppo-variant" id="update-stability-easy" data-variant="easy"><div class="ppo-flow"><div class="ppo-flow-node"><span>Collect</span><strong>Complete + truncated</strong><p>Keep both kinds for critic training.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Correct</span><strong>Balance critic gradients</strong><p>Weight return noise; clip smaller minibatches.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>PPO actor update</strong><p>Filter truncated responses from actor training.</p></div></div><p class="ppo-flow-note"><strong>EasyPPO.</strong> Retaining all critic outcomes preserves the baseline’s exposure to truncation.</p></div>
</div>
</figure>

### [SAO](https://arxiv.org/html/2607.07508v1#S3) {#sao}

- **Single-rollout sampling:** Collect one trajectory per prompt asynchronously. A learned critic supplies the baseline, so training need not wait for sibling rollouts.
- **Token masking:** Compare current token probabilities with logged rollout probabilities. Mask tokens whose ratio falls outside the allowed interval, regardless of advantage sign.
- **Skip-observation GAE:** Connect consecutive model actions across tool feedback, without computing GAE through observation tokens. The feedback remains in the next action’s context.
- **Critic updates:** Warm up the critic, freeze its attention layers, and update it twice per actor update to help it track the changing policy.

### [Score Centering](https://arxiv.org/html/2609.20807v1#S4) {#score-centering}

- **Center the gradient:** At a fixed prefix $s$, write $p_a=\pi_\theta(a\mid s)$, $q_a=\mu(a\mid s)$, and $\psi_a=\nabla_\theta\log p_a$. Subtract the sampler’s expected score:

  $$
  \begin{aligned}
  c(s)&=\sum_a q_a\psi_a,\\
  g_{\mathrm{SC}}(s)&=\mathbb E_{a\sim q}\!\left[\hat A(s,a)\bigl(\psi_a-c(s)\bigr)\right].
  \end{aligned}
  $$

  The centered score has zero mean under the sampler, removing the mismatch-induced drift term.

- **Practical correction:** Store sampler probabilities for its top-$k$ tokens $H$ and approximate the remaining mass using the trainer’s distribution:

  $$
  \begin{aligned}
  \rho&=\frac{1-\sum_{a\in H}q_a}{1-\sum_{a\in H}p_a},\\
  \hat c(s)&=\sum_{a\in H}(q_a-\rho p_a)\psi_a.
  \end{aligned}
  $$

  This assigns unlogged tokens probability $\hat q_a=\rho p_a$ and uses $\sum_a p_a\psi_a=0$ to avoid summing over the tail. Hold the correction coefficients fixed when differentiating the loss. With importance weights, center $w_a\psi_a$ by subtracting $\mathbb E_{a\sim q}[w_a\psi_a]$ instead.

### [EasyPPO](https://arxiv.org/html/2609.36802v1#S3) {#easyppo}

- **Actor-only truncation filtering:** Exclude overlong responses from actor updates but retain them for critic training, so value estimates include the risk of failing to finish.
- **Noise-weighted critic loss:** Weight each prompt’s critic loss by the inverse standard deviation of its sampled returns. Prompts with more variable rewards have less influence.
- **Smaller critic minibatches:** Apply gradient clipping to moderately smaller batches, limiting how many other samples an outlier can suppress. The actor retains the PPO objective.

## Augmenting GRPO with supervision {#grpo-supervision}

Extract an additional learning signal from successful action sequences.

<figure class="ppo-family-figure" aria-label="CoPE combines GRPO and action forecasting on one policy">
<div class="ppo-cope-paths">
<div class="ppo-flow"><div class="ppo-flow-node"><span>All rollouts</span><strong>Group rewards</strong><p>Compare outcomes for the same task.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Acting</span><strong>GRPO loss</strong><p>Learn from relative rewards.</p></div></div>
<div class="ppo-flow"><div class="ppo-flow-node"><span>Successful rollouts</span><strong>Action sequences</strong><p>Use histories and the actions that followed.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Forecasting</span><strong>Auxiliary prediction loss</strong><p>Predict several subsequent actions.</p></div></div>
</div>
<div class="ppo-cope-merge"><span aria-hidden="true">↓</span><strong>Both losses update one shared policy backbone</strong></div>
<figcaption>CoPE adds supervision to GRPO; it does not introduce a value critic.</figcaption>
</figure>

<span id="cope-learn-more-from-successful-trajectories"></span>

### [CoPE](https://arxiv.org/html/2610.20597v2) {#cope}

- **Forecast successful actions:** Add a supervised loss that predicts several subsequent actions from a history in a successful rollout.
- **Shared policy backbone:** Train acting with GRPO and forecasting with the auxiliary loss. At inference the model still acts one step at a time; the extra supervision does not require a value critic.

<span id="models"></span>

## Where the papers intervene {#comparison}

**Agent:** FlashREINFORCE, SPO, LVRL, SAO, EasyPPO, CoPE.

**LLM:** FlashREINFORCE, TEMPO, AC2, BPCO, Score Centering, EasyPPO.

<div class="table-scroll ppo-literature-table" role="region" aria-label="PPO methods, experimental settings, models, critics and tasks" tabindex="0" markdown="1">

| Work                                                               | RL setting | Component                     | What changes                                                                                                                                                                                                             | Models & Tasks                                                                                                                                                                                                 | Critic / judge                                                                                           |
| :----------------------------------------------------------------- | :--------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/) | Both       | Rollouts · baseline           | Uses $R_i-\bar R_{\mathrm{batch}}$, sequence admission and per-trajectory averaging. No learned critic or $L_V$.                                                                                                         | **Models:** DeepSeek-R1-Distill-Qwen-1.5B; Qwen2.5-Math-1.5B; Qwen2.5-7B-Instruct; Qwen3-30B-A3B.<br><br>**Tasks:** [Math and Python tool use](tasks/#math); [ALFWorld](tasks/#agents).                        | No critic.                                                                                               |
| [SPO](https://arxiv.org/html/2509.13232v2)                         | Agent      | Baseline · sampling           | Uses a per-prompt, KL-adaptive value tracker and batch-wide advantage normalization.                                                                                                                                     | **Models:** Qwen3-8B.<br><br>**Tasks:** [DAPO math with Python → AIME24/25, BeyondAIME, BRUMO25 and HMMT25](tasks/#math).                                                                                      | No critic network; a tabular Bayesian tracker estimates success rates.                                   |
| [TEMPO](https://arxiv.org/html/2604.19295v1)                       | LLM        | Value feedback                | Uses $V(y_{\mathrm{complete}})-V(s_t)$ on unlabeled questions, with periodic critic recalibration on labeled data.                                                                                                       | **Models:** Qwen3-8B/14B-Base; OLMO3-7B-Base, after PPO initialization.<br><br>**Tasks:** [Math and general reasoning](tasks/#math), with unlabeled adaptation sets and separate held-out sets.                | Learned critic; GPT-OSS-120B judges general-domain answers.                                              |
| [AC2](https://arxiv.org/html/2609.39247v2)                         | LLM        | Chunk values · advantages     | Uses $v_i-\bar v$ and critic target $\bar v$. For critic-ready problems, unfinished chunks receive $v_i=V(s\cdot c_i)$.                                                                                                  | **Models:** Qwen3-4B-Thinking-2507.<br><br>**Tasks:** [FineProofs-RL → IMO-ProofBench](tasks/#proofs).                                                                                                         | Actor and generative critic share weights; DeepSeek-V4-Flash grades proofs.                              |
| [BPCO](https://arxiv.org/html/2608.23566v2)                        | LLM        | Critic · GAE · clipping       | Bounds values to the reward range, uses $Y_t=R$, preserves raw advantages, and adapts $\lambda_\pi$ to length. Optional privileged critic inputs; Divergence PPO clipping.                                               | **Models:** DeepSeek-R1-Distill-Qwen-1.5B; Qwen3-30B-A3B Base/non-Base; Qwen3-4B-Base for rubrics.<br><br>**Tasks:** [Math](tasks/#math): DeepScaleR or DAPO-Math-17K → AIME25; [OpenRubrics](tasks/#rubrics). | Learned critic; optional answer/rubric inputs. Qwen3-4B-Instruct-2507 is the rubric judge.               |
| [LVRL](https://arxiv.org/html/2610.15840v1)                        | Agent      | Value estimates · step credit | A frozen LLM uses trajectory and group context to estimate values. Anchored value differences give action-level advantages; no critic optimization.                                                                      | **Models:** Qwen3-4B/8B for AppWorld and BabyAI; Qwen3-8B/32B for repository tasks.<br><br>**Tasks:** [AppWorld, BabyAI](tasks/#agents); [R2E-Gym → SWE-bench Verified](tasks/#coding).                        | Frozen Claude Opus 4.6 value critic. LVOPD uses Qwen3-235B-A22B-Thinking-2507-FP8 as teacher and critic. |
| [SAO](https://arxiv.org/html/2607.07508v1)                         | Agent      | Rollouts · GAE · updates      | One rollout per prompt, asynchronous collection, skip-observation GAE, strict token masking, and more frequent critic updates.                                                                                           | **Models:** Qwen3-30B-A3B-Thinking-2507; TIR-finetuned initialization for math.<br><br>**Tasks:** [Math with Python](tasks/#math); [SWE-bench Verified](tasks/#coding) with OpenHands.                         | Separate value model initialized from the policy checkpoint.                                             |
| [Score Centering](https://arxiv.org/html/2609.20807v1)             | LLM        | Actor gradient                | Centers the weighted score: $w\psi_\theta-c(s)$, where $w$ is the importance weight, $\psi_\theta=\nabla\log\pi_\theta$ and $c(s)=\mathbb E_{a\sim\mu}[w\psi_\theta]$. Addresses drift from training–inference mismatch. | **Models:** Qwen3-0.6B-Instruct; Qwen3-30B-A3B-Base.<br><br>**Tasks:** [Countdown and INTELLECT-2 math](tasks/#math), under controlled sampler–trainer mismatch.                                               | No learned critic in the controlled comparison; group-centered REINFORCE.                                |
| [EasyPPO](https://arxiv.org/html/2609.36802v1)                     | Both       | Critic weighting · updates    | Uses $\omega_x\propto1/\max(\hat\sigma_x,\varepsilon)$, retains truncated samples for the critic, filters them for the actor, and uses smaller critic minibatches.                                                       | **Models:** Qwen3.5-9B-Base for math/search; Qwen3.5-9B after SFT for coding.<br><br>**Tasks:** DAPO-Math-17K → AIME24; [FrontierSmith → FrontierCS](tasks/#coding); [Search-R1](tasks/#agents).               | Learned token-value critic. DeepSeek-V3.1 supplies coding SFT trajectories.                              |
| [CoPE](https://arxiv.org/html/2610.20597v2)                        | Agent      | Auxiliary policy loss         | Adds successful-trajectory action forecasting to GRPO on a shared backbone. It changes supervision, without adding a value critic.                                                                                       | **Models:** Qwen2.5-7B-Instruct; Qwen2.5-14B-Instruct for AppWorld.<br><br>**Tasks:** [ALFWorld, ScienceWorld, WebShop, τ²-bench and AppWorld](tasks/#agents).                                                 | No value critic; acting and forecasting share one backbone.                                              |

</div>

AC2’s chunks divide a proof into segments, without external interaction.

<a class="essay-read" href="{{ '/blog/2026/revisiting-ppo/tasks/' | relative_url }}">See details on the tasks <span aria-hidden="true">→</span></a>
