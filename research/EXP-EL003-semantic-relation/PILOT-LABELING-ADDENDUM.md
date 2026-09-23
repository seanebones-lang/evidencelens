# EXP-EL003 GPT-authored pilot labeling addendum

**Status:** Frozen before any JEV prediction

**Date:** 2026-09-23

## Purpose

The first EXP-EL003 execution is an exploratory engineering pilot. To reduce
the cost and delay of initial feasibility testing, GPT authored the candidate
cases and assigned provisional reference labels from the predeclared
construction targets. No human independently annotated or adjudicated these
labels.

The pilot asks whether the integration and task show enough signal to justify
the original human-labeling study. It cannot establish human-level agreement,
clinical validity, or satisfaction of the protocol's research-promotion gates.

## Required terminology

Pilot labels must be called `GPT_AUTHORED_PROVISIONAL_REFERENCE` labels. They
must not be called gold labels, human labels, adjudicated labels, ground truth,
or expert annotations.

Any paper, README, release note, chart, or result derived from this pilot must
state prominently that:

- GPT authored the cases and provisional reference labels;
- the reference labels were not independently human reviewed or adjudicated;
- JEV did not author, select, or label the cases before the frozen pilot run;
- results are exploratory and may reflect GPT's construction assumptions; and
- a later confirmatory study requires independent human annotation and
  adjudication on a separately protected corpus or a prospectively frozen
  version of this corpus.

## Bias controls retained

1. Freeze cases and provisional references before requesting JEV predictions.
2. Never send intended labels, authoring ledgers, rationales, origin, source
   identity, partition, or provenance to JEV.
3. Do not change prompts, mappings, cases, or provisional labels in response to
   pilot predictions.
4. Preserve every prediction, probability, error, retry, latency measurement,
   model resolution, SDK version, and configuration.
5. Report the complete 80-case development result, all four classes, the full
   confusion matrix, abstention, coverage, and critical false reassurance.
6. Treat the original human-label protocol and promotion gates as unevaluated.

## Interpretation

Agreement with the provisional reference is evidence of compatibility with
this GPT-authored task construction, not proof of scientific correctness.
Disagreement is a review target, not automatic proof that JEV is wrong.
