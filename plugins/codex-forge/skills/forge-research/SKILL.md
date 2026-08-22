---
name: forge-research
description: Current technical research with primary-source provenance; excludes repository search and implementation.
---

# Forge Research

## Use this skill

- Research current APIs, libraries, standards, releases, or implementation options where external evidence is required.
- Don't use for facts already present in the repository, CodeGraph selection, ordinary source search, or implementation; route implementation to `$forge-deliver`.

## Rules

- Define the claims requiring evidence and prefer current primary sources for versioned behavior.
- Keep sourced fact, inference, and recommendation distinct.
- Reconcile contradictions explicitly and preserve source dates, URLs, and authority boundaries.
- Treat community reports as observations rather than universal facts.

## Steps

1. Bound the claims, freshness requirement, and preferred authority level.
2. Load the research procedure and retrieve the smallest set of primary sources that can decide the question.
3. Compare sources, identify contradictions or gaps, and label inferences.
4. Stop when the evidence supports the requested decision without collecting unrelated material.
5. Return findings, source locations, recommendations, and material uncertainty.

## Resources

- Start with the [reference router](references/index.md) for source and synthesis procedure.
- Contract and cases are in [assets/contract.json](assets/contract.json) and [evals/evals.json](evals/evals.json).

## Verify

- Done means each consequential claim has an appropriate source or an explicit uncertainty label.
- Run `python3 scripts/check.py` from this package and verify cited sources remain accessible when network is available.
- Mark network, paywalled, authentication, or external-source evidence `UNVERIFIED` when unavailable.
