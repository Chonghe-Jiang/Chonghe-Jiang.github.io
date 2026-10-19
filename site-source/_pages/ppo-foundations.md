---
layout: research-post
title: "PPO: A Quick Refresher"
description: "From rewards to advantages, then actor and critic updates."
date: 2026-10-14 00:00:00 -0400
permalink: /blog/2026/revisiting-ppo/foundations/
research_blog: true
math: true
back_url: /blog/2026/revisiting-ppo/
back_label: Back to the article
sections:
  - { id: policy-gradient, title: Policy gradient }
  - { id: baseline, title: Baseline & advantage }
  - { id: gae, title: GAE }
  - { id: actor, title: Actor update }
  - { id: critic, title: Critic update }
---

PPO trains two models. The **actor** generates tokens; the **critic** predicts the reward expected from a prefix. Each round collects responses, estimates advantages, and updates both models.

## Start with the reward {#policy-gradient}

For a prompt $x$, let $s_t=(x,y_{<t})$ be the current prefix and $a_t=y_t$ the next token. A complete response $\tau$ receives a final reward $R(\tau)$. The goal is to increase its expectation:

$$
J(\theta)=\mathbb E_{\tau\sim p_\theta}[R(\tau)]
=\sum_\tau p_\theta(\tau)R(\tau).
$$

Assume a given response's reward does not directly depend on $\theta$. Using the **log-derivative identity**, $\nabla_\theta p_\theta=p_\theta\nabla_\theta\log p_\theta$,

$$
\begin{aligned}
\nabla_\theta J
&=\sum_\tau R(\tau)\nabla_\theta p_\theta(\tau)\\
&=\sum_\tau p_\theta(\tau)R(\tau)\nabla_\theta\log p_\theta(\tau)\\
&=\mathbb E_{\tau\sim p_\theta}
\left[R(\tau)\nabla_\theta\log p_\theta(\tau)\right].
\end{aligned}
$$

We differentiate how likely a response is, without differentiating the reward function. Since $p_\theta(\tau)=\prod_{t=1}^{T}\pi_\theta(a_t\mid s_t)$, its log is a sum:

$$
\nabla_\theta J
=\mathbb E_{\tau\sim p_\theta}
\left[\sum_{t=1}^{T}R(\tau)\nabla_\theta\log\pi_\theta(a_t\mid s_t)\right].
$$

## Subtract what was expected {#baseline}

Weighting every token by the final reward gives a valid but potentially noisy gradient estimate. A suitable **baseline** $b(s_t)$ can reduce that noise without changing the expected gradient.

The baseline can depend on the prefix, but not the next token. Treat it as a constant during the actor update. Its contribution averages to zero:

$$
\begin{aligned}
\mathbb E_{a\sim\pi_\theta}
\left[b(s)\nabla_\theta\log\pi_\theta(a\mid s)\right]
&=b(s)\nabla_\theta\sum_a\pi_\theta(a\mid s)\\
&=0.
\end{aligned}
$$

So we can replace $R$ with $R-b(s_t)$ in the gradient. The critic supplies a learned baseline:

$$
V_\phi(s_t)\approx\mathbb E_{\tau\sim\pi}[R\mid s_t],
\qquad
\hat A_t^{\mathrm{MC}}=R-V_\phi(s_t).
$$

This **Monte Carlo advantage estimate** measures how much the result exceeded or fell short of the critic's expectation. Positive advantage encourages the sampled token; negative advantage discourages it.

## Use intermediate predictions: GAE {#gae}

[Generalized advantage estimation](https://arxiv.org/abs/1506.02438) combines rewards with successive value predictions. Freeze the old critic while computing the one-step prediction errors:

$$
\delta_t=r_t+\gamma V_{\mathrm{old}}(s_{t+1})-V_{\mathrm{old}}(s_t).
$$

Then add them with decaying weights:

$$
\hat A_t^{(\lambda)}
=\sum_{l=0}^{T-t}(\gamma\lambda)^l\delta_{t+l}.
$$

$\gamma$ discounts future rewards. $\lambda$ controls how far the estimate looks ahead: zero uses only the next error; one includes all remaining errors.

With terminal-only rewards, $\gamma=\lambda=1$, and terminal value zero, the intermediate value terms cancel:

$$
\begin{aligned}
\hat A_t^{(1)}
&=\sum_{k=t}^{T}\left[r_k+V_{\mathrm{old}}(s_{k+1})-V_{\mathrm{old}}(s_k)\right]\\
&=R-V_{\mathrm{old}}(s_t).
\end{aligned}
$$

Smaller $\lambda$ can reduce variance, but relies more on the critic's predictions and can introduce bias. A response cut off by a length limit needs an explicit terminal or bootstrap rule.

## Update the actor {#actor}

A fixed behavior policy $\mu$ generates the rollout batch $\mathcal D$. As the actor changes, compare its token probabilities with those used to collect the data:

$$
\rho_t(\theta)=\frac{\pi_\theta(a_t\mid s_t)}{\mu(a_t\mid s_t)}.
$$

[PPO](https://arxiv.org/abs/1707.06347) maximizes the clipped objective, keeping advantages fixed:

$$
\begin{aligned}
J_{\mathrm{clip}}(\theta)
=\mathbb E_{\mathcal D}\big[\min\big(&\rho_t\hat A_t,\\
&\operatorname{clip}(\rho_t,1-\epsilon,1+\epsilon)\hat A_t\big)\big].
\end{aligned}
$$

For positive advantage, there is no extra benefit once the ratio exceeds $1+\epsilon$. For negative advantage, there is no extra benefit from pushing it below $1-\epsilon$. Clipping limits the incentive for a large update; it does not guarantee that the policy stays within those bounds.

Before clipping activates, the gradient contribution is $\rho_t\hat A_t\nabla_\theta\log\pi_\theta(a_t\mid s_t)$. The ratio corrects action probabilities at sampled prefixes; it does not fully correct the distribution of prefixes. KL penalties and entropy bonuses are omitted here.

## Update the critic {#critic}

The critic learns to predict a return target. A common choice is

$$
\begin{aligned}
Y_t&=\operatorname{stopgrad}\!\left[V_{\mathrm{old}}(s_t)+\hat A_t^{(\lambda_V)}\right],\\
L_V(\phi)&=\frac12\mathbb E_{\mathcal D}\left[(V_\phi(s_t)-Y_t)^2\right].
\end{aligned}
$$

The target stays fixed during regression. For a completed terminal-reward episode with $\gamma=\lambda_V=1$, it simplifies to $Y_t=R$. Smaller $\lambda_V$ mixes observed rewards with old value predictions. The actor and critic can use different $\lambda$ values.

**The actor increases expected reward; the critic reduces prediction error.** Papers can change the critic's targets, inputs, sample weights, or training data. A general form is

$$
L_V=\mathbb E_{\mathcal D}
\left[m_t^V\,\omega_x\,\ell(V_\phi(s_t),Y_t)\right],
$$

where $m_t^V$ selects training positions, $\omega_x$ weights examples or prompts, and $\ell$ is the regression loss.
