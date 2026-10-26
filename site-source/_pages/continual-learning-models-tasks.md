---
layout: research-post
title: "Continual Learning: Models & Tasks"
description: "Training algorithms and evaluation settings for the five methods."
date: 2026-10-26 00:00:00 -0400
permalink: /blog/2026/ppo-continual-learning/models-and-tasks/
research_blog: true
math: true
back_url: /blog/2026/ppo-continual-learning/
back_label: Back to the article
sections:
  - { id: forgetting, title: Reducing forgetting }
  - { id: adaptation, title: Improving adaptation }
---

## Reducing Forgetting {#forgetting}

<div class="ar-study-table-wrap ar-model-table" role="region" aria-label="Models and tasks for reducing forgetting" tabindex="0" markdown="1">

| Work | Training & Models | Tasks & Evaluation |
| :--- | :--- | :--- |
| [CPO](https://arxiv.org/html/2607.04364v3#A5) · July 2026; revised September | GSPO + masked movement penalty. Full-parameter Qwen3-VL-2B/4B/8B. | MRCL: medical VQA, navigation, geometry, puzzles and financial charts. Evaluate acquisition and retention across a five-task sequence. |
| [TSRL](https://arxiv.org/html/2610.17726v1#S5.SS1) · October 2026 | GRPO/DAPO + triggered SFT. Qwen2.5-7B-Instruct for ALFWorld/WebShop; 32B-Instruct for Deep Search. | ALFWorld ↔ WebShop transfer; ScienceWorld extends the sequence. Search training also measures AIME24/25 retention. |

</div>

## Improving Adaptation {#adaptation}

<div class="ar-study-table-wrap ar-model-table" role="region" aria-label="Models and tasks for improving adaptation" tabindex="0" markdown="1">

| Work | Training & Models | Tasks & Evaluation |
| :--- | :--- | :--- |
| [ORBIT](https://arxiv.org/html/2602.04089v1#S4) · February 2026 | GRPO across complete trials. Qwen3-8B; scaling to 4B/14B. | Train on Rock-Paper-Scissors, Minesweeper, Hangman, Wordle and Blackjack. Test on unseen Maze/Mastermind; three episodes per instance. |
| [LaMer](https://arxiv.org/html/2512.16848v2#S5) · December 2025; revised March 2026 | GiGPO with cross-episode returns and trained reflection. Qwen3-4B; additional Llama3.1-8B-Instruct experiments. | Sokoban, Minesweeper, WebShop; ALFWorld transfer. Compare three-episode trials and test history/reflection ablations. |
| [SEAL](https://arxiv.org/html/2506.10943v1#S4) · June 2025 | ReST$^{\mathrm{EM}}$ outer loop; SFT/LoRA adaptation inside. Qwen2.5-7B for knowledge incorporation. | No-context SQuAD and few-shot ARC. Evaluate the adapted model; repeated updates separately expose forgetting. |

</div>

For retention, follow each task’s score after later updates. For adaptation, compare successive attempts at matched interaction or token budgets, including on unseen tasks. A final success rate alone does not distinguish these behaviors.
