# EXP-EL004 expanded-contract development report 001

**Status:** Complete development experiment; contract not promoted

## Disclosure

The contract was designed after inspecting EXP-EL003 disagreements and was evaluated on the same 80 exposed development cases against the same GPT-authored provisional references. This is a diagnostic paired comparison, not independent confirmation. No human independently reviewed or adjudicated the references.

## Outcome

The expanded contract did **not** improve development performance and must not advance unchanged to a confirmatory holdout.

| Metric | v1 | v2 expanded | Change |
|---|---:|---:|---:|
| Accuracy | 75.0% | 75.0% | +0.0% |
| Macro F1 | 0.715 | 0.698 | -0.017 |
| Mixed recall | 25.0% | 15.0% | -10.0% |
| Contradicted recall | 80.0% | 95.0% | +15.0% |
| Critical false reassurance | 30.0% | 35.0% | +5.0% |

## v2 confusion matrix

Rows are GPT-authored provisional references; columns are v2 predictions.

| Reference \ Prediction | Supported | Contradicted | Mixed | Insufficient |
|---|---:|---:|---:|---:|
| Supported | 19 | 0 | 0 | 1 |
| Contradicted | 0 | 19 | 0 | 1 |
| Mixed | 14 | 0 | 3 | 3 |
| Insufficient Evidence | 0 | 1 | 0 | 19 |

## Paired changes

- Both correct: 56
- v1 only correct: 4
- v2 only correct: 4
- Both incorrect: 16
- Predictions changed: 8

- `EL003-DEV-CON-003` — reference `CONTRADICTED`; v1 `INSUFFICIENT_EVIDENCE`; v2 `CONTRADICTED`
- `EL003-DEV-CON-014` — reference `CONTRADICTED`; v1 `INSUFFICIENT_EVIDENCE`; v2 `CONTRADICTED`
- `EL003-DEV-CON-020` — reference `CONTRADICTED`; v1 `INSUFFICIENT_EVIDENCE`; v2 `CONTRADICTED`
- `EL003-DEV-MIX-003` — reference `MIXED`; v1 `MIXED`; v2 `SUPPORTED`
- `EL003-DEV-MIX-005` — reference `MIXED`; v1 `MIXED`; v2 `SUPPORTED`
- `EL003-DEV-MIX-012` — reference `MIXED`; v1 `MIXED`; v2 `SUPPORTED`
- `EL003-DEV-MIX-013` — reference `MIXED`; v1 `SUPPORTED`; v2 `MIXED`
- `EL003-DEV-SUP-013` — reference `SUPPORTED`; v1 `SUPPORTED`; v2 `INSUFFICIENT_EVIDENCE`

## Interpretation

Separating direct contradiction substantially improved negation handling: contradicted recall rose from 80% to 95%. However, JEV almost always answered NO to explicit scope mismatch and explicit design limitation, reducing mixed recall from 25% to 15%. Four cases improved and four regressed, leaving accuracy unchanged while worsening macro F1 and critical false reassurance.

The result argues against sending this contract to a new holdout. The next development step must first resolve the target definition for `MIXED`: direct conflicting evidence should remain distinct from methodological caution, absent outcomes, and claims that already contain their own limitation. Only after that semantic policy is frozen should another contract be designed.

## Runtime evidence

- Raw response SHA-256: `45057ba781396fb282eb75b2a9e843f3e1ffd611b954ccaa55c0d5312c250e8d`
- Resolved model: `jev-1.13.0` for all 80 cases
- All cases returned successfully on the first attempt.
- Median latency: 425.7 ms
- Input/output tokens: 84,645 / 14,972
