# EvidenceLens `MIXED` policy 1.0.0

**Status:** Development policy derived after EXP-EL003 and EXP-EL004; not a
retroactive relabeling or human-adjudicated standard

## Purpose

`MIXED` means that the supplied evidence directly supports at least one
material claim proposition and also contains direct text that conflicts with or
materially narrows a supported proposition. It is not a general quality score
for the paper and is not a container for every caveat.

## Required support condition

At least one material proposition must be directly supported. If no proposition
is directly supported, the case cannot be `MIXED`.

## Qualifying second condition

At least one of the following must also be directly established by the supplied
text:

1. **Direct conflict:** evidence establishes the opposite of a material
   proposition.
2. **Explicit scope mismatch:** evidence establishes a materially different
   population, intervention, comparator, outcome, timeframe, setting, or
   certainty level from one asserted by the claim.
3. **Explicit material limitation:** evidence explicitly states a limitation
   that changes the warranted scope of a supported proposition beyond limits
   already expressed by the claim.

## Exclusions

The following do not independently establish `MIXED`:

- silence or failure to measure one claim component;
- a small sample size without a claim that materially exceeds that sample;
- observational, retrospective, single-center, or preclinical design by itself;
- generic mentions of limitations, drawbacks, or future research;
- a caveat or limitation already incorporated into the claim;
- lower-than-perfect performance that remains consistent with a bounded claim;
- source prestige, publication status, or outside domain knowledge; or
- uncertainty introduced only by the reviewer rather than stated in the text.

When a compound claim has one supported component and another component with no
resolving evidence, label according to the directly established relation. Under
the four public labels, support plus mere absence is `SUPPORTED`, not `MIXED`;
the missing component should be preserved separately as a coverage flag in a
future schema.

## Claim-aware materiality

Evaluate the exact proposition, including its hedges. Evidence that is only
preclinical can still support a claim of a “potential” target. A stated need for
further research does not contradict a claim that further research is
warranted. Reversibility does not qualify a claim that already says the effect
is reversible.

## Examples from development

- Efficacy improvement plus directly reported fractures and adverse events
  against a safety proposition can be `MIXED`.
- Systematic evidence plus explicit reliance on expert opinion for part of an
  “evidence-based” claim can be `MIXED`.
- A study that supports biomarker prevalence but measures no treatment response
  does not become mixed from silence alone; it requires an explicit outcome
  mismatch or a future coverage representation.
- A limited sample does not qualify an already cohort-bounded statement merely
  because broader generalization would be unsafe.

## Governance

This policy was written after observing model output and may be used only for
development and future prospectively frozen corpora. It must not change the
frozen EXP-EL003 or EXP-EL004 scores. The accompanying policy review is
GPT-authored and requires independent human adjudication before being treated
as a reference standard.
