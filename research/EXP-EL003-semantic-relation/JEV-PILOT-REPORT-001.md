# EXP-EL003 JEV pilot report 001

**Status:** Complete exploratory pilot

## Disclosure

GPT authored the cases and the `GPT_AUTHORED_PROVISIONAL_REFERENCE` labels. No human independently annotated or adjudicated them. JEV did not author, select, or label the cases before the frozen run. These results measure compatibility with the GPT-authored construction assumptions; they are not gold-label accuracy, human agreement, scientific correctness, or clinical validity.

## Result

- Cases completed: 80/80
- Resolved model: `jev-1.13.0`
- Accuracy against provisional references: 75.0%
- Macro F1: 0.715
- Abstention rate: 32.5%
- Critical false reassurance: 12/40 (30.0%)
- Integration errors: 0
- Retries: 0 cases required more than one attempt

## Confusion matrix

Rows are GPT-authored provisional references; columns are JEV-derived labels.

| Reference \ Prediction | Supported | Contradicted | Mixed | Insufficient |
|---|---:|---:|---:|---:|
| Supported | 20 | 0 | 0 | 0 |
| Contradicted | 0 | 16 | 0 | 4 |
| Mixed | 12 | 0 | 5 | 3 |
| Insufficient Evidence | 0 | 1 | 0 | 19 |

## Per-class metrics

| Class | Precision | Recall | F1 | N |
|---|---:|---:|---:|---:|
| Supported | 0.625 | 1.000 | 0.769 | 20 |
| Contradicted | 0.941 | 0.800 | 0.865 | 20 |
| Mixed | 1.000 | 0.250 | 0.400 | 20 |
| Insufficient Evidence | 0.731 | 0.950 | 0.826 | 20 |

## Primary finding

JEV matched every provisional `SUPPORTED` case and 19/20 provisional `INSUFFICIENT_EVIDENCE` cases. The dominant weakness was `MIXED`: only 5/20 matched, while 12/20 were reduced to `SUPPORTED` and 3/20 to `INSUFFICIENT_EVIDENCE`. This produced all 12 critical false-reassurance events. The pilot therefore shows strong signal on single-direction relationships but a material sensitivity problem for simultaneous support and qualification under this two-decision contract.

## Runtime evidence

- Raw response SHA-256: `611289733e13a595b0376396cadbef56ead602d22d4ea319f448dca5d76be0e1`
- Mean latency: 454.5 ms
- Median latency: 299.6 ms
- P95 latency: 395.8 ms
- Input/output tokens: 59,205 / 7,864
- All 80 responses resolved to `jev-1.13.0`, returned HTTP 200, and succeeded on the first attempt.

## Interpretation

The outcome is interesting enough to justify targeted review and, if warranted, a confirmatory corpus with independent human annotation. It does not satisfy the original human-label promotion gates. Disagreements should be inspected as potential rubric, construction, mapping, or model errors rather than automatically attributed to JEV.
