# EXP-EL003 — Bounded semantic evidence relation

**Status:** Protocol draft frozen before corpus labeling

**Protocol version:** 0.1.0

**Date:** 2026-09-23

## Research question

Can a bounded semantic reviewer distinguish whether supplied, exact evidence
supports, contradicts, both supports and contradicts, or is insufficient for a
claim, while abstaining safely and preserving human authority?

This experiment evaluates the relationship between a claim and its supplied
evidence packet. It does not evaluate whether the claim is scientifically true.

## Construct

Two atomic questions are evaluated independently:

1. `EL-Q-SUP-001`: Does the supplied evidence directly support a material part
   of the claim?
2. `EL-Q-CON-001`: Does the supplied evidence directly contradict a material
   part of the claim?

Each answer is exactly `YES`, `NO`, or `INSUFFICIENT_EVIDENCE`. A deterministic
mapping produces `SUPPORTED`, `CONTRADICTED`, `MIXED`, or
`INSUFFICIENT_EVIDENCE`. Any answer pair not explicitly establishing support,
contradiction, or both maps to abstention.

## Corpus plan

Create 240 cases from licensed, exact-span evidence packets:

- 80 development cases;
- 100 blind-holdout cases; and
- 60 transfer cases from a predeclared distinct topic or evidence format.

Each partition should be approximately balanced across the four adjudicated
labels. Natural examples are preferred. Synthetic claim perturbations may be
used only when marked, capped at 25% of a partition, and generated before model
evaluation. The same source may not appear across partitions. Near-duplicate
claims and evidence spans must remain within one partition.

## Human labels

Every case requires two independent annotations made without model output,
source-status routing, other annotator labels, or partition metrics. Annotators
apply rubric version 1.0.0. Disagreement is resolved by a third adjudicator who
records a separate adjudication; original annotations remain immutable.

Before model evaluation, preserve:

- packet identifiers and hashes;
- exact evidence-span identifiers;
- claim text and declared domain;
- independent annotation records;
- adjudicated gold labels;
- source and near-duplicate group identifiers;
- synthetic/natural provenance;
- exclusion screening; and
- complete manifest and file hashes.

## Label rubric

- `SUPPORTED`: the supplied evidence directly supports at least one material
  proposition in the claim and supplies no material contradiction.
- `CONTRADICTED`: the supplied evidence directly contradicts at least one
  material proposition in the claim and supplies no material support for the
  contradicted proposition.
- `MIXED`: the supplied evidence contains material support and material
  contradiction, qualification, population mismatch, or outcome mismatch that
  prevents a support-only label.
- `INSUFFICIENT_EVIDENCE`: the packet does not contain enough directly relevant
  evidence to establish any of the other three relationships.

Annotators judge only supplied evidence. Outside knowledge cannot fill a
missing premise or override the packet.

## Excluded contexts

Exclude cases requiring diagnosis, individualized treatment, unpublished
private data, inaccessible supplemental material, image-only interpretation,
non-textual mathematical reconstruction, or specialist knowledge that the
annotation team has not declared. Exclusion happens before partition freeze.

## Controls

Run the frozen blind and transfer partitions with:

1. the primary provider and exact model version;
2. state-blind packets with publication-status fields hidden;
3. shuffled evidence from a different source and label group;
4. a deterministic lexical baseline;
5. an alternate semantic model; and
6. exact replay for unchanged inputs.

Shuffled evidence must use a frozen derangement with no source or near-duplicate
group collision.

## Metrics

Report per partition and control:

- four-class accuracy and macro F1;
- per-class precision, recall, and F1;
- confusion matrix;
- abstention rate;
- coverage conditional on non-abstention;
- inter-annotator raw agreement and Cohen's kappa before adjudication;
- critical false reassurance: gold `CONTRADICTED` or `MIXED` predicted
  `SUPPORTED`;
- shuffled-evidence false support rate;
- state-blind delta; and
- exact replay agreement.

Never report aggregate accuracy without the critical false-reassurance count.

## Predeclared research gates

Promotion beyond research requires all of:

- at least 0.80 pre-adjudication Cohen's kappa;
- at least 0.80 blind-holdout macro F1;
- at least 0.75 transfer macro F1;
- critical false-reassurance rate at or below 2%;
- shuffled-evidence `SUPPORTED` rate at or below 5%;
- exact replay agreement of 100%;
- no evidence leakage or partition overlap; and
- no critical provenance or source-integrity failure.

Failure to meet a gate yields `CONTINUE_RESEARCH` or `FAIL`, never threshold
changes against the blind labels.

## Stop conditions

Stop and preserve the failure if model output is exposed during labeling, a
blind label is used to change prompts or routing, source content cannot be
resolved to the frozen packet, partition overlap is discovered after freeze,
or an output is presented as truth rather than a Generated semantic finding.
