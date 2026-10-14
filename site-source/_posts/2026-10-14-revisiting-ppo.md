---
layout: research-post
title: "Revisiting PPO for LLM Post-Training"
description: "What recent actor–critic methods change, and what our first test-time discovery experiments reveal about reliability, exploration, and progress."
topic: Reinforcement learning · Test-time discovery
date: 2026-10-14 00:00:00 -0400
permalink: /blog/2026/revisiting-ppo/
research_blog: true
math: true
og_image: /assets/img/blog/ppo-trajectories.png
sections:
  - { id: question, title: The question }
  - { id: landscape, title: A map of recent work }
  - { id: mechanics, title: What PPO estimates }
  - { id: special, title: What makes TTT special }
  - { id: setup, title: Our discovery setup }
  - { id: results, title: Explore the results }
  - { id: achieved, title: What we achieved }
  - { id: improve, title: What needs improvement }
  - { id: next, title: What to test next }
  - { id: scope, title: Data & references }
---

<div class="essay-abstract">
<span class="note-label">The observation</span>
<p>In our initial Polyomino experiments, PPO produced the highest average score and validity rate over rounds 16–30. A Guidance-TTT run found the best solution within the same 30-round budget. These outcomes raise a useful question: <strong>when does more reliable generation translate into better discovery?</strong></p>
<p class="small-note">One task, one trajectory per configuration, and an online evaluator. These are preliminary observations, not a controlled ranking of RL algorithms.</p>
</div>

## The question: what are we asking PPO to improve? {#question}

A discovery system proposes a change, implements it, tests it, and decides what to try next. A policy can improve at several parts of this process. It might generate fewer broken programs, preserve the quality of an existing solution, or discover a substantially better algorithm. A single reward curve does not distinguish these capabilities.

This post revisits recent LLM reinforcement-learning methods through that distinction. The first part organizes the literature by the component each method changes. The second reports our initial experiments with **Guidance-PPO**: a trainable editor proposes natural-language guidance, and a larger, frozen executor turns it into code.

The experiment began with a practical question: can an actor–critic method improve test-time search? The trajectories suggest a more specific question: **how should the update reward useful progress without losing the ability to produce executable changes?**

## A map of recent work {#landscape}

“PPO versus GRPO” hides several independent decisions. How many continuations do we sample for each prompt? Where does the baseline come from? Do we wait for the real outcome? How do we correct the difference between sampling and training probabilities?

<figure class="concept-figure">
<div class="pipeline" aria-label="RL pipeline: sample, evaluate, assign credit, correct mismatch, update">
<div><span>01</span><strong>Sample</strong><small>One trajectory or a group?</small></div>
<div><span>02</span><strong>Evaluate</strong><small>Real verifier or learned feedback?</small></div>
<div><span>03</span><strong>Assign credit</strong><small>Return, baseline, or chunk value?</small></div>
<div><span>04</span><strong>Correct</strong><small>Behavior-policy mismatch</small></div>
<div><span>05</span><strong>Update</strong><small>Actor and critic objectives</small></div>
</div>
<figcaption>Figure 1. A functional map of the training loop. Methods can change several components at once; this is not a citation or dependency graph.</figcaption>
</figure>

<div class="table-scroll" role="region" aria-label="Recent methods compared" tabindex="0" markdown="1">

| Work                                                                                                                    | Main technical change                                                                                                     | Question it helps us ask                                                  |
| :---------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| [SAO](https://arxiv.org/abs/2607.07508)                                                                                 | Single-rollout asynchronous training, practical value-model training, and strict double-sided token-level clipping.       | Can we learn from one expensive execution per prompt?                     |
| [EasyPPO](https://arxiv.org/abs/2609.36802)                                                                             | Actor-only overlong filtering, noise-normalized critic regression, and moderately smaller critic minibatches.             | Does the critic see representative returns and balanced regression noise? |
| [TEMPO](https://arxiv.org/abs/2604.19295)                                                                               | Alternates policy refinement on unlabeled questions with critic recalibration on labeled data.                            | How does learned feedback remain trustworthy as the policy changes?       |
| [AC2 / Trust the Critic More](https://arxiv.org/abs/2609.39247)                                                         | Critic-based action-chunk updates, gated by local readiness, with reference solutions when available.                     | When can value estimates replace completing a trajectory?                 |
| [FlashREINFORCE](https://yifanzhang-pro.github.io/FlashREINFORCE/)                                                      | Critic-free, single-rollout asynchronous learning with batch centering, sequence admission, and sample-mean optimization. | How much of the benefit survives without a learned critic?                |
| [Score Centering](https://arxiv.org/abs/2609.20807)                                                                     | An additive correction for gradient drift caused by training–inference mismatch.                                          | Is a biased update being mistaken for an advantage-estimation failure?    |
| [AReaL / Decoupled PPO](https://raw.githubusercontent.com/areal-project/AReaL/main/docs/en/best_practices/algo_perf.md) | Separates behavior-policy correction from clipping around a recent proximal policy.                                       | Are data reuse and update size being controlled separately?               |

</div>

Three distinctions matter for interpreting these papers.

**A critic can serve different purposes.** A baseline estimates expected return to reduce gradient variance. A surrogate evaluator supplies feedback when labels are unavailable. A critic used at a chunk boundary can support an update before the real terminal outcome is observed. Evidence for one role does not establish reliability in the others. AC2 also uses a generative value formulation with shared actor–critic weights, rather than simply adding the conventional independent scalar value head. See its [method section](https://arxiv.org/html/2609.39247v2#S3).

<div class="role-map" aria-label="Three roles of a critic">
<div><span class="note-label">Baseline</span><strong>Reduce variance</strong><p>Observe the real outcome, then subtract expected return.</p></div>
<div><span class="note-label">Surrogate feedback</span><strong>Supply an evaluation</strong><p>Use a learned signal, with calibration against external evidence.</p></div>
<div><span class="note-label">Chunk evaluator</span><strong>Shorten execution</strong><p>Update from a partial continuation when its value is reliable.</p></div>
</div>

**Single rollout does not dictate the baseline.** SAO and FlashREINFORCE both avoid waiting for sibling trajectories, but make different choices about learning a value model. Sampling design and critic design should be compared separately.

**Score centering is not reward centering.** In that paper, “score” refers to the gradient of log probability. Subtracting a parent’s task score does not implement that correction. Similarly, importance sampling addresses distribution mismatch; PPO clipping imposes an update constraint. These mechanisms should not be treated as interchangeable.

## What PPO estimates {#mechanics}

For an autoregressive actor, the state is the prompt and generated prefix, and the next token is an action. The critic estimates expected future return under the policy. The verifier supplies the observed outcome. PPO usually does not train a separate Q-network.

The [GAE estimator](https://arxiv.org/abs/1506.02438) combines temporal-difference residuals:

$$
\delta_t=r_t+\gamma V(s_{t+1})-V(s_t),\qquad
\hat A_t=\sum_{l=0}^{T-t-1}(\gamma\lambda)^l\delta_{t+l}.
$$

For a complete trajectory with only a terminal reward and **γ = λ = 1**, this reduces to:

$$
\hat A_t=R-V_{\mathrm{old}}(s_t).
$$

The terminal return is observed; the critic provides a prefix-dependent baseline. This setting does not use intermediate value bootstrapping to avoid completing the rollout. With smaller λ, bootstrapped estimates enter the advantage more directly.

The [PPO actor objective](https://arxiv.org/abs/1707.06347) uses a fixed advantage and a probability ratio:

$$
L_{\mathrm{actor}}=
\mathbb E_t\!\left[\min\left(\rho_t\hat A_t,
\operatorname{clip}(\rho_t,1-\epsilon,1+\epsilon)\hat A_t\right)\right],
\quad \rho_t=\frac{\pi_\theta(a_t\mid s_t)}{\pi_{\mathrm{old}}(a_t\mid s_t)}.
$$

The critic instead minimizes a regression loss against return targets, often with value clipping. The two networks therefore have different objectives. More critic optimizer steps do not directly mean stronger policy optimization.

For comparison, [GRPO](https://arxiv.org/abs/2402.03300) obtains its baseline from sibling outcomes rather than a learned value model. Our Guidance-TTT comparator uses a particular adaptive-entropic, leave-one-out estimator described below; it is not generic clipped GRPO.

## What makes TTT special? {#special}

Moving a post-training recipe into test-time discovery changes the problem it is solving. Three differences shape our design.

### One target problem

In this setting, **sample = 1 at the level of the discovery task**: we adapt to one objective and try to produce a strong solution for it. We are not training over a broad collection of unrelated prompts. For Polyomino, that one objective is to find a packing program that performs well on the evaluator’s cases.

This still allows many candidates, many parent programs, and multiple evaluation instances. Our experiment uses 128 candidate rollouts per round and 70 test cases. Those are different quantities from the number of target discovery tasks. All the guidance samples ultimately serve the same search.

### Best-of-all is the outcome we care about

At the end of the budget, we keep the best verified solution found anywhere in the history. The practical objective is therefore closer to:

$$
\mathbb E\!\left[\max_{1\leq k\leq N} S(c_k)\right],
$$

where each candidate can depend on previous results. Standard expected-reward training instead directly rewards the quality of sampled candidates. These objectives can favor different behavior: consistently producing a good existing solution is useful for reliability, but may add little to the best solution we already have.

Valid execution still matters. A failed program uses budget without producing a scored solution, and too many failures can prevent the search from advancing. The challenge is to preserve this reliability while making room for changes that may improve the frontier.

### Discovery needs feedback depth

The next useful idea often becomes visible only after the previous idea has been implemented and evaluated. A large batch samples many candidates from the same available history. None can use feedback that arrives later in that batch.

Under a fixed execution budget, collecting more candidates before each update leaves fewer opportunities to revise the policy and the search history. In a simple synchronous loop, the number of feedback rounds is roughly the total candidate budget divided by batch size.

<figure class="concept-figure depth-figure">
<span class="note-label">The same 64 executions, different feedback schedules</span>
<div class="depth-row"><div class="depth-label"><strong>Batch 32</strong><small>2 feedback rounds</small></div><div class="depth-rounds depth-two"><span>Round 1</span><span>Round 2</span></div></div>
<div class="depth-row"><div class="depth-label"><strong>Batch 8</strong><small>8 feedback rounds</small></div><div class="depth-rounds depth-eight"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span></div></div>
<figcaption>Illustration, not an experimental result. Each block ends with feedback available to the next round. More feedback rounds permit deeper adaptation; they do not guarantee greater search-tree depth or better solutions.</figcaption>
</figure>

This gives batch size an additional meaning in TTT: it controls how long the system waits before it can learn from its own experiments. Larger batches provide breadth, more parallelism, and potentially lower-variance updates. Smaller batches provide more frequent adaptation. We have not yet run a matched-budget batch-size ablation, so the best balance remains an open question.

## Our test-time discovery setup {#setup}

We used Reef to run a search over C++ solutions to **FrontierCS Polyomino packing**. The trainable policy was Qwen3-8B with thinking enabled. It produced guidance for a frozen GPT-OSS-120B executor, which implemented the proposed change with medium reasoning. Only the editor policy was adapted; the executor remained frozen.

<figure class="concept-figure discovery-figure">
<div class="discovery-flow">
<div><span class="note-label">Search memory</span><strong>Select 8 parents</strong><small>Code, summaries, scores, and error feedback</small></div>
<span class="flow-arrow" aria-hidden="true">→</span>
<div><span class="note-label">Qwen3-8B</span><strong>16 ideas per parent</strong><small>128 independently sampled guidance responses</small></div>
<span class="flow-arrow" aria-hidden="true">→</span>
<div><span class="note-label">Frozen OSS-120B</span><strong>Implement & evaluate</strong><small>C++ candidates, 70 online test cases</small></div>
</div>
<div class="loop-return">Scores and failure feedback return to the archive; training variants also update the editor.</div>
<figcaption>Figure 2. The trained action is guidance. Program validity depends on both the guidance and the frozen executor’s implementation.</figcaption>
</figure>

Each round selected eight parents with PUCT, using a Q blend of 0.8 best-child value and 0.2 mean-child value. Each parent received 16 guidance samples, for **128 candidates per round**. Guidance could use up to 10,240 generated tokens, including thinking, within a 16,384-token context. The executor ran at concurrency two. Each configuration requested two B200 GPUs.

The three runs shared the initial editor model and seed program. The editor received bounded prior-attempt feedback, including scores and compiler errors. Code parsing was separated from summary parsing so that summary formatting alone could not invalidate a complete program. Small parser-recovery fixes landed at different continuation boundaries.

<div class="table-scroll" role="region" aria-label="Experimental configurations" tabindex="0" markdown="1">

| Setting                    | Frozen inference | Guidance-TTT          | PPO                       |
| :------------------------- | :--------------- | :-------------------- | :------------------------ |
| Actor update               | None             | LoRA rank/alpha 32    | Full parameters           |
| Critic                     | None             | None                  | Full Qwen3-8B value model |
| Critic-only warmup         | None             | None                  | 5 rounds                  |
| Actor / critic LR          | —                | 4e-5 / —              | 1e-5 / 1e-5               |
| Actor batches per round    | —                | One full-batch update | 2 × 64                    |
| Critic batches per round   | —                | —                     | 2 × 64                    |
| Planned / completed rounds | 300 / 103        | 30 / 30               | 300 / 119                 |

</div>

PPO used one epoch per round, microbatch four, and CPU optimizer offload. Its terminal training utility was:

$$
R(s)=\frac{\exp(2s/100)-1}{\exp(2)-1},\qquad s\in[0,100].
$$

Invalid programs received zero. PPO did not subtract the parent score. It used γ = λ = 1 and a reference-KL coefficient of 0.001.

The Guidance-TTT comparator used raw judge scores, adaptive-entropic leave-one-out advantages, an **unclipped importance-sampling token-sum objective**, and centered reference KL with coefficient 0.1. This differs from PPO in several ways beyond the presence of a critic.

## Explore the results {#results}

The common 30-round budget is **3,840 candidate slots per method**, not equal token usage or equal GPU time. It is the cleanest available comparison of search budget. The full trajectories have different lengths and should be read as diagnostics, not as a matched-budget leaderboard.

<figure class="trajectory-panel" id="trajectory-panel" data-source="/assets/data/ppo-ttt/trajectories.json">
<div class="figure-heading"><div><span class="note-label">Experiment explorer</span><h3>Reliability and discovery</h3></div><span class="data-badge">Observed runs</span></div>
<div class="chart-controls" hidden>
<div class="control-group" role="group" aria-label="Chart metric"><button type="button" data-metric="best" aria-pressed="true">Best score</button><button type="button" data-metric="mean" aria-pressed="false">Mean score</button><button type="button" data-metric="valid" aria-pressed="false">Validity</button></div>
<label class="range-select">Budget <select id="chart-budget"><option value="30">First 30 rounds</option><option value="all">Full trajectories</option></select></label>
</div>
<div class="chart-stage"><img src="/assets/img/blog/ppo-trajectories.png" alt="Training curves: Guidance-TTT reaches the highest best score within 30 rounds; PPO maintains higher late program validity than frozen inference." width="2550" height="731" loading="lazy"></div>
<div class="chart-legend" hidden></div>
<div class="round-control" hidden><label for="chart-round">Inspect round <output id="chart-round-value">30</output></label><input id="chart-round" type="range" min="1" max="30" value="30"><div id="chart-readout" aria-live="polite" aria-atomic="true"></div></div>
<figcaption id="chart-caption">Figure 3. Best score, candidate mean, and program validity from committed rounds. Mean and validity curves use a trailing five-round window. All scores come from the same online evaluator; none are held-out validation results.</figcaption>
<div class="figure-downloads"><a href="/assets/data/ppo-ttt/round-metrics.csv" download>Download round metrics · CSV</a><a href="/assets/img/blog/ppo-trajectories.pdf">Static figure · PDF</a></div>
</figure>

<div class="table-scroll" role="region" aria-label="Equal-budget results" tabindex="0" markdown="1">

| Method           | Best through round 30 | Mean, rounds 16–30 | Validity, rounds 16–30 |
| :--------------- | --------------------: | -----------------: | ---------------------: |
| Frozen inference |                 78.94 |              65.02 |                  91.4% |
| Guidance-TTT     |             **80.45** |              68.23 |                  93.4% |
| PPO              |                 78.48 |          **74.28** |              **96.6%** |

</div>

Means include failed candidates. Validity is the verifier’s program-valid fraction, not simply whether the response could be parsed. The later window avoids letting the first few rounds dominate the average.

At the end of the retained runs, the best scores were **79.80** for frozen inference (103 rounds), **80.45** for Guidance-TTT (30), and **78.52** for PPO (119).

## What we achieved {#achieved}

### Reliable guidance with a frozen executor

PPO produced the strongest average candidate quality over rounds 16–30: **74.28**, compared with 68.23 for Guidance-TTT and 65.02 for frozen inference. Its **96.6% validity** in that window meant that most executions produced evaluable programs. The editor was only 8B parameters; the 120B executor remained frozen throughout.

The reliability also persisted later. Across the common window of rounds 71–89, PPO maintained **93.8% validity**, compared with **70.4%** for frozen inference. Since the two searches visited different parents, this is evidence about the resulting systems rather than an isolated causal estimate of policy learning.

### A clear separation between reliability and discovery

The three runs expose a useful tradeoff. PPO generates strong candidates consistently. Guidance-TTT reaches the highest frontier within the common budget. Frozen inference continues to improve through history and search alone.

This gives us a concrete starting point: preserve PPO’s reliability while improving its ability to discover a better solution. The target is measurable, and neither the critic nor the training loop needs to be treated as an all-or-nothing success.

## What needs improvement {#improve}

### 1. Turn stable quality into best-of-all progress

PPO reached 78.484 by round 12. By round 119, its best score was 78.522: about **0.038 points of additional improvement**. Yet it continued producing mostly valid, reasonably strong candidates.

This behavior is compatible with the objective it was given. Under our utility transform, 78.48 points becomes about 0.596 reward, while 80.45 becomes about 0.626. Avoiding a failure is a much larger reward difference than making that two-point improvement. This calculation does not prove the cause of stagnation, but it shows why expected utility and best-solution discovery need not move together.

The next evaluation should report validity, mean score, best score, parent-improvement rate, and evaluation cost per breakthrough separately.

### 2. Separate policy learning from search progress

Frozen inference reached 78.94 in the first 30 rounds and 79.80 after 103 rounds. A stronger parent archive can improve outcomes even when the editor never changes.

In an online search, the policy and its inputs evolve together. Higher rewards may reflect better guidance, easier starting points, or both. A useful diagnostic is to freeze a common set of parents and compare the initial and trained editors on those exact inputs. Cross-evaluating editors from different runs would also help separate policy quality from search-path luck.

### 3. Measure what the critic actually contributes

Our critic sees terminal execution outcomes and estimates expected return from guidance prefixes. It does not observe the eventual value of a branch after several future revisions. Asking it to identify promising research directions would require a different target and evidence.

The logged explained variance also needs care: our implementation computes it within microbatches and then aggregates. Low within-microbatch return variance can make the statistic unstable; a constant-return microbatch is recorded as zero. It is not the same as explained variance computed over the full rollout batch.

We should therefore measure full-batch calibration, the advantages assigned to actual improvements and failures, and the effect of the baseline on gradient variance. A baseline can help without ranking finished candidates perfectly. Ranking and uncertainty become separate requirements if we ask the critic to choose branches or replace executions.

### 4. Make the learning signal sensitive to useful improvements

Consider replacing absolute reward with child score minus parent score. If the parent score is known from the state and the critic fits the shifted return, then in the complete-return setting:

$$
(R-p)-(V-p)=R-V.
$$

This does not imply identical finite-training dynamics: initialization, value clipping, normalization, and optimization can all matter. It does mean that subtracting the parent alone does not automatically emphasize breakthroughs.

For normalized entropic weights within a shared-parent group, the shift cancels exactly:

$$
\frac{\exp(\beta(s_i-p))}{\sum_j\exp(\beta(s_j-p))}
=\frac{\exp(\beta s_i)}{\sum_j\exp(\beta s_j)}.
$$

Our TTT estimator uses stabilized exponentials and a leave-one-out denominator:

$$
e_i=\exp\!\left(\beta(s_i-\max_j s_j)\right),\qquad
A_i=\frac{e_i}{\frac{1}{G-1}\sum_{j\ne i}e_j+\varepsilon}-1.
$$

The adaptive β is chosen to target a KL divergence of log 2 between the normalized weights and the uniform distribution, subject to the solver’s bounds; constant-score groups carry no relative signal. The relevant change is **how strongly the estimator distinguishes siblings**, rather than whether the parent’s constant score is subtracted. Such weighting can also amplify noise, so repeat evaluation matters when differences are small.

### 5. Spend feedback rounds on meaningful changes

The best Guidance-TTT program still belongs to a greedy constructive family. Its gains came from changes to piece ordering, target dimensions, and placement priorities. It did not introduce beam search or backtracking.

<figure class="milestone-figure">
<ol class="milestones">
<li><span>Round 4</span><strong>77.08</strong><small>Fit existing gaps</small></li>
<li><span>Round 9</span><strong>78.91</strong><small>Estimate future space</small></li>
<li><span>Round 13</span><strong>79.90</strong><small>Target board dimensions</small></li>
<li><span>Round 21</span><strong>80.22</strong><small>Critical piece dimensions</small></li>
<li><span>Round 28</span><strong>80.45</strong><small>Refine aspect prediction</small></li>
</ol>
<figcaption>Figure 4. Selected nodes on the best Guidance-TTT solution’s ancestry. Descriptions summarize code changes; they are not isolated causal ablations.</figcaption>
</figure>

Some later proposals in other runs instead added weak tie-breakers or algebraically ineffective terms. On PPO’s final-best ancestry, 68 of 100 parent-to-child edges had an unchanged aggregate score. Equal scores do not establish identical behavior, and neutral edits can enable later progress. But they motivate measuring behavior on individual test cases, simplifying code, and limiting redundant branches.

The distinction to track is between a different explanation, a different program, a different execution, and a better outcome.

The Guidance-TTT ancestry also illustrates why feedback depth is worth investigating. Its best solution accumulated changes over many rounds. A batch of ideas generated before the first evaluation could not condition on those intermediate discoveries. This does not prove that reducing our batch of 128 would help: fewer siblings could make both exploration and advantage estimation noisier. It does make a fixed-budget breadth-versus-depth experiment a priority.

## What to test next {#next}

These observations suggest focused comparisons rather than immediately building a larger critic.

<div class="table-scroll" role="region" aria-label="Proposed experiments, not completed results" tabindex="0" markdown="1">

| Proposed experiment                               | Hold fixed                                      | Question                                                                 |
| :------------------------------------------------ | :---------------------------------------------- | :----------------------------------------------------------------------- |
| Initial versus trained editors on shared parents  | Parent code, executor, sample budget            | Did parameter updates improve guidance?                                  |
| Raw reward versus raw-minus-parent PPO            | Actor/critic architecture and update schedule   | How much do centering and value optimization matter in practice?         |
| TTT entropic advantages with PPO clipping         | Initial policy, search, and rollout budget      | Can relative winner emphasis improve discovery while retaining validity? |
| Simpler versus accumulated parent implementations | Intended behavior and evaluator                 | Does code complexity cause the later validity drop?                      |
| Learned versus group/historical baselines         | Reward and actor objective                      | Does the critic reduce variance enough to justify its cost?              |
| Smaller batches versus the current batch of 128   | Total candidate budget, executor, initial model | Do more feedback rounds improve best-of-all discovery?                   |

</div>

The proposed entropic-plus-clipping variant would no longer use the critic to construct actor advantages. Reward-scale changes also require monitoring value loss, gradient clipping, and advantage normalization.

A longer-term direction is to predict downstream improvement and use that estimate to allocate expensive executions. That would require calibrated uncertainty and periodic real evaluations. The present results do not yet justify replacing the verifier with a critic.

## Data and references {#scope}

<div class="scope-note" markdown="1">

The main unresolved issue is attribution. These configurations differ in actor parameterization, learning rates, loss reduction, and regularization, and their parent histories diverge. Multiple seeds and matched configurations are needed to separate those effects. The 70-case evaluator was used throughout the search; a held-out evaluation would be needed to measure generalization. Infrastructure interruptions also make wall-clock comparisons unreliable.

</div>

Download the [round metrics](/assets/data/ppo-ttt/round-metrics.csv) or [chart data](/assets/data/ppo-ttt/trajectories.json) to inspect the trajectories. Both retain the recorded precision before display rounding.

<div class="reference-list" markdown="1">

1. Schulman et al. [Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347), 2017.
2. Schulman et al. [High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438), 2015.
3. Shao et al. [DeepSeekMath](https://arxiv.org/abs/2402.03300), 2024.
4. Hou et al. [Single-Rollout Asynchronous Optimization for Agentic Reinforcement Learning](https://arxiv.org/abs/2607.07508), 2026.
5. Zhou et al. [EasyPPO: Stabilizing the Critic Is Key](https://arxiv.org/abs/2609.36802), 2026.
6. Zhang et al. [TEMPO: Scaling Test-time Training for Large Reasoning Models](https://arxiv.org/abs/2604.19295), 2026.
7. Wen et al. [Trust the Critic More](https://arxiv.org/abs/2609.39247), 2026.
8. Hu et al. [FlashREINFORCE: project and method](https://yifanzhang-pro.github.io/FlashREINFORCE/), 2026.
9. Marek and Ryabinin. [Score Centering Stabilizes Off-policy Reinforcement Learning](https://arxiv.org/abs/2609.20807), 2026.
10. AReaL. [Decoupled PPO and performance diagnostics](https://github.com/areal-project/AReaL/blob/main/docs/en/best_practices/algo_perf.md).

</div>
