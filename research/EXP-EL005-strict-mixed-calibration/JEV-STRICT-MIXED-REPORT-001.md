# EXP-EL005 strict-mixed calibration report 001

**Status:** Complete development calibration; not confirmation

## Disclosure

GPT authored the 20 synthetic compound claims and all provisional references. The 60 control cases and all evidence payloads were previously exposed during development. No human independently reviewed or adjudicated this corpus. These results test JEV's behavior on deliberately explicit relations and are not a naturalistic performance estimate.

## Outcome

JEV identified 13/20 strict synthetic mixed cases (65.0% recall). This is materially higher than the 15–25% mixed recall observed with the earlier ambiguous development constructions, but six strict mixed cases were reduced to `CONTRADICTED` and one to `SUPPORTED`.

| Metric | Result |
|---|---:|
| Accuracy | 87.5% |
| Macro F1 | 0.873 |
| Mixed recall | 65.0% |
| Contradicted recall | 95.0% |
| Supported recall | 95.0% |
| Insufficient-evidence recall | 95.0% |
| Critical false reassurance | 2.5% |

## Confusion matrix

Rows are GPT-authored provisional references; columns are JEV predictions.

| Reference \ Prediction | Supported | Contradicted | Mixed | Insufficient |
|---|---:|---:|---:|---:|
| Supported | 19 | 0 | 0 | 1 |
| Contradicted | 0 | 19 | 0 | 1 |
| Mixed | 1 | 6 | 13 | 0 |
| Insufficient Evidence | 0 | 1 | 0 | 19 |

## Disagreements

- `EL005-DEV-CON-007` — reference `CONTRADICTED`; prediction `INSUFFICIENT_EVIDENCE`; support `INSUFFICIENT_EVIDENCE`; contradiction `INSUFFICIENT_EVIDENCE`
- `EL005-DEV-IE-016` — reference `INSUFFICIENT_EVIDENCE`; prediction `CONTRADICTED`; support `NO`; contradiction `YES`
- `EL005-DEV-MIX-001` — reference `MIXED`; prediction `CONTRADICTED`; support `NO`; contradiction `YES`
- `EL005-DEV-MIX-006` — reference `MIXED`; prediction `SUPPORTED`; support `YES`; contradiction `NO`
- `EL005-DEV-MIX-008` — reference `MIXED`; prediction `CONTRADICTED`; support `NO`; contradiction `YES`
- `EL005-DEV-MIX-014` — reference `MIXED`; prediction `CONTRADICTED`; support `NO`; contradiction `YES`
- `EL005-DEV-MIX-016` — reference `MIXED`; prediction `CONTRADICTED`; support `NO`; contradiction `YES`
- `EL005-DEV-MIX-017` — reference `MIXED`; prediction `CONTRADICTED`; support `NO`; contradiction `YES`
- `EL005-DEV-MIX-020` — reference `MIXED`; prediction `CONTRADICTED`; support `NO`; contradiction `YES`
- `EL005-DEV-SUP-013` — reference `SUPPORTED`; prediction `INSUFFICIENT_EVIDENCE`; support `YES`; contradiction `INSUFFICIENT_EVIDENCE`

## Interpretation

The calibration supports a narrower conclusion than contract promotion: JEV can emit `YES/YES` for clearly compound support-plus-conflict cases, but it still misses 35% of those deliberately explicit cases. Its three reused control classes remained strong at 95% recall each. The next scientifically useful step is a case-level audit of the seven strict-mixed misses, followed by a prospectively frozen, source-isolated corpus with independently reviewed natural mixed cases.

## Runtime evidence

- Raw response SHA-256: `5876aee240a7d7ff00e90762b608aa33016684b04a32fb3b316de38e88044c26`
- Resolved model: `jev-1.13.0` for all 80 cases
- Successful responses: 80/80
- Input/output tokens: 59,246 / 7,446
- Median latency: 321.6 ms
