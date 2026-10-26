---
layout: research-post
title: "Revisiting RL for LLM Post-Training - Algorithm"
description: "PPO and related policy-gradient methods for LLM post-training."
topic: Reinforcement learning · LLM post-training
date: 2026-10-14 00:00:00 -0400
permalink: /blog/2026/revisiting-ppo/
research_blog: true
series: revisiting-rl
series_order: 1
series_label: Algorithm
back_url: /blog/revisiting-rl/
back_label: Revisiting RL
math: true
sections:
  - { id: without-critic, title: Without value networks }
  - { id: critic-roles, title: What critics do }
  - { id: critic-inputs, title: What critics see }
  - { id: update-stability, title: Stable updates }
  - { id: comparison, title: Details }
---

This post reviews **PPO and related policy-gradient methods for large language models** from four perspectives.

For application-driven objectives, see [Applications in Continual Learning]({{ '/blog/2026/ppo-continual-learning/' | relative_url }}).

<span id="ppo-review"></span>
Need a refresher on PPO? [Start with the basics]({{ '/blog/2026/revisiting-ppo/foundations/' | relative_url }}).

<span id="literature"></span>
<span id="ppo-paper-map"></span>
<nav class="ppo-directions" aria-label="Four directions in policy optimization">
<a href="#without-critic"><span class="ppo-direction-number">01</span><span><strong>Learning without value networks</strong><small>FlashREINFORCE · SPO · CoPE</small></span><span aria-hidden="true">↗</span></a>
<a href="#critic-roles"><span class="ppo-direction-number">02</span><span><strong>Changing what critics do</strong><small>TEMPO · AC2</small></span><span aria-hidden="true">↗</span></a>
<a href="#critic-inputs"><span class="ppo-direction-number">03</span><span><strong>Changing what critics see</strong><small>BPCO · LVRL</small></span><span aria-hidden="true">↗</span></a>
<a href="#update-stability"><span class="ppo-direction-number">04</span><span><strong>Stabilizing policy updates</strong><small>SAO · Score Centering · EasyPPO · StableReinforce</small></span><span aria-hidden="true">↗</span></a>
</nav>

<span id="mechanisms"></span>

## Learning without value networks {#without-critic}

FlashREINFORCE and SPO use statistical baselines; CoPE adds action forecasting to GRPO. All three learn without a value network.

<figure class="ppo-family-figure" aria-label="Learning without value networks mechanism comparison">
<div class="ppo-variant-controls" role="group" aria-label="Choose a method" hidden><button type="button" data-variant="flash" aria-pressed="true" aria-controls="statistical-baselines-flash">FlashREINFORCE</button><button type="button" data-variant="spo" aria-pressed="false" aria-controls="statistical-baselines-spo">SPO</button><button type="button" data-variant="cope" aria-pressed="false" aria-controls="statistical-baselines-cope">CoPE</button></div>
<div class="ppo-variant-display" aria-live="polite"><div class="ppo-variant" id="statistical-baselines-flash" data-variant="flash"><div class="ppo-flow"><div class="ppo-flow-node"><span>Collect</span><strong>One rollout per prompt</strong><p>Independent completions form a batch.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Baseline</span><strong>Current batch mean</strong><p>Subtract the mean reward across prompts.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Policy update</strong><p>Filter divergent trajectories; average within each.</p></div></div><p class="ppo-flow-note"><strong>FlashREINFORCE.</strong> Each fresh batch supplies its baseline and receives one update.</p></div>
<div class="ppo-variant" id="statistical-baselines-spo" data-variant="spo"><div class="ppo-flow"><div class="ppo-flow-node"><span>Collect</span><strong>One new outcome</strong><p>Read the prompt’s existing tracker.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Baseline</span><strong>Per-prompt history</strong><p>Use the prior success-rate estimate.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn &amp; retain</span><strong>Policy + tracker updates</strong><p>Learn from the outcome and refresh prompt statistics.</p></div></div><p class="ppo-flow-note"><strong>SPO.</strong> Compute advantage before incorporating the new outcome.</p></div>
<div class="ppo-variant" id="statistical-baselines-cope" data-variant="cope">
<div class="ppo-cope-paths">
<div class="ppo-flow"><div class="ppo-flow-node"><span>All rollouts</span><strong>Group rewards</strong><p>Compare outcomes for the same task.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Acting</span><strong>GRPO loss</strong><p>Learn from relative rewards.</p></div></div>
<div class="ppo-flow"><div class="ppo-flow-node"><span>Successful rollouts</span><strong>Action sequences</strong><p>Use histories and the actions that followed.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Forecasting</span><strong>Auxiliary prediction loss</strong><p>Predict several subsequent actions.</p></div></div>
</div>
<div class="ppo-cope-merge"><span aria-hidden="true">↓</span><strong>Both losses update one shared policy backbone</strong></div>
<p class="ppo-flow-note">CoPE adds supervision to GRPO; it does not introduce a value critic.</p>
</div>
</div>
</figure>

### [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/#method) {#flashreinforce}

- **No learned critic:** For a batch of $B$ independent prompts, center the observed rewards:

  $$
  \bar R=\frac{1}{B}\sum_{j=1}^{B}R_j,
  \qquad A_i=R_i-\bar R.
  $$

  A response above the batch mean receives positive advantage; one below it receives negative advantage.

- **Trajectory filtering:** Weight token updates by current-to-rollout probability ratios. For each sampled token, let $p_t$ and $q_t$ be its rollout and current-policy probabilities at the same history:

  $$
  \begin{aligned}
  d_t &= p_t\log\frac{p_t}{q_t}+(1-p_t)\log\frac{1-p_t}{1-q_t},\\
  \bar D &= \frac{1}{T}\sum_{t=1}^{T}d_t,\qquad m=\mathbf{1}[\bar D\leq\delta].
  \end{aligned}
  $$

  Keep the whole trajectory only when $m=1$; $T$ counts model-generated tokens and $\delta$ is the threshold. This Bernoulli KL is a lower-bound proxy for full-vocabulary KL. [Details](https://yifanzhang-pro.github.io/FlashREINFORCE/FlashREINFORCE.pdf#page=4).

- **Equal trajectory weight:** For token losses $\ell_{i,t}$ that include advantage and importance weighting, aggregate as

  $$
  L=\frac{1}{B}\sum_{i=1}^{B}m_i
  \left(\frac{1}{T_i}\sum_{t=1}^{T_i}\ell_{i,t}\right).
  $$

  Here $m_i$ is the trajectory gate above. Averaging within each response removes its explicit length multiplier. Each fresh batch receives one update.

### [SPO](https://arxiv.org/html/2509.13232v2#S4) {#spo}

- **Persistent baseline:** For prompt $x$, compare reward $R$ with the tracker’s estimate before this rollout:

  $$
  A=R-\hat v_{\mathrm{old}}(x),
  \qquad
  \tilde A=\frac{A-\bar A_{\mathcal B}}{\sigma_{A,\mathcal B}}.
  $$

  The baseline uses past outcomes; normalization uses the current batch $\mathcal B$ across prompts.

- **Adaptive memory:** The Bayesian tracker has an equivalent moving-average update:

  $$
  \hat v_{\mathrm{new}}(x)=\hat v_{\mathrm{old}}(x)
  +\eta_x\bigl(R-\hat v_{\mathrm{old}}(x)\bigr).
  $$

  The step size $\eta_x$ reflects policy change and accumulated evidence. A larger policy shift discounts older evidence more strongly. The tracker also supports prioritized prompt sampling.

<span id="grpo-supervision"></span>

<span id="cope-learn-more-from-successful-trajectories"></span>

### [CoPE](https://arxiv.org/html/2610.20597v2) {#cope}

- **Forecast successful actions:** From history $h_t$, predict the recorded action chunk $a_{t:t+K}$. For the successful subset $\mathcal S_x$ of a rollout group:

  $$
  L_{\mathrm{AF},x}=
  -\frac{\displaystyle\sum_{\tau\in\mathcal S_x}\sum_t
  \log p_\theta(a_{t:t+K}\mid h_t)}
  {\max(1,|\mathcal S_x|)}.
  $$

  This averages supervision over successful trajectories; a group with no success contributes zero forecasting loss.

- **Shared policy backbone:** Minimize

  $$
  L=L_{\mathrm{GRPO}}+\eta\,\mathbb E_x[L_{\mathrm{AF},x}].
  $$

  The coefficient $\eta$ controls the extra supervision. Acting and forecasting use the same weights with different instructions; inference still takes one action at a time.

## Changing what critics do {#critic-roles}

Use value estimates when a verified outcome is unavailable or costly to obtain.

<figure class="ppo-family-figure" aria-label="critic roles mechanism comparison">
<div class="ppo-variant-controls" role="group" aria-label="Choose a method" hidden><button type="button" data-variant="tempo" aria-pressed="true" aria-controls="critic-roles-tempo">TEMPO</button><button type="button" data-variant="ac2" aria-pressed="false" aria-controls="critic-roles-ac2">AC2</button></div>
<div class="ppo-variant-display" aria-live="polite"><div class="ppo-variant" id="critic-roles-tempo" data-variant="tempo"><div class="ppo-flow"><div class="ppo-flow-node"><span>Generate</span><strong>Complete response</strong><p>The test question has no label.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Estimate</span><strong>Critic supplies reward</strong><p>Score the answer and its prefixes.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Adapt the policy</strong><p>Final score minus prefix value guides updates.</p></div></div><p class="ppo-flow-note"><strong>TEMPO.</strong> Periodically recalibrate the critic on labeled questions with verified rewards.</p></div>
<div class="ppo-variant" id="critic-roles-ac2" data-variant="ac2"><div class="ppo-flow"><div class="ppo-flow-node"><span>Generate</span><strong>Several short chunks</strong><p>Start from a stored trajectory prefix.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Estimate</span><strong>Critic supplies endpoint values</strong><p>Predict outcomes without finishing every response.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Compare continuations</strong><p>Center chunk values within their group.</p></div></div><p class="ppo-flow-note"><strong>AC2.</strong> Readiness checks permit short rollouts; full-rollout audits check the critic.</p></div>
</div>
</figure>

### [TEMPO](https://arxiv.org/html/2604.19295v1#S3) {#tempo}

- **Critic feedback at test time:** Let $s_t$ be a response prefix and $s_{\mathrm{end}}$ the complete answer. On an unlabeled question, use

  $$
  \hat R=V_\phi(s_{\mathrm{end}}),
  \qquad \hat A_t=\hat R-V_\phi(s_t).
  $$

  The actor learns from how much the predicted final score exceeds the prefix estimate. Both terms come from the critic; $\hat R$ is not a verified reward.

- **Periodic recalibration:** On labeled questions, obtain verified rewards $R$ from current-policy responses and fit the critic to them:

  $$
  L_{\mathrm{cal}}(\phi)
  =\mathbb E_{\mathrm{labeled},\,t}
  \left[(V_\phi(s_t)-R)^2\right].
  $$

  Alternate this supervised calibration with policy adaptation on unlabeled questions, keeping the critic tied to external feedback.

### [AC2](https://arxiv.org/html/2609.39247v2#S3) {#ac2}

- **Short continuations:** From replayed prefix $s$, sample chunks $c_i$. Once the problem passes critic-readiness checks, unfinished chunks can use predicted endpoint values:

  $$
  v_i=\begin{cases}
  R_i, & \text{complete response},\\
  V_\theta(s\cdot c_i), & \text{unfinished chunk}.
  \end{cases}
  $$

  The symbol $\cdot$ means concatenation. A trusted prediction can replace the cost of completing a response.

- **Chunk advantages:** Compare $G$ continuations of the same prefix:

  $$
  \bar v=\frac{1}{G}\sum_{j=1}^{G}v_j,
  \qquad \hat A_i=v_i-\bar v.
  $$

  All new tokens in chunk $c_i$ share $\hat A_i$. Train the shared generative critic at $s$ to output the rounded group mean $\bar v$ as a value token; replayed prefix tokens receive no actor loss.

- **Full-rollout audits:** Complete a fraction of ready problems to check critic predictions against actual outcomes.

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

- **Ground the critic:** With outcome-only rewards and no discounting, use

  $$
  R_{\min}\leq V_\phi(s_t)\leq R_{\max},
  \qquad L_V=\mathbb E[(V_\phi(s_t)-R)^2].
  $$

  Bound the value head and fit observed final rewards, avoiding targets built from the critic’s own predictions. Optional reference answers or rubrics enter only the critic.

- **Preserve the learning signal:** For a response of length $L$, use

  $$
  \lambda_\pi(L)=1-\frac{1}{\alpha L},
  \qquad \lambda_V=1.
  $$

  Here $\alpha>0$ controls GAE decay. Longer responses use slower decay, preserving distant outcome feedback. Keep raw GAE advantages instead of dividing by the batch standard deviation.

- **Divergence PPO:** If $p_t$ is the sampled token’s rollout probability, replace the fixed ratio-clipping interval with

  $$
  \left[1-\frac{\epsilon}{p_t},\;1+\frac{\epsilon}{p_t}\right].
  $$

  Its boundaries correspond to an absolute probability change of $\epsilon$. Clipping limits the incentive to move farther, rather than enforcing a hard constraint.

<span id="lvrl-redistribute-the-outcome-across-actions"></span>

### [LVRL](https://arxiv.org/html/2610.15840v1) {#lvrl}

- **Frozen LLM critic:** Read the completed trajectory, its outcome, and related rollouts to estimate intermediate values $\tilde V_t$. These are hindsight assessments, not prefix-only predictions; no critic training is needed.
- **Anchored credit:** For group mean reward $\bar R_G$ and trajectory reward $R$, fix the endpoints and take differences:

  $$
  \begin{aligned}
  \tilde V_0&=\bar R_G,\qquad \tilde V_T=R,\\
  \bar A_t&=\tilde V_{t+1}-\tilde V_t,\\
  \sum_{t=0}^{T-1}\bar A_t&=R-\bar R_G.
  \end{aligned}
  $$

  Actual outcomes fix the total credit; the LLM decides its distribution across actions. Divide $\bar A_t$ by the group-wide step standard deviation for training. All tokens in one action share its advantage; anchoring does not guarantee correct local attribution.

## Stabilizing policy updates {#update-stability}

Control errors from asynchronous sampling, mismatched probabilities, and noisy critic training.

<figure class="ppo-family-figure" aria-label="update stability mechanism comparison">
<div class="ppo-variant-controls" role="group" aria-label="Choose a method" hidden><button type="button" data-variant="sao" aria-pressed="true" aria-controls="update-stability-sao">SAO</button><button type="button" data-variant="centering" aria-pressed="false" aria-controls="update-stability-centering">Score Centering</button><button type="button" data-variant="easy" aria-pressed="false" aria-controls="update-stability-easy">EasyPPO</button><button type="button" data-variant="stable" aria-pressed="false" aria-controls="update-stability-stable">StableReinforce</button></div>
<div class="ppo-variant-display" aria-live="polite"><div class="ppo-variant" id="update-stability-sao" data-variant="sao"><div class="ppo-flow"><div class="ppo-flow-node"><span>Collect</span><strong>Asynchronous rollouts</strong><p>Behavior policies can lag behind the learner.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Correct</span><strong>Mask divergent tokens</strong><p>Use logged rollout probabilities.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Actor + critic</strong><p>Skip observations in GAE; update the critic faster.</p></div></div><p class="ppo-flow-note"><strong>SAO.</strong> Control policy lag while keeping a learned baseline for one-rollout sampling.</p></div>
<div class="ppo-variant" id="update-stability-centering" data-variant="centering"><div class="ppo-flow"><div class="ppo-flow-node"><span>Sample</span><strong>Sampler ≠ trainer</strong><p>Quantization or staleness changes probabilities.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Correct</span><strong>Center the score</strong><p>Subtract the sampler’s expected gradient.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>Actor update</strong><p>Remove the mismatch-induced drift term.</p></div></div><p class="ppo-flow-note"><strong>Score Centering.</strong> The correction acts on the log-probability gradient, not the reward.</p></div>
<div class="ppo-variant" id="update-stability-easy" data-variant="easy"><div class="ppo-flow"><div class="ppo-flow-node"><span>Collect</span><strong>Complete + truncated</strong><p>Keep both kinds for critic training.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Correct</span><strong>Balance critic gradients</strong><p>Weight return noise; clip smaller minibatches.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Learn</span><strong>PPO actor update</strong><p>Filter truncated responses from actor training.</p></div></div><p class="ppo-flow-note"><strong>EasyPPO.</strong> Retaining all critic outcomes preserves the baseline’s exposure to truncation.</p></div>
<div class="ppo-variant" id="update-stability-stable" data-variant="stable"><div class="ppo-flow"><div class="ppo-flow-node"><span>Sample</span><strong>Record stability info</strong><p>Keep each sequence’s sampling provenance.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node is-focus"><span>Update</span><strong>8-token score estimate</strong><p>Subtract a sampled mean score from the token’s score.</p></div><span class="ppo-flow-arrow" aria-hidden="true">→</span><div class="ppo-flow-node"><span>Constrain</span><strong>Sampler–learner KL</strong><p>Keep the learner close to the sampler.</p></div></div><p class="ppo-flow-note"><strong>StableReinforce.</strong> Score-centering mechanism inferred by Martin Marek; the full objective is not officially disclosed.</p></div>
</div>
</figure>

### [SAO](https://arxiv.org/html/2607.07508v1#S3) {#sao}

- **Single-rollout sampling:** Collect one trajectory per prompt asynchronously. A learned critic supplies the baseline, so training need not wait for sibling rollouts.
- **Token masking:** Let $\mu$ be the logged rollout policy and $\pi_\theta$ the learner:

  $$
  \begin{aligned}
  \rho_t&=\frac{\pi_\theta(a_t\mid s_t)}{\mu(a_t\mid s_t)},\\
  w_t&=\rho_t\,\mathbf 1[1-\epsilon_\ell<\rho_t<1+\epsilon_h].
  \end{aligned}
  $$

  Use $w_t$ to weight the token’s advantage-gradient contribution. Outside the interval its contribution is zero, regardless of advantage sign.

- **Skip-observation GAE:** Let $t^+$ index the next model-generated token, skipping intervening observation tokens:

  $$
  \begin{aligned}
  \delta_t&=r_t+\gamma V(s_{t^+})-V(s_t),\\
  \hat A_t&=\delta_t+\gamma\lambda\hat A_{t^+}.
  \end{aligned}
  $$

  The next state still includes tool feedback in its context. GAE simply does not recurse through each tool-output token; terminal continuation values are zero.

- **Critic updates:** Warm up the critic, freeze its attention layers, and update it twice per actor update to help it track the changing policy.

### [Score Centering](https://arxiv.org/html/2609.20807v1#S4) {#score-centering}

- **Why center the score?** At a fixed prefix $s$, let $p_a=\pi_\theta(a\mid s)$ be the learner, $q_a=\mu(a\mid s)$ the sampler, and $\psi_a=\nabla_\theta\log p_a$ the score. Write $A=\hat A(s,a)$ for the advantage, held fixed during the actor update. [Kunhao Zheng’s decomposition](https://x.com/KunhaoZ/status/2114328898989113847) makes the unwanted drift explicit:

  $$
  \mathbb E_q[A\psi]
  =\underbrace{\operatorname{Cov}_q(A,\psi)}_{\text{signal}}
  +\underbrace{\mathbb E_q[A]\,\mathbb E_q[\psi]}_{\text{drift}}.
  $$

  On-policy, $\mathbb E_p[\psi]=0$. When sampling and training distributions differ, that identity need not hold under $q$: even adding a constant to every advantage can change the expected update.

- **Remove that drift:** Subtract the sampler’s expected score:

  $$
  \begin{aligned}
  c(s)&=\sum_a q_a\psi_a,\\
  g_{\mathrm{SC}}(s)&=\mathbb E_q\!\left[A\bigl(\psi-c(s)\bigr)\right]
  =\operatorname{Cov}_q(A,\psi).
  \end{aligned}
  $$

  Centering advantages by their exact mean at this prefix would zero the first factor of the drift term; score centering zeros the second. A batch-wide zero mean does not guarantee a zero mean at every prefix. The remaining covariance is still under $q$, so this is not a complete off-policy correction.

- **Practical correction:** Store sampler probabilities for its top-$k$ tokens $H$ and approximate the remaining mass using the trainer’s distribution:

  $$
  \begin{aligned}
  \rho&=\frac{1-\sum_{a\in H}q_a}{1-\sum_{a\in H}p_a},\\
  \hat c(s)&=\sum_{a\in H}(q_a-\rho p_a)\psi_a.
  \end{aligned}
  $$

  This assigns unlogged tokens probability $\hat q_a=\rho p_a$ and uses $\sum_a p_a\psi_a=0$ to avoid summing over the tail. Hold the correction coefficients fixed when differentiating the loss. With importance weights, center $w_a\psi_a$ by subtracting $\mathbb E_{a\sim q}[w_a\psi_a]$ instead.

### [EasyPPO](https://arxiv.org/html/2609.36802v1#S3) {#easyppo}

- **Actor-only truncation filtering:** Let $C_i=1$ if response $i$ finishes within the length limit. Apply $C_i$ only to actor loss; keep every rollout in critic training. The critic then learns $\mathbb E[R\mid s]$, rather than $\mathbb E[R\mid s,C=1]$.
- **Noise-weighted critic loss:** Let $\hat\sigma_x$ be the return standard deviation across rollouts of prompt $x$:

  $$
  \begin{aligned}
  w_x&\propto\frac{1}{\max(\hat\sigma_x,\varepsilon)},\\
  L_V&=\mathbb E_{x,i,t}\!\left[w_x\bigl(V_\phi(s_{i,t})-R_i\bigr)^2\right].
  \end{aligned}
  $$

  High-variance prompts receive less weight, even when their mean reward is the same. This changes their influence on training, not their reward targets; $\varepsilon$ prevents division by zero.

- **Smaller critic minibatches:** Clip each minibatch gradient $g$ separately:

  $$
  g_{\mathrm{clip}}=g\min\!\left(1,\frac{c}{\lVert g\rVert}\right).
  $$

  The threshold $c$ limits gradient norm. Smaller minibatches restrict how many other samples an outlier can suppress through this shared rescaling. The actor retains the PPO objective.

### [StableReinforce](https://tinker-docs.thinkingmachines.ai/tinker/losses/stable-reinforce/) {#stable-reinforce}

[Martin Marek’s October 25 thread](https://x.com/mrtnm/status/2114145574987702525) identifies StableReinforce as **REINFORCE with Monte Carlo score centering**. His custom loss reproduces its gradients within numerical precision in a controlled probe. This is independent reverse-engineering evidence; Tinker has not published the full policy-gradient formula.

- **Estimate the mean score by sampling:** [Marek infers](https://x.com/mrtnm/status/2114145584739192907) eight auxiliary next-token draws at each prefix:

  $$
  \begin{aligned}
  u_k&\sim q(\cdot\mid s),\qquad K=8,\\
  \hat c(s)&=\frac1K\sum_{k=1}^{K}\nabla_\theta\log p_\theta(u_k\mid s),\\
  \hat g_{\mathrm{SC}}&=A\left[\nabla_\theta\log p_\theta(a\mid s)-\hat c(s)\right].
  \end{aligned}
  $$

  With independent sampler draws, $\hat c$ is an unbiased estimate of $c(s)$. This trades the original paper’s deterministic top-$k$ approximation for Monte Carlo noise; it does not make the whole update an unbiased on-policy gradient.

- **Why the gradient gives it away:** For logits $z$ and a one-hot token vector $e_a$, $\nabla_z\log p(a)=e_a-p$. Subtracting the sampled mean cancels the dense $-p$ term:

  $$
  \nabla_z\log p(a)-\frac1K\sum_k\nabla_z\log p(u_k)
  =e_a-\frac1K\sum_k e_{u_k}.
  $$

  Only the selected tokens remain. Marek observes this sparse pattern in StableReinforce, then matches gradients across all layers with a custom centered loss. The cancellation describes the policy-gradient term; a separate KL penalty can add a dense gradient.

<details class="ar-eval-notes" markdown="1">
<summary>How did he recover the gradients?</summary>

The probe uses **Qwen3.5-4B with rank-1 LoRA**. An Adam step with $\varepsilon=10{,}000$ makes the denominator nearly constant, so weight changes reveal the gradient up to a scale. The rank-1 output adapter then exposes the logit-gradient direction. In the single-token probe, StableReinforce moves only eight logit coordinates, with corrections in multiples of $1/8$; ordinary REINFORCE produces a dense gradient. [Probe setup](https://x.com/mrtnm/status/2114145580037623915) · [gradient match](https://x.com/mrtnm/status/2114145588031693048).

</details>

- **Official API and KL:** Tinker accepts caller-supplied advantages and records sampling information for stability. Its default, optional $k_1$ regularizer is

  $$
  L_{\mathrm{KL}}=\beta\sum_t\left[\log q(a_t\mid s_t)-\log p_\theta(a_t\mid s_t)\right].
  $$

  This estimates $\beta\,\mathrm{KL}(q\|p_\theta)$ at sampled prefixes, pulling the learner toward the sampler rather than a frozen reference model. The [documentation](https://tinker-docs.thinkingmachines.ai/tinker/losses/stable-reinforce/) also offers a $k_3$ estimator. Score centering changes the reward-weighted update; KL separately limits divergence.

<span id="models"></span>

## Details {#comparison}

**Agent:** FlashREINFORCE, SPO, LVRL, SAO, EasyPPO, CoPE.

**LLM:** FlashREINFORCE, TEMPO, AC2, BPCO, Score Centering, EasyPPO.

<div class="table-scroll ppo-literature-table" role="region" aria-label="PPO methods, experimental settings, models, critics and tasks" tabindex="0" markdown="1">

| Work                                                               | RL setting | Component                     | What changes                                                                                                                                                                                                             | Models & Tasks                                                                                                                                                                                                 | Critic / judge                                                                                           |
| :----------------------------------------------------------------- | :--------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/) | Both       | Rollouts · baseline           | Uses $R_i-\bar R_{\mathrm{batch}}$, sequence admission and per-trajectory averaging. No learned critic or $L_V$.                                                                                                         | **Models:** DeepSeek-R1-Distill-Qwen-1.5B; Qwen2.5-Math-1.5B; Qwen2.5-7B-Instruct; Qwen3-30B-A3B.<br><br>**Tasks:** [Math and Python tool use](tasks/#math); [ALFWorld](tasks/#agents).                        | No critic.                                                                                               |
| [SPO](https://arxiv.org/html/2509.13232v2)                         | Agent      | Baseline · sampling           | Uses a per-prompt, KL-adaptive value tracker and batch-wide advantage normalization.                                                                                                                                     | **Models:** Qwen3-8B.<br><br>**Tasks:** [DAPO math with Python → AIME24/25, BeyondAIME, BRUMO25 and HMMT25](tasks/#math).                                                                                      | No critic network; a tabular Bayesian tracker estimates success rates.                                   |
| [CoPE](https://arxiv.org/html/2610.20597v2)                        | Agent      | Auxiliary policy loss         | Adds successful-trajectory action forecasting to GRPO on a shared backbone. It changes supervision, without adding a value critic.                                                                                       | **Models:** Qwen2.5-7B-Instruct; Qwen2.5-14B-Instruct for AppWorld.<br><br>**Tasks:** [ALFWorld, ScienceWorld, WebShop, τ²-bench and AppWorld](tasks/#agents).                                                 | No value critic; acting and forecasting share one backbone.                                              |
| [TEMPO](https://arxiv.org/html/2604.19295v1)                       | LLM        | Value feedback                | Uses $V(y_{\mathrm{complete}})-V(s_t)$ on unlabeled questions, with periodic critic recalibration on labeled data.                                                                                                       | **Models:** Qwen3-8B/14B-Base; OLMO3-7B-Base, after PPO initialization.<br><br>**Tasks:** [Math and general reasoning](tasks/#math), with unlabeled adaptation sets and separate held-out sets.                | Learned critic; GPT-OSS-120B judges general-domain answers.                                              |
| [AC2](https://arxiv.org/html/2609.39247v2)                         | LLM        | Chunk values · advantages     | Uses $v_i-\bar v$ and critic target $\bar v$. For critic-ready problems, unfinished chunks receive $v_i=V(s\cdot c_i)$.                                                                                                  | **Models:** Qwen3-4B-Thinking-2507.<br><br>**Tasks:** [FineProofs-RL → IMO-ProofBench](tasks/#proofs).                                                                                                         | Actor and generative critic share weights; DeepSeek-V4-Flash grades proofs.                              |
| [BPCO](https://arxiv.org/html/2608.23566v2)                        | LLM        | Critic · GAE · clipping       | Bounds values to the reward range, uses $Y_t=R$, preserves raw advantages, and adapts $\lambda_\pi$ to length. Optional privileged critic inputs; Divergence PPO clipping.                                               | **Models:** DeepSeek-R1-Distill-Qwen-1.5B; Qwen3-30B-A3B Base/non-Base; Qwen3-4B-Base for rubrics.<br><br>**Tasks:** [Math](tasks/#math): DeepScaleR or DAPO-Math-17K → AIME25; [OpenRubrics](tasks/#rubrics). | Learned critic; optional answer/rubric inputs. Qwen3-4B-Instruct-2507 is the rubric judge.               |
| [LVRL](https://arxiv.org/html/2610.15840v1)                        | Agent      | Value estimates · step credit | A frozen LLM uses trajectory and group context to estimate values. Anchored value differences give action-level advantages; no critic optimization.                                                                      | **Models:** Qwen3-4B/8B for AppWorld and BabyAI; Qwen3-8B/32B for repository tasks.<br><br>**Tasks:** [AppWorld, BabyAI](tasks/#agents); [R2E-Gym → SWE-bench Verified](tasks/#coding).                        | Frozen Claude Opus 4.6 value critic. LVOPD uses Qwen3-235B-A22B-Thinking-2507-FP8 as teacher and critic. |
| [SAO](https://arxiv.org/html/2607.07508v1)                         | Agent      | Rollouts · GAE · updates      | One rollout per prompt, asynchronous collection, skip-observation GAE, strict token masking, and more frequent critic updates.                                                                                           | **Models:** Qwen3-30B-A3B-Thinking-2507; TIR-finetuned initialization for math.<br><br>**Tasks:** [Math with Python](tasks/#math); [SWE-bench Verified](tasks/#coding) with OpenHands.                         | Separate value model initialized from the policy checkpoint.                                             |
| [Score Centering](https://arxiv.org/html/2609.20807v1)             | LLM        | Actor gradient                | Centers the weighted score: $w\psi_\theta-c(s)$, where $w$ is the importance weight, $\psi_\theta=\nabla\log\pi_\theta$ and $c(s)=\mathbb E_{a\sim\mu}[w\psi_\theta]$. Addresses drift from training–inference mismatch. | **Models:** Qwen3-0.6B-Instruct; Qwen3-30B-A3B-Base.<br><br>**Tasks:** [Countdown and INTELLECT-2 math](tasks/#math), under controlled sampler–trainer mismatch.                                               | No learned critic in the controlled comparison; group-centered REINFORCE.                                |
| [EasyPPO](https://arxiv.org/html/2609.36802v1)                     | Both       | Critic weighting · updates    | Uses $\omega_x\propto1/\max(\hat\sigma_x,\varepsilon)$, retains truncated samples for the critic, filters them for the actor, and uses smaller critic minibatches.                                                       | **Models:** Qwen3.5-9B-Base for math/search; Qwen3.5-9B after SFT for coding.<br><br>**Tasks:** DAPO-Math-17K → AIME24; [FrontierSmith → FrontierCS](tasks/#coding); [Search-R1](tasks/#agents).               | Learned token-value critic. DeepSeek-V3.1 supplies coding SFT trajectories.                              |
| [StableReinforce](https://tinker-docs.thinkingmachines.ai/tinker/losses/stable-reinforce/) | Not specified | Update stability | Marek’s probe matches REINFORCE with 8-token Monte Carlo score centering; optional sampler–learner KL. Full objective not officially disclosed. | **Probe:** Qwen3.5-4B, rank-1 LoRA; gradient matching, not a task benchmark.<br><br>**Official experiments:** Models and tasks not specified. | Advantages supplied by caller. |

</div>

AC2’s chunks divide a proof into segments, without external interaction.

<a class="essay-read" href="{{ '/blog/2026/revisiting-ppo/tasks/' | relative_url }}">See details on the tasks <span aria-hidden="true">→</span></a>
