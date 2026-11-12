---
layout: research-post
title: "Revisiting Multi-Agent Scaling"
description: "How agent teams coordinate work and learn to use additional compute effectively."
topic: Multi-Agent Scaling · Coordination · Reinforcement Learning
date: 2026-11-05 00:00:00 -0800
permalink: /blog/2026/multi-agent-coordination/
research_blog: true
multiagent_blog: true
math: true
series: multi-agent-scaling
series_order: 1
back_url: /blog/
back_label: All writing
sections:
  - { id: reading-the-map, title: Reading the map }
  - { id: training-free, title: "01 · Training-free" }
  - { id: centralized, title: "Centralized: EAT" }
  - { id: decentralized, title: Decentralized approaches }
  - { id: with-training, title: "02 · With training" }
  - { id: mpt, title: MPT }
  - { id: avalon, title: Avalon-M1 }
  - { id: s3, title: s³ }
  - { id: comparing, title: What to compare }
---

Agent teams must decide how to divide work, share information, and combine their contributions as more agents join. This post reviews seven approaches, asking who coordinates the work and how feedback changes the system, with or without updating model parameters.

<div id="reading-the-map"></div>

Here, *training-free* means that the LLM weights stay fixed. Prompts, memories, populations, and team structures can still change. *With training* means that feedback updates model parameters; it does not necessarily mean test-time training on the current task. *Decentralized* refers to coordination without a central LLM dispatcher. Shared services and common rules can still be present.

<figure class="ma-figure" aria-labelledby="ma-map-title">
<header class="ma-heading"><span class="ma-kicker">A map of the seven approaches</span><h3 id="ma-map-title">Coordination and learning are separate choices.</h3></header>
<div class="ma-matrix">
<div class="ma-axis">Training-free<span>LLM weights stay fixed</span></div><div class="ma-axis ma-axis-training">With training<span>LLM weights are updated</span></div>
<div class="ma-cell"><span class="ma-cell-label">Central coordinator</span><div class="ma-paper-links"><a href="#eat">EAT</a></div><p>A supervisor revises the team.</p></div>
<div class="ma-cell ma-cell-trained"><span class="ma-cell-label">Central coordinator</span><div class="ma-paper-links"><a href="#avalon">Avalon-M1</a></div><p>A CEO and specialists learn together.</p></div>
<div class="ma-cell"><span class="ma-cell-label">Decentralized coordination</span><div class="ma-paper-links"><a href="#eom">EoM</a><a href="#scalemas">ScaleMAS</a><a href="#agensh">Agensh</a></div><p>Markets, shared information, or self-assigned work.</p></div>
<div class="ma-cell ma-cell-trained"><span class="ma-cell-label">Decentralized coordination</span><div class="ma-paper-links"><a href="#mpt">MPT</a><a href="#s3">s³</a></div><p>Learn participation or asynchronous collaboration.</p></div>
</div>
<figcaption>Coordination during execution, crossed with whether the method updates LLM weights. The cells describe these systems, not every possible multi-agent design.</figcaption>
</figure>

## 01 · Training-free {#training-free}

Frozen models can still change how they work together. A supervisor can reorganize a team, agents can build on shared discoveries, and a population can change through selection. These methods place adaptation in the system around the LLM.

<figure class="ma-figure" data-ma-explorer aria-labelledby="ma-free-title">
<header class="ma-heading"><span class="ma-kicker">Explore the coordination mechanism</span><h3 id="ma-free-title">Where does the next decision come from?</h3><p>Switch methods to see the shared state and the decision rule.</p></header>
<div class="ma-controls" data-ma-controls hidden role="group" aria-label="Training-free method">
<button type="button" data-ma-select="eat" aria-pressed="true" aria-controls="ma-eat-panel" data-ma-announcement="EAT: a supervisor redesigns the team using execution feedback.">EAT</button>
<button type="button" data-ma-select="eom" aria-pressed="false" aria-controls="ma-eom-panel" data-ma-announcement="EoM: auctions allocate turns; economic feedback changes the population.">EoM</button>
<button type="button" data-ma-select="scale" aria-pressed="false" aria-controls="ma-scale-panel" data-ma-announcement="ScaleMAS: agents publish and retrieve linked messages in a shared datastore.">ScaleMAS</button>
<button type="button" data-ma-select="agensh" aria-pressed="false" aria-controls="ma-agensh-panel" data-ma-announcement="Agensh: workers claim tasks, coordinate, verify, and merge their work.">Agensh</button>
</div>
<div class="ma-status" data-ma-status aria-live="polite" aria-atomic="true"></div>

<div class="ma-panel" data-ma-panel="eat" id="ma-eat-panel" role="group" aria-label="EAT coordination diagram">
<div class="ma-panel-heading"><h4>EAT · Revise the team</h4><span class="ma-badge">Central supervisor</span></div>
<div class="ma-node ma-node-focus ma-node-center"><strong>Supervisor</strong><small>Diagnose progress; redesign roles and workflow</small></div>
<div class="ma-connector"><span aria-hidden="true">↓</span> Assign focused work</div>
<div class="ma-agents"><div class="ma-node"><strong>Research</strong></div><div class="ma-node"><strong>Implement</strong></div><div class="ma-node"><strong>Profile</strong></div></div>
<div class="ma-connector"><span aria-hidden="true">↓</span> Evaluate and record</div>
<div class="ma-node ma-node-center"><strong>Results + persistent experience</strong></div>
<div class="ma-return"><span aria-hidden="true">↶</span> Evidence informs the next team configuration</div>
<div class="ma-panel-foot"><p>Illustrative roles; the supervisor can invent new ones.</p><a href="https://arxiv.org/abs/2610.36848">Paper ↗</a></div>
</div>

<div class="ma-panel" data-ma-panel="eom" id="ma-eom-panel" role="group" aria-label="EoM coordination diagram">
<div class="ma-panel-heading"><h4>EoM · Allocate turns through a market</h4><span class="ma-badge">No LLM dispatcher</span></div>
<div class="ma-agents"><div class="ma-node"><strong>Agent A</strong><small>Eligible bid</small></div><div class="ma-node"><strong>Agent B</strong><small>Eligible bid</small></div><div class="ma-node"><strong>Agent C</strong><small>Eligible bid</small></div></div>
<div class="ma-connector"><span aria-hidden="true">↓</span> Auction rule</div>
<div class="ma-node ma-node-focus ma-node-center"><strong>Highest bidder acts</strong></div>
<div class="ma-connector"><span aria-hidden="true">↓</span> Environment feedback</div>
<div class="ma-node ma-node-center"><strong>Payments + rewards → wealth</strong></div>
<div class="ma-return"><span aria-hidden="true">↶</span> Selection and prompt mutation change the population</div>
<div class="ma-panel-foot"><p>Adaptation phase shown; evaluation freezes the population.</p><a href="https://arxiv.org/abs/2606.02859">Paper ↗</a></div>
</div>

<div class="ma-panel" data-ma-panel="scale" id="ma-scale-panel" role="group" aria-label="ScaleMAS coordination diagram">
<div class="ma-panel-heading"><h4>ScaleMAS · Find useful shared information</h4><span class="ma-badge">Asynchronous agents</span></div>
<div class="ma-agents"><div class="ma-node"><strong>Agent A</strong></div><div class="ma-node"><strong>Agent B</strong></div><div class="ma-node"><strong>Agent C</strong></div></div>
<div class="ma-connector"><span aria-hidden="true">↓ ↑</span> Publish · Search · Visit</div>
<div class="ma-store"><strong>Persistent datastore</strong><div class="ma-tags"><span>Message</span><span>→ Reference →</span><span>Earlier finding</span></div><p>Search ranks by relevance and citation signals.</p></div>
<div class="ma-connector"><span aria-hidden="true">↑</span> Each read returns a bounded selection</div>
<div class="ma-return">Findings remain available after their authors leave.</div>
<div class="ma-panel-foot"><p>Bounded reads do not make total system cost constant.</p><a href="https://arxiv.org/abs/2610.16120">Paper ↗</a></div>
</div>

<div class="ma-panel" data-ma-panel="agensh" id="ma-agensh-panel" role="group" aria-label="Agensh coordination diagram">
<div class="ma-panel-heading"><h4>Agensh · Claim work and integrate results</h4><span class="ma-badge">Asynchronous workers</span></div>
<div class="ma-agents"><div class="ma-node"><strong>Worker A</strong><small>Claims a task</small></div><div class="ma-node"><strong>Worker B</strong><small>Implements</small></div><div class="ma-node"><strong>Worker C</strong><small>Verifies</small></div></div>
<div class="ma-connector"><span aria-hidden="true">↓ ↑</span> Coordinate and publish progress</div>
<div class="ma-store"><strong>Shared organization state</strong><div class="ma-tags"><span>Git workspace</span><span>Messages</span><span>Findings + claims</span></div></div>
<div class="ma-rail"><span>Read</span><span>Claim</span><span>Act</span><span>Verify</span><span>Merge</span></div>
<div class="ma-return"><span aria-hidden="true">↶</span> Each worker repeats the loop at its own pace</div>
<div class="ma-panel-foot"><p>Workers may be at different stages; these are not fixed roles.</p><a href="https://arxiv.org/abs/2609.26781">Paper ↗</a></div>
</div>
<figcaption>Schematic mechanisms, not measured trajectories. Three workers are drawn for readability; their number is not an experimental result.</figcaption>
</figure>

### Centralized: a supervisor changes the team {#centralized}

<div id="eat"></div>

[**Evolving Agent Teams (EAT)**](https://arxiv.org/abs/2610.36848) uses a supervisor to inspect progress on program optimization and revise the team’s roles, coordination, and knowledge management. It can isolate a difficult debugging investigation or add a role that synthesizes earlier discoveries. A persistent filesystem carries experience between teams; LLM weights stay fixed.

I find the distinction between *improving a program* and *changing the process used to improve it* useful. The appropriate process can change after a bottleneck is removed. EAT provides empirical examples, with few repeated runs and no mathematical guarantee of escaping local optima.

### Decentralized: markets, information, and work {#decentralized}

These three approaches remove the central LLM dispatcher, but place coordination in different parts of the system.

#### EoM: economic selection of participants {#eom}

[**Economy of Minds: Emerging Multi-Agent Intelligence with Economic Interactions**](https://arxiv.org/abs/2606.02859) allocates turns through auctions. Eligible agents have fixed bids; the winner pays the preceding actor and receives environment rewards. Wealth influences survival and prompt mutation; bankrupt agents are replaced.

The paper calls this an optimization or training phase, but LLM weights stay fixed. Evaluation freezes the population and disables economic updates.

EoM offers a mechanism for rewarding earlier work through downstream activity. I would distinguish this payment signal from a measurement of causal contribution.

#### ScaleMAS: selective access to collective knowledge {#scalemas}

[**Scaling Multi-Agent Intelligence with Substrate-Centric Coordination**](https://arxiv.org/abs/2610.16120) introduces ScaleMAS. Agents publish messages, search by content, and visit messages by address. References link a new message to earlier work; search combines relevance with citation signals to select what a reader sees.

This addresses an information-access problem: a larger group produces more material, but every agent has limited attention. Persistent messages allow discoveries to outlive their authors, while bounded reads limit how much enters a context at once. They do not bound the total cost of running the group.

Matched-inference-budget comparisons show gains. Scaling to 128 agents is demonstrated on Contradiction Audit; other tasks saturate earlier.

#### Agensh: self-assigned work with shared integration {#agensh}

[**Agensh: Scaling Organizational Intelligence to 1,024 Agents**](https://arxiv.org/abs/2609.26781) gives each worker a cooperation loop: gather context, claim a task, act, verify, and merge progress. A Git workspace holds contributions, messages support coordination, and shared context records findings and work intentions.

Workers choose tasks from the evolving state of the project. They can negotiate overlapping claims and resolve merge conflicts without waiting for a central planner. Claims are coordination signals, not a guarantee of exclusive ownership; textual merge checks also cannot establish that the combined program is correct.

Experiments use a six-hour budget, reaching 128 agents across five tasks and 1,024 on Pandoc. Equal-cost efficiency requires a separate comparison.

The distinction between ScaleMAS and Agensh matters: retrieving a useful finding and integrating a verified code change solve different problems. My reading is that their mechanisms could complement each other. Better information selection could help a worker decide what to claim and how to execute it, but that combination needs its own evaluation.

## 02 · With training {#with-training}

When coordination decisions are generated by a model, feedback can also change the probability of making those decisions again. MPT, Avalon-M1 and s³ differ in who organizes work and how a team outcome becomes a learning signal.

<figure class="ma-figure" data-ma-explorer aria-labelledby="ma-train-title">
<header class="ma-heading"><span class="ma-kicker">Follow one training cycle</span><h3 id="ma-train-title">How does a team outcome change a policy?</h3><p>Step through execution, feedback, and the parameter update.</p></header>
<div class="ma-controls" data-ma-controls hidden role="group" aria-label="Training cycle stage">
<button type="button" data-ma-select="execute" aria-pressed="true" aria-controls="ma-mpt-execute ma-rlcr-execute ma-s3-execute" data-ma-announcement="Execution: MPT selects one bidder per turn; Avalon-M1 uses a CEO; s³ agents work and message asynchronously.">1 · Execute</button>
<button type="button" data-ma-select="feedback" aria-pressed="false" aria-controls="ma-mpt-feedback ma-rlcr-feedback ma-s3-feedback" data-ma-announcement="Feedback: MPT allocates local credit and compares alternative participants; RLCR and s³ use shared team feedback.">2 · Get feedback</button>
<button type="button" data-ma-select="update" aria-pressed="false" aria-controls="ma-mpt-update ma-rlcr-update ma-s3-update" data-ma-announcement="Update: MPT trains separate agent policies; RLCR and s³ update shared policies.">3 · Update</button>
</div>
<div class="ma-status" data-ma-status aria-live="polite" aria-atomic="true"></div>
<div class="ma-training-pair ma-training-trio">
<div class="ma-training-card">
<header><a href="https://arxiv.org/abs/2610.22322">MPT ↗</a><small>Separate policies · decentralized turn selection</small></header>
<div data-ma-panel="execute" id="ma-mpt-execute"><span class="ma-step-title">1 · Execute</span><div class="ma-agents"><div class="ma-node"><strong>A</strong><small>Bid</small></div><div class="ma-node"><strong>B</strong><small>Bid</small></div><div class="ma-node"><strong>C</strong><small>Bid</small></div></div><div class="ma-connector"><span aria-hidden="true">↓</span> Select highest bid</div><div class="ma-node ma-node-focus"><strong>One agent acts</strong></div><p class="ma-step-note">Repeat for the next turn.</p></div>
<div data-ma-panel="feedback" id="ma-mpt-feedback"><span class="ma-step-title">2 · Get feedback</span><div class="ma-node"><strong>Reward passes backward</strong><small>Bids determine local credit</small></div><div class="ma-credit-line"><b>Earlier turn</b><span aria-hidden="true">←</span><b>Later turn</b></div><div class="ma-branch-pair"><div class="ma-node"><strong>A acts</strong></div><div class="ma-node"><strong>B acts</strong></div></div><p class="ma-step-note">Also compare continuations from the same restored state to train participation.</p></div>
<div data-ma-panel="update" id="ma-mpt-update"><span class="ma-step-title">3 · Update</span><div class="ma-node ma-node-blue"><strong>Action learning + bid learning</strong></div><div class="ma-params"><span>θ<sub>A</sub></span><span>θ<sub>B</sub></span><span>θ<sub>C</sub></span></div><p class="ma-step-note">Each agent updates its own policy; action and bidding share parameters within that agent.</p></div>
</div>
<div class="ma-training-card">
<header><a href="https://www.gr.inc/avalonm1.pdf">Avalon-M1 / RLCR ↗</a><small>Shared policy · CEO and specialists</small></header>
<div data-ma-panel="execute" id="ma-rlcr-execute"><span class="ma-step-title">1 · Execute</span><div class="ma-node ma-node-focus"><strong>CEO delegates</strong></div><div class="ma-connector"><span aria-hidden="true">↓</span> Parallel work</div><div class="ma-agents"><div class="ma-node"><strong>A</strong></div><div class="ma-node"><strong>B</strong></div><div class="ma-node"><strong>C</strong></div></div><p class="ma-step-note">Communicate and work within a time limit.</p></div>
<div data-ma-panel="feedback" id="ma-rlcr-feedback"><span class="ma-step-title">2 · Get feedback</span><div class="ma-node"><strong>Team outcome</strong></div><div class="ma-connector"><span aria-hidden="true">↓</span></div><div class="ma-shared-advantage">One collective advantage</div><p class="ma-step-note">No explicit decomposition into each agent’s contribution.</p></div>
<div data-ma-panel="update" id="ma-rlcr-update"><span class="ma-step-title">3 · Update</span><div class="ma-node ma-node-blue"><strong>Policy-gradient update</strong></div><div class="ma-params ma-one-param"><span>θ<sub>shared</sub></span></div><p class="ma-step-note">The same team advantage weights the learning signal across agents’ generated tokens.</p></div>
</div>
<div class="ma-training-card">
<header><a href="https://arxiv.org/abs/2611.08615">s³ ↗</a><small>Shared policy · no assigned roles</small></header>
<div data-ma-panel="execute" id="ma-s3-execute"><span class="ma-step-title">1 · Execute</span><div class="ma-node ma-node-focus"><strong>Work ↔ message ↔ read</strong></div><p class="ma-step-note">Asynchronous agents choose when to communicate.</p></div>
<div data-ma-panel="feedback" id="ma-s3-feedback"><span class="ma-step-title">2 · Get feedback</span><div class="ma-node"><strong>Team success − token cost</strong></div><p class="ma-step-note">Compare independent teams on the same problem.</p></div>
<div data-ma-panel="update" id="ma-s3-update"><span class="ma-step-title">3 · Update</span><div class="ma-params ma-one-param"><span>θ<sub>shared</sub></span></div><p class="ma-step-note">One team advantage; equal weight per team.</p></div>
</div>
</div>
<p class="ma-figure-note">These are different execution structures. Decentralized turn-taking is not the same as simultaneous execution.</p>
<figcaption>Conceptual training cycles; the diagram groups MPT’s alternating action and bidding updates.</figcaption>
</figure>

### MPT: learn how to act and when to participate {#mpt}

[**Learning Self-Orchestration in Decentralized Agent Swarms**](https://arxiv.org/abs/2610.22322) introduces market-based post-training. Bids both select an actor and determine how credit passes backward. Counterfactual continuations teach participation: preference learning favors the bid associated with the better outcome. Action and participation then adapt together.

Experiments start with complementary roles and require restorable environments. They support learned turn allocation; arbitrary role discovery and coordination among hundreds of simultaneous workers remain further questions.

### Avalon-M1: reinforce useful parallel work {#avalon}

[**Avalon-M1: Reinforcement Learning from Collective Rewards**](https://www.gr.inc/avalonm1.pdf) trains a shared policy used by a CEO and specialist agents. RLCR applies one collective advantage across the agents’ generated tokens, without explicitly estimating each member’s contribution. The CEO and workers are trained jointly.

[**How to Train a Swarm**](https://www.gr.inc/blog/how-to-train-a-swarm) explains how the training setup rewards useful parallel work. Avalon-M1 caps wall-clock time and scores progress at the deadline, using environments with measurable intermediate returns. The cap grows during training. Equal returns before the deadline receive equal scores, so this is not a reward for every second saved.

Channels, direct messages and an archive let agents divide work and reuse discoveries. Communication consumes time, so additional messages alone do not establish better coordination. Useful comparisons measure task progress at matched elapsed time and matched token budgets. The report’s latency comparisons use derived latency.

RLCR’s flat advantage remains a coarse signal over long episodes. The initial CEO-plus-specialist setup trains teams of at most nine agents; generalization to much larger collectives remains open.

### [s³: Simple Scaling of Swarms via Cooperative Multi-agent RL](https://arxiv.org/html/2611.08615v1#S3) {#s3}

Agents share a policy but keep private histories. They choose when to work, send messages and read replies, without assigned roles or a central dispatcher. Team success means at least one agent answers correctly; successful teams pay a normalized token cost.

Eight independent team attempts on the same problem supply the reward group:

$$
A_g=\frac{R_g-\bar R}{\sigma_R+\epsilon}.
$$

Every generated token in team $g$ receives $A_g$. The loss averages within teams, then across teams. Information aggregation uses Qwen3-0.6B; exploration uses Qwen3-1.7B. Training uses four agents, with evaluation up to sixteen. Matched-budget controls show gains from learned communication in these tasks, including less duplicate exploration. Scaling to arbitrary swarm sizes remains untested.

### What I would compare {#comparing}

MPT spends extra rollouts on participation credit. Avalon-M1 and s³ use shared outcomes, with different assumptions about organization. Their environments and budgets differ, so reported scores do not provide a direct ranking.

<div class="ma-comparison">
<table>
<caption class="ma-status">Comparing three training designs</caption>
<thead><tr><th scope="col">Design choice</th><th scope="col">MPT</th><th scope="col">Avalon-M1 / RLCR</th><th scope="col">s³</th></tr></thead>
<tbody>
<tr><th scope="row">Participation</th><td>Learned bids select the next actor.</td><td>A trained CEO delegates work.</td><td>No fixed roles or turn order.</td></tr>
<tr><th scope="row">Feedback</th><td>Local credit and counterfactual preferences.</td><td>Shared collective advantage.</td><td>Team-relative advantage.</td></tr>
<tr><th scope="row">Parameters</th><td>Separate across agents.</td><td>Shared across the team.</td><td>Shared across the team.</td></tr>
<tr><th scope="row">Cost to examine</th><td>Additional branching rollouts.</td><td>Learning from a coarse signal over long episodes.</td><td>Messaging and inference contention.</td></tr>
</tbody>
</table>
</div>

For a controlled comparison, I would hold the backbone, task interface, and available tools fixed, then measure performance against both training compute and deployment cost. Extra rollouts for contribution estimates belong in the training budget. At deployment, quality at a fixed elapsed time and quality at a fixed inference budget answer different questions. An improvement in one does not establish an improvement in the other.

I would also separate three decisions that often get grouped under “coordination”: which information to read, which work to undertake, and how to distribute feedback for learning. A system may handle one well while struggling with another. That suggests useful combinations to test, such as selective retrieval inside a self-assigned work loop, or learning a supervisor from records of successful team reorganizations. These are research directions, rather than results established by the papers above.

<details class="ma-sources">
<summary>Paper links and versions used</summary>
<ol>
<li><a href="https://arxiv.org/html/2610.36848v1">Evolving Agent Teams</a> · v1, October 2026.</li>
<li><a href="https://arxiv.org/html/2606.02859v2">Economy of Minds: Emerging Multi-Agent Intelligence with Economic Interactions</a> · v2, October 2026.</li>
<li><a href="https://arxiv.org/html/2610.16120v1">Scaling Multi-Agent Intelligence with Substrate-Centric Coordination</a> · v1, October 2026.</li>
<li><a href="https://arxiv.org/html/2609.26781v1">Agensh: Scaling Organizational Intelligence to 1,024 Agents</a> · v1, September 2026.</li>
<li><a href="https://arxiv.org/html/2610.22322v2">Learning Self-Orchestration in Decentralized Agent Swarms</a> · v2, October 2026.</li>
<li><a href="https://www.gr.inc/avalonm1.pdf">Avalon-M1: Reinforcement Learning from Collective Rewards</a> · October 2026 report; <a href="https://www.gr.inc/blog/how-to-train-a-swarm">How to Train a Swarm</a>, November 2, 2026.</li>
<li><a href="https://arxiv.org/html/2611.08615v1">s³: Simple Scaling of Swarms via Cooperative Multi-agent RL</a> · v1, November 5, 2026.</li>
</ol>
</details>
