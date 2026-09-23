# EvidenceLens evaluation integrity charter

**Status:** Binding for EXP-EL003 before model evaluation

EvidenceLens is intended to give JEV a fair opportunity to perform the bounded
semantic-judgment task for which it is being evaluated. Fairness does not mean
engineering the corpus to produce favorable scores. It means implementing the
official system competently, presenting the task clearly, and preventing any
knowledge of protected outcomes from influencing configuration or reporting.

## Governing principle

Optimize the task and integration for JEV's intended strengths. Never optimize
the answers, corpus, or reported result for JEV's observed behavior.

## Commitments to a capable integration

1. Use the official SDK, supported model identifier, and documented structured
   output mechanisms available when the run is frozen.
2. Give the model concise label definitions, a bounded input schema, and only
   the evidence it is permitted to judge.
3. Develop prompts, examples, retry policy, and parsing behavior exclusively on
   the development partition.
4. Record the exact model resolution, SDK version, prompt, schema,
   configuration, runtime, timestamps, latency, errors, and retry behavior.
5. Separate transport, authentication, parsing, and integration failures from
   semantic prediction errors.
6. Preserve raw responses and normalized predictions needed for independent
   replay and audit, subject to provider terms and credential hygiene.
7. Apply equivalent care to every reported baseline; no baseline receives an
   intentionally weaker task definition or implementation.

## Prohibited adaptation

1. Do not expose blind-holdout or transfer labels before the final run.
2. Do not author, select, remove, relabel, or rewrite cases in response to JEV
   predictions.
3. Do not tune prompts, examples, thresholds, or retries on protected
   partitions.
4. Do not discard inconvenient predictions, abstentions, errors, or latency.
5. Do not change a reported configuration without a new versioned run.
6. Do not treat construction targets as gold labels; only independent
   annotation and adjudication create gold labels.

## Reporting standard

The final record must answer three separate questions:

1. Was JEV integrated according to its intended interface and current official
   guidance?
2. Was the evaluation corpus frozen, blinded, source-isolated, independently
   annotated, and scored without outcome-driven changes?
3. How did JEV perform overall and by class, including abstention, coverage,
   disagreements, failures, latency, and critical false reassurance?

All material claims in the final report must point to committed protocols,
manifests, raw run artifacts, or deterministic summaries in the repository.
