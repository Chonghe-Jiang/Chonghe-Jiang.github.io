---
layout: research-post
title: "Revisiting RL for LLM Post-Training - Applications in Continual Learning"
description: "Reducing forgetting during updates. Improving adaptation from experience."
topic: Reinforcement learning · Continual learning
date: 2026-10-26 00:00:00 -0400
permalink: /blog/2026/ppo-continual-learning/
research_blog: true
series: revisiting-rl
series_order: 2
series_label: Applications in Continual Learning
back_url: /blog/revisiting-rl/
back_label: Revisiting RL
math: true
sections:
  - { id: learning-across-windows, title: Learning across windows }
  - { id: reducing-forgetting, title: Reducing forgetting }
  - { id: improving-adaptation, title: Improving adaptation }
---

Learning a new task should preserve useful skills. Experience on an unfamiliar task should make the next attempt better. RL can address both goals, but they require different training signals.

This companion to [Sample-Efficient Algorithms]({{ '/blog/2026/revisiting-ppo/' | relative_url }}) follows those two goals through policy optimization and RL-based self-adaptation.

<nav class="ppo-directions" aria-label="Two goals for continual learning">
<a href="#reducing-forgetting"><span class="ppo-direction-number">01</span><span><strong>Reducing Forgetting</strong><small>CPO · TSRL</small></span><span aria-hidden="true">↗</span></a>
<a href="#improving-adaptation"><span class="ppo-direction-number">02</span><span><strong>Improving Adaptation</strong><small>ORBIT · LaMer · SEAL</small></span><span aria-hidden="true">↗</span></a>
</nav>

## Learning Across Windows {#learning-across-windows}

Suppose tasks arrive in windows $W_1, W_2, \ldots$. Each window brings prompts and a way to score responses. We can train on one window, pool the windows seen so far, or keep updating the same model as each window arrives.

<figure class="cl-window-figure" aria-labelledby="cl-window-title">
<div class="cl-window-heading"><strong id="cl-window-title">Same data stream. Three training setups.</strong><span>Move through the arriving windows</span></div>
<div class="cl-window-controls" role="group" aria-label="Choose the latest available window" hidden>
<button type="button" data-stage="1" aria-pressed="false" aria-controls="cl-window-comparison">Window 1</button>
<button type="button" data-stage="2" aria-pressed="false" aria-controls="cl-window-comparison">Window 2</button>
<button type="button" data-stage="3" aria-pressed="true" aria-controls="cl-window-comparison">Window 3</button>
<button type="button" data-stage="4" aria-pressed="false" aria-controls="cl-window-comparison">Window 4</button>
</div>
<div id="cl-window-comparison" aria-live="polite" aria-atomic="true">
<p class="cl-window-status">Windows 1–3 have arrived; window 4 is still ahead.</p>
<div class="cl-window-row" data-mode="single">
<div class="cl-window-label"><span>01</span><div><strong>Single-window RL</strong><p>Train on the current window only.</p></div></div>
<div class="cl-window-data" aria-label="Data used at this stage">
<div class="cl-window-chip is-past" data-window="1"><strong>W<sub>1</sub></strong><span>Not used now</span></div>
<div class="cl-window-chip is-past" data-window="2"><strong>W<sub>2</sub></strong><span>Not used now</span></div>
<div class="cl-window-chip is-used" data-window="3"><strong>W<sub>3</sub></strong><span>Used now</span></div>
<div class="cl-window-chip is-future" data-window="4"><strong>W<sub>4</sub></strong><span>Not yet available</span></div>
</div>
<div class="cl-window-path"><span data-start>Same initial model θ₀</span><span aria-hidden="true">→</span><strong data-train>RL on W₃</strong><span aria-hidden="true">→</span><span data-result>Independent model</span></div>
<p class="cl-window-note" data-note>No earlier window contributes to this training run.</p>
</div>
<div class="cl-window-row" data-mode="joint">
<div class="cl-window-label"><span>02</span><div><strong>Joint RL</strong><p>Pool all windows available so far.</p></div></div>
<div class="cl-window-data" aria-label="Data used at this stage">
<div class="cl-window-chip is-used" data-window="1"><strong>W<sub>1</sub></strong><span>Used now</span></div>
<div class="cl-window-chip is-used" data-window="2"><strong>W<sub>2</sub></strong><span>Used now</span></div>
<div class="cl-window-chip is-used" data-window="3"><strong>W<sub>3</sub></strong><span>Used now</span></div>
<div class="cl-window-chip is-future" data-window="4"><strong>W<sub>4</sub></strong><span>Not yet available</span></div>
</div>
<div class="cl-window-path"><span data-start>Same initial model θ₀</span><span aria-hidden="true">→</span><strong data-train>RL on W₁ ∪ W₂ ∪ W₃</strong><span aria-hidden="true">→</span><span data-result>Joint model</span></div>
<p class="cl-window-note" data-note>Earlier prompts remain available for sampling.</p>
</div>
<div class="cl-window-row" data-mode="continual">
<div class="cl-window-label"><span>03</span><div><strong>Continual RL</strong><p>Continue training as each window arrives.</p></div></div>
<div class="cl-window-data" aria-label="Data used at this stage">
<div class="cl-window-chip is-past" data-window="1"><strong>W<sub>1</sub></strong><span>Not used now</span></div>
<div class="cl-window-chip is-past" data-window="2"><strong>W<sub>2</sub></strong><span>Not used now</span></div>
<div class="cl-window-chip is-used" data-window="3"><strong>W<sub>3</sub></strong><span>Used now</span></div>
<div class="cl-window-chip is-future" data-window="4"><strong>W<sub>4</sub></strong><span>Not yet available</span></div>
</div>
<div class="cl-window-path"><span data-start>Previous model θ₂</span><span aria-hidden="true">→</span><strong data-train>RL on W₃</strong><span aria-hidden="true">→</span><span data-result>Updated model θ₃</span></div>
<p class="cl-window-note" data-note>Earlier learning survives through the weights; old-task performance can fall.</p>
</div>
</div>
<figcaption>Highlighted windows supply prompts for the current RL stage; responses are generated by the training policy. Single-window and joint runs start from the same initial model here. Continual RL carries weights forward. Replay can give it access to selected earlier prompts.</figcaption>
</figure>

The continual setup creates the retention question: **after learning $W_t$, how well does the model still perform on $W_1, \ldots, W_{t-1}$?** Joint training keeps earlier prompts in the training pool, at the cost of retaining and revisiting that data. Neither setup guarantees that tasks will not interfere. A window here is a slice of arriving tasks or data, not a PPO minibatch.

## Reducing Forgetting {#reducing-forgetting}

A policy learns tasks in sequence. Each stage supplies new rewards, while earlier skills must survive the updates. The training objective needs to account for both acquisition and retention:

$$
\text{new-task return}\; -\;\lambda\,\text{loss of earlier capabilities}.
$$

CPO approximates the retention term through a parameter constraint. TSRL controls where expert supervision enters RL training.

<figure class="ppo-family-figure" aria-label="RL methods for reducing forgetting">
<div class="ppo-variant-controls" role="group" aria-label="Choose a method" hidden>
<button type="button" data-variant="cpo" aria-pressed="true" aria-controls="cl-cpo">CPO</button>
<button type="button" data-variant="tsrl" aria-pressed="false" aria-controls="cl-tsrl">TSRL</button>
</div>
<div class="ppo-variant-display" aria-live="polite">
<div class="ppo-variant" id="cl-cpo" data-variant="cpo"><div class="ppo-flow">
<div class="ppo-flow-node"><span>Retain</span><strong>Parameter mask</strong><p>Remember coordinates that moved on earlier tasks.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node is-focus"><span>Constrain</span><strong>Protected updates</strong><p>Penalize movement on the accumulated mask.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node"><span>Learn</span><strong>New task</strong><p>Optimize GSPO with the retention penalty.</p></div>
</div><p class="ppo-flow-note">Protect selected parameters while learning the next task.</p></div>
<div class="ppo-variant" id="cl-tsrl" data-variant="tsrl"><div class="ppo-flow">
<div class="ppo-flow-node"><span>Sample</span><strong>Current-policy attempts</strong><p>Measure the group’s success rate.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node is-focus"><span>Trigger</span><strong>Expert help</strong><p>Add supervision only on difficult states.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node"><span>Learn</span><strong>RL + gated SFT</strong><p>Reduce the supervision weight over training.</p></div>
</div><p class="ppo-flow-note">Use expert guidance where exploration is failing.</p></div>
</div>
</figure>

### [CPO: constrain changes that threaten earlier skills](https://arxiv.org/html/2607.04364v3#S3) {#cpo}

A KL penalty on current-task prompts does not directly constrain behavior on old tasks. **CPO starts from behavioral KL on the historical task distribution**, then approximates it without replaying old data.

After each task, it adds the parameter coordinates with the largest changes to a protected set $S$. On the next task, it minimizes

$$
L(\theta)=L_{\mathrm{GSPO}}(\theta)
+\frac{\lambda}{|S|}\sum_{j\in S}|\theta_j-\theta_j^{\mathrm{prev}}|.
$$

The penalty is omitted when $S$ is empty. Parameter movement serves as a proxy for sensitivity; the mask accumulates across tasks. This changes the update constraint, while task rewards remain the learning signal.

**Evidence:** sequential multimodal tasks with Qwen3-VL. Its results show why retention must be measured on earlier tasks, rather than inferred from a small KL on new data.

### [TSRL: ask for supervision when exploration fails](https://arxiv.org/html/2610.17726v1#S4) {#tsrl}

Sparse rewards can leave an agent stuck. TSRL combines group-based RL with **expert supervision triggered by a low group success rate** $q(s)$:

$$
\begin{aligned}
L(\theta)&=L_{\mathrm{RL}}(\theta)+\alpha_t L_{\mathrm{help}}(\theta),\\
L_{\mathrm{help}}&=\mathbb E_s\!\left[
\mathbf 1[q(s)\leq\delta]\,\bigl(-\log\pi_\theta(a_E\mid s)\bigr)\right].
\end{aligned}
$$

Here $a_E$ is an expert action. The default threshold $\delta=0$ activates help when the whole group fails; $\alpha_t$ decreases over training. The method uses GRPO or DAPO underneath.

**Evidence:** agent-task transfer and retention of math ability after search training. Selective supervision improves the acquisition–retention trade-off in these settings; it does not imply that RL alone prevents forgetting.

## Improving Adaptation {#improving-adaptation}

RL can also train a model to make better use of experience. Early attempts supply information; later attempts reveal whether the policy used it well. The training signal therefore reaches beyond the current answer.

ORBIT and LaMer learn to adapt through context. SEAL learns to produce effective weight updates. These are adaptation mechanisms, not guarantees of long-term retention.

<figure class="ppo-family-figure" aria-label="RL methods for improving adaptation">
<div class="ppo-variant-controls" role="group" aria-label="Choose a method" hidden>
<button type="button" data-variant="orbit" aria-pressed="true" aria-controls="cl-orbit">ORBIT</button>
<button type="button" data-variant="lamer" aria-pressed="false" aria-controls="cl-lamer">LaMer</button>
<button type="button" data-variant="seal" aria-pressed="false" aria-controls="cl-seal">SEAL</button>
</div>
<div class="ppo-variant-display" aria-live="polite">
<div class="ppo-variant" id="cl-orbit" data-variant="orbit"><div class="ppo-flow">
<div class="ppo-flow-node"><span>Explore</span><strong>Attempt 1</strong><p>Interact with an unfamiliar environment.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node is-focus"><span>Remember</span><strong>Feedback in context</strong><p>Carry observations into the next attempt.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node"><span>Adapt</span><strong>Attempts 2–3</strong><p>Train on the total successes across the trial.</p></div>
</div><p class="ppo-flow-note">GRPO compares whole trials. At deployment, experience changes context; weights stay fixed.</p></div>
<div class="ppo-variant" id="cl-lamer" data-variant="lamer"><div class="ppo-flow">
<div class="ppo-flow-node"><span>Explore</span><strong>One episode</strong><p>Collect actions, observations and outcomes.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node is-focus"><span>Reflect</span><strong>A learned reflection</strong><p>Write guidance for the next attempt.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node"><span>Adapt</span><strong>Later episodes</strong><p>Their rewards train earlier actions and reflections.</p></div>
</div><p class="ppo-flow-note">GiGPO trains a policy whose credit assignment crosses episode boundaries.</p></div>
<div class="ppo-variant" id="cl-seal" data-variant="seal"><div class="ppo-flow">
<div class="ppo-flow-node"><span>Propose</span><strong>A self-edit</strong><p>Generate training data or update instructions.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node is-focus"><span>Apply</span><strong>Inner fine-tuning</strong><p>Update model weights using the proposed edit.</p></div>
<span class="ppo-flow-arrow" aria-hidden="true">→</span>
<div class="ppo-flow-node"><span>Assess</span><strong>Adapted model</strong><p>Use downstream results to select useful edits.</p></div>
</div><p class="ppo-flow-note">ReSTᵉᵐ trains self-edit generation. Adaptation itself updates weights.</p></div>
</div>
</figure>

### [ORBIT: reward a whole learning trial](https://arxiv.org/html/2602.04089v1#S3) {#orbit}

A trial contains repeated attempts at the same environment instance. Each episode conditions on the previous interaction history $H_{k-1}$:

$$
\tau_k\sim\pi_\theta(\cdot\mid H_{k-1}),
\qquad R_{\mathrm{trial}}=\sum_{k=1}^{K}R(\tau_k).
$$

**GRPO compares complete trials**, using their total successful completions. Early exploration can receive credit through later success. At deployment, weights stay fixed while the context grows.

**Evidence:** three-episode trials, with evaluation on Maze and Mastermind, task families absent from training. The useful measurement is the performance curve across attempts, alongside a single-episode RL baseline.

### [LaMer: train reflection with later rewards](https://arxiv.org/html/2512.16848v2#S4) {#lamer}

LaMer explicitly generates a reflection between episodes and trains it using the next episode’s reward. Action credit also extends across episodes. At the episode level, its discounted return has the form

$$
G_k=R_k+\gamma_{\mathrm{traj}}R_{k+1}
+\gamma_{\mathrm{traj}}^2R_{k+2}+\cdots.
$$

The cross-episode discount controls how strongly later outcomes influence earlier decisions. **GiGPO is the default optimizer**; history and reflections provide the adaptation state without test-time weight updates.

**Evidence:** Sokoban, Minesweeper and WebShop, plus ALFWorld transfer. Its matched sampling comparison uses eight three-episode trials versus 24 independent episodes. This helps separate learning from feedback from simply generating more attempts.

### [SEAL: reward an update by what it teaches](https://arxiv.org/html/2506.10943v1#S3) {#seal}

SEAL makes a self-edit $e$ the action: synthetic training data or instructions for fine-tuning. It applies the edit, evaluates the adapted model, and uses that outcome to train the edit generator:

$$
e\sim\pi_\theta(\cdot\mid D_{\mathrm{new}}),
\qquad \theta'_e=\operatorname{SFT}(\theta,e).
$$

**The reward comes from downstream performance after adaptation.** ReST$^{\mathrm{EM}}$ samples edits, selects successful or best-performing ones according to the task protocol, and fine-tunes on those edits. This is reward-selected self-training, rather than a PPO clipped update.

**Evidence:** knowledge incorporation and few-shot ARC tasks. SEAL demonstrates learned parameter adaptation, while its repeated-update experiments still exhibit forgetting.

For continual learning, I would want both: an adaptation curve that improves with experience, and a retention curve that stays strong as tasks accumulate. Better performance after three attempts does not establish retention across a long task stream.

<a class="essay-read" href="{{ '/blog/2026/ppo-continual-learning/models-and-tasks/' | relative_url }}">Models &amp; Tasks <span aria-hidden="true">→</span></a>
