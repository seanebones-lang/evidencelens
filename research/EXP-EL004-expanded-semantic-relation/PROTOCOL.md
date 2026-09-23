# EXP-EL004 expanded semantic-relation protocol

**Status:** Development protocol; no EXP-EL004 JEV prediction requested

**Date:** 2026-09-23

## Research question

Does separating direct contradiction, scope mismatch, and explicit
study-design limitation improve detection of mixed claim/evidence relations
without reducing performance on supported, contradicted, or insufficient cases?

## Motivation

EXP-EL003 produced 75.0% agreement with GPT-authored provisional references.
Its post-hoc disagreement audit found that the single combined
contradiction/qualification question mixed distinct concepts: direct logical
opposition, unmeasured or mismatched outcomes, methodological limitations, and
mere absence of evidence. The audit also found weak provisional references and
rubric ambiguity, so EXP-EL003 must not be reinterpreted as a clean model-error
estimate.

## Phases

1. **Development:** use the already exposed 80 EXP-EL003 development cases to
   test integration and diagnose the expanded decision contract. These results
   are tuned development evidence and cannot confirm improvement.
2. **Contract freeze:** freeze questions, criteria, mapping, SDK version, model
   alias, runner, and all thresholds before constructing or exposing the new
   holdout to JEV.
3. **Confirmatory holdout:** construct a new, source-isolated balanced corpus.
   No source group or near-duplicate group may overlap EXP-EL003 development.
4. **Single execution:** run the frozen contract once on the complete holdout.
   Preserve all raw outputs, probabilities, errors, retries, model resolution,
   latency, and token usage.

## Reference-label disclosure

Unless independent human annotation is later supplied, labels remain
`GPT_AUTHORED_PROVISIONAL_REFERENCE`. They are not gold labels, ground truth,
expert annotations, or evidence of clinical validity. Development and
confirmatory reports must retain that disclosure.

## Primary metrics

- four-class accuracy;
- macro F1;
- per-class precision, recall, and F1;
- full confusion matrix;
- insufficient-evidence rate and non-abstention coverage;
- critical false reassurance, defined as a provisional `CONTRADICTED` or
  `MIXED` case mapped to `SUPPORTED`; and
- atomic-answer distributions and probability margins by decision type.

## Comparison rule

The v1 and v2 contracts may be compared on the EXP-EL003 development corpus
only as a diagnostic paired analysis. Any claim that v2 improves generalization
requires the new holdout. No prompt, mapping, threshold, or reference may be
changed after the first holdout response is observed.

## Promotion boundary

EXP-EL004 remains exploratory until independently annotated human references
exist. A synthetic confirmatory holdout can demonstrate reproducibility and
contract behavior, but cannot satisfy human-agreement or clinical-validation
gates.
