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
  - { id: models, title: Models & Tasks }
---

This post reviews **PPO and related policy-gradient methods for large language models**.

<span id="ppo-review"></span>
Need a refresher on PPO? [Start with the basics]({{ '/blog/2026/revisiting-ppo/foundations/' | relative_url }}).

## Review of Recent Work {#literature}

<figure class="ppo-map" id="ppo-paper-map" aria-labelledby="ppo-map-title">
<div class="ppo-map-heading"><span class="note-label">From rollout to update</span><h3 id="ppo-map-title">Where recent papers change PPO</h3></div>
<ol class="ppo-stages">
<li class="ppo-stage" data-stage="1"><div class="ppo-stage-top"><span class="ppo-stage-number">01</span></div><strong>Rollouts</strong><p>Generate trajectories</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2607.07508" data-paper="sao">SAO</a><a href="https://yifanzhang-pro.github.io/FlashREINFORCE/" data-paper="flash">FlashREINFORCE</a></div></li>
<li class="ppo-stage" data-stage="2"><div class="ppo-stage-top"><span class="ppo-stage-number">02</span></div><strong>Reward & value</strong><p>Evaluate outcomes and prefixes</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2604.19295" data-paper="tempo">TEMPO</a><a href="https://arxiv.org/abs/2609.39247" data-paper="ac2">AC2</a><a href="https://arxiv.org/abs/2608.23566" data-paper="bpco">BPCO</a><a href="https://arxiv.org/abs/2610.15840" data-paper="lvrl">LVRL</a></div></li>
<li class="ppo-stage" data-stage="3"><div class="ppo-stage-top"><span class="ppo-stage-number">03</span></div><strong>Advantages</strong><p>Assign credit relative to a baseline</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2607.07508" data-paper="sao">SAO</a><a href="https://arxiv.org/abs/2609.39247" data-paper="ac2">AC2</a><a href="https://yifanzhang-pro.github.io/FlashREINFORCE/" data-paper="flash">FlashREINFORCE</a><a href="https://arxiv.org/abs/2608.23566" data-paper="bpco">BPCO</a><a href="https://arxiv.org/abs/2610.15840" data-paper="lvrl">LVRL</a></div></li>
<li class="ppo-stage" data-stage="4"><div class="ppo-stage-top"><span class="ppo-stage-number">04</span></div><strong>Policy objective</strong><p>Correct probabilities and limit updates</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2609.20807" data-paper="centering">Score Centering</a><a href="https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md" data-paper="decoupled">Decoupled PPO</a><a href="https://arxiv.org/abs/2608.23566" data-paper="bpco">BPCO</a></div></li>
<li class="ppo-stage" data-stage="5"><div class="ppo-stage-top"><span class="ppo-stage-number">05</span></div><strong>Updates</strong><p>Optimize actor and critic</p><div class="ppo-stage-papers"><a href="https://arxiv.org/abs/2609.36802" data-paper="easy">EasyPPO</a><a href="https://arxiv.org/abs/2607.07508" data-paper="sao">SAO</a><a href="https://arxiv.org/abs/2604.19295" data-paper="tempo">TEMPO</a><a href="https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md" data-paper="decoupled">Decoupled PPO</a><a href="https://arxiv.org/abs/2608.23566" data-paper="bpco">BPCO</a><a href="https://arxiv.org/abs/2610.20597" data-paper="cope">CoPE</a></div></li>
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
<button type="button" data-paper="bpco" data-stages="2 3 4 5" data-detail="Bounded value predictions, Monte Carlo targets, raw advantages, length-adaptive GAE, and Divergence PPO clipping." data-url="https://arxiv.org/abs/2608.23566" aria-pressed="false">BPCO</button>
<button type="button" data-paper="lvrl" data-stages="2 3" data-detail="A frozen LLM assigns step credit through anchored hindsight value differences, conditioned on group context." data-url="https://arxiv.org/abs/2610.15840" aria-pressed="false">LVRL</button>
<button type="button" data-paper="cope" data-stages="5" data-detail="Add successful-trajectory action forecasting to GRPO using the policy backbone; no learned value critic." data-url="https://arxiv.org/abs/2610.20597" aria-pressed="false">CoPE</button>
</div>
<div class="ppo-paper-detail" aria-live="polite" aria-atomic="true"><span class="ppo-detail-name">Explore the loop</span><p>Select a paper to highlight the stages it changes.</p><a hidden>Read the paper ↗</a></div>
</div>
<figcaption>Select a paper to locate its changes. FlashREINFORCE and CoPE use critic-free updates; LVRL uses a frozen critic.</figcaption>
</figure>

### Where the papers intervene

Reward centering changes the advantage. Score centering changes the log-probability gradient; below, $w$ denotes its importance weight. A frozen LLM can replace learned value estimates, while an auxiliary prediction loss can add supervision without estimating values at all.

**Single-turn** generates a response without tool or environment feedback during the rollout. **Agentic** alternates actions with that feedback; **Both** covers both settings. These labels describe the experiments reviewed here.

<div class="table-scroll ppo-literature-table" role="region" aria-label="Papers mapped to PPO components" tabindex="0" markdown="1">

| Work                                                                                                  | RL setting   | Component                     | What changes                                                                                                                                                                              |
| :---------------------------------------------------------------------------------------------------- | :----------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SAO](https://arxiv.org/html/2607.07508v1)                                                            | Agentic      | Rollouts · GAE · updates      | One rollout per prompt, asynchronous collection, skip-observation GAE, strict token masking, and more frequent critic updates.                                                            |
| [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/)                                    | Both         | Rollouts · baseline           | Uses $R_i-\bar R_{\mathrm{batch}}$, sequence admission and per-trajectory averaging. No learned critic or $L_V$.                                                                          |
| [TEMPO](https://arxiv.org/html/2604.19295v1)                                                          | Single-turn  | Value feedback                | Uses $V(y_{\mathrm{complete}})-V(s_t)$ on unlabeled questions, with periodic critic recalibration on labeled data.                                                                        |
| [AC2](https://arxiv.org/html/2609.39247v2)                                                            | Single-turn  | Chunk values · advantages     | Uses $v_i-\bar v$ and critic target $\bar v$. For critic-ready problems, unfinished chunks receive $v_i=V(s\cdot c_i)$.                                                                   |
| [Score Centering](https://arxiv.org/html/2609.20807v1)                                                | Single-turn  | Actor gradient                | Centers the weighted score: $w\psi_\theta-c(s)$, with $\psi_\theta=\nabla\log\pi_\theta$ and $c(s)=\mathbb E_{a\sim\mu}[w\psi_\theta]$. Addresses drift from training–inference mismatch. |
| [Decoupled PPO](https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md) | Single-turn¹ | Probability ratios            | Separates behavior correction $\nu/\mu$ from clipping around $\pi_\theta/\nu$, where $\nu$ is a recent proximal policy.                                                                   |
| [EasyPPO](https://arxiv.org/html/2609.36802v1)                                                        | Both         | Critic weighting · updates    | Uses $\omega_x\propto1/\max(\hat\sigma_x,\varepsilon)$, retains truncated samples for the critic, filters them for the actor, and uses smaller critic minibatches.                        |
| [BPCO](https://arxiv.org/html/2608.23566v2)                                                           | Single-turn  | Critic · GAE · clipping       | Bounds values to the reward range, uses $Y_t=R$, preserves raw advantages, and adapts $\lambda_\pi$ to length. Optional privileged critic inputs; Divergence PPO clipping.                |
| [LVRL](https://arxiv.org/html/2610.15840v1)                                                           | Agentic      | Value estimates · step credit | A frozen LLM uses trajectory and group context to estimate values. Anchored value differences give action-level advantages; no critic optimization.                                       |
| [CoPE](https://arxiv.org/html/2610.20597v2)                                                           | Agentic      | Auxiliary policy loss         | Adds successful-trajectory action forecasting to GRPO on a shared backbone. It changes supervision, without adding a value critic.                                                        |

</div>

¹ Decoupled PPO refers to the linked GSM8K example. AC2’s chunks divide a proof into segments, without external interaction.

### BPCO: change what the critic learns

[BPCO](https://arxiv.org/abs/2608.23566) separates the actor’s bootstrapping from the critic’s target: $\lambda_V=1$ keeps the target tied to the observed reward, while $\lambda_\pi(L)=1-1/(\alpha L)$ adapts credit propagation to response length. Its bounded head prevents impossible return predictions. An optional reference answer or rubric helps the critic during training without entering the policy’s prompt. Its **Divergence PPO** uses a token-probability-dependent clipping range; this is distinct from **Decoupled PPO** above.

### LVRL: redistribute the outcome across actions

[LLM Value Functions for Credit Assignment in Agentic RL](https://arxiv.org/abs/2610.15840) uses a frozen LLM to read completed trajectories, with other rollouts providing policy context. At the environment-action level, it anchors $\tilde V_0=\bar R_G$ and $\tilde V_T=R$, then computes

$$
\bar A_t=\tilde V_{t+1}-\tilde V_t,
\qquad
\sum_{t=0}^{T-1}\bar A_t=R-\bar R_G.
$$

It divides these differences by their group-wide step standard deviation; every token in an action shares that action’s advantage. The unnormalized sum is fixed by outcomes, but the LLM determines where credit goes. These are hindsight estimates, not an ordinary prefix-only value function. Anchoring preserves the total signal; it does not guarantee correct local credit.

### CoPE: learn more from successful trajectories

[CoPE](https://arxiv.org/abs/2610.20597) keeps GRPO and adds a forecasting loss. From history $h_t$, the shared backbone predicts the next $K+1$ actions recorded in a successful rollout:

$$
L_{\mathrm{AF}}
=-\mathbb E_{\tau\mid\mathrm{success}}
\left[\sum_t\log p_\theta(a_{t:t+K}\mid h_t)\right].
$$

Training minimizes $L_{\mathrm{GRPO}}+\eta L_{\mathrm{AF}}$, averaging the forecasting term over successful rollouts within each group. A forecasting instruction distinguishes $p_\theta$ from the acting distribution, even though they share parameters. At inference, the agent still acts one step at a time. The added signal teaches which action sequences followed successful histories, rather than how much scalar value each history had.

## Models & Tasks {#models}

The experiments range from answer-only reasoning to agents that use tools over many turns. The table separates the model being trained from models that supply values or grades.

<div class="ar-study-table-wrap ppo-model-table" role="region" aria-label="LLM models, critics and tasks by method" tabindex="0" markdown="1">

| Method                                                                                                                             | Trained models                                                                         | Critic / judge                                                                                           | Tasks                                                                                                 |
| :--------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| [SAO](https://arxiv.org/html/2607.07508v1#S4.SS1)                                                                                  | Qwen3-30B-A3B-Thinking-2507; TIR-finetuned initialization for math.                    | Separate value model initialized from the policy checkpoint.                                             | [Math with Python](tasks/#math); [SWE-bench Verified](tasks/#coding) with OpenHands.                  |
| [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/)                                                                 | DeepSeek-R1-Distill-Qwen-1.5B; Qwen2.5-Math-1.5B; Qwen2.5-7B-Instruct; Qwen3-30B-A3B.  | No critic.                                                                                               | [Math and Python tool use](tasks/#math); [ALFWorld](tasks/#agents).                                   |
| [EasyPPO](https://arxiv.org/html/2609.36802v1#S5)                                                                                  | Qwen3.5-9B-Base for math/search; Qwen3.5-9B after SFT for coding.                      | Learned token-value critic. DeepSeek-V3.1 supplies coding SFT trajectories.                              | DAPO-Math-17K → AIME24; [FrontierSmith → FrontierCS](tasks/#coding); [Search-R1](tasks/#agents).      |
| [TEMPO](https://arxiv.org/html/2604.19295v1#S4.SS1)                                                                                | Qwen3-8B/14B-Base; OLMO3-7B-Base, after PPO initialization.                            | Learned critic; GPT-OSS-120B judges general-domain answers.                                              | [Math and general reasoning](tasks/#math), with unlabeled adaptation sets and separate held-out sets. |
| [AC2](https://arxiv.org/html/2609.39247v2#S4)                                                                                      | Qwen3-4B-Thinking-2507.                                                                | Actor and generative critic share weights; DeepSeek-V4-Flash grades proofs.                              | [FineProofs-RL → IMO-ProofBench](tasks/#proofs).                                                      |
| [Score Centering](https://arxiv.org/html/2609.20807v1#S5.SS1)                                                                      | Qwen3-0.6B-Instruct; Qwen3-30B-A3B-Base.                                               | No learned critic in the controlled comparison; group-centered REINFORCE.                                | [Countdown and INTELLECT-2 math](tasks/#math), under controlled sampler–trainer mismatch.             |
| [Decoupled PPO](https://github.com/areal-project/AReaL/blob/bb13e3bdb9a865608eafa017a70a790124c3d3bb/examples/math/gsm8k_ppo.yaml) | Qwen2.5-1.5B-Instruct in the linked AReaL example.                                     | Separate critic initialized from the same checkpoint.                                                    | [GSM8K](tasks/#math). This row describes a released configuration, not a separate paper experiment.   |
| [BPCO](https://arxiv.org/html/2608.23566v2#S4)                                                                                     | DeepSeek-R1-Distill-Qwen-1.5B; Qwen3-30B-A3B Base/non-Base; Qwen3-4B-Base for rubrics. | Learned critic; optional answer/rubric inputs. Qwen3-4B-Instruct-2507 is the rubric judge.               | [Math](tasks/#math): DeepScaleR or DAPO-Math-17K → AIME25; [OpenRubrics](tasks/#rubrics).             |
| [LVRL](https://arxiv.org/html/2610.15840v1#S4.SS1)                                                                                 | Qwen3-4B/8B for AppWorld and BabyAI; Qwen3-8B/32B for repository tasks.                | Frozen Claude Opus 4.6 value critic. LVOPD uses Qwen3-235B-A22B-Thinking-2507-FP8 as teacher and critic. | [AppWorld, BabyAI](tasks/#agents); [R2E-Gym → SWE-bench Verified](tasks/#coding).                     |
| [CoPE](https://arxiv.org/html/2610.20597v2#S6)                                                                                     | Qwen2.5-7B-Instruct; Qwen2.5-14B-Instruct for AppWorld.                                | No value critic; acting and forecasting share one backbone.                                              | [ALFWorld, ScienceWorld, WebShop, τ²-bench and AppWorld](tasks/#agents).                              |

</div>

<a class="essay-read" href="{{ '/blog/2026/revisiting-ppo/tasks/' | relative_url }}">See details on the tasks <span aria-hidden="true">→</span></a>
