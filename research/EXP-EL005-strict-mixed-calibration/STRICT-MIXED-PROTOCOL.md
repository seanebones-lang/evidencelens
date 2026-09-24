# EXP-EL005 strict-mixed calibration protocol

**Status:** Development calibration; no JEV prediction requested

EXP-EL005 tests whether JEV can identify `MIXED` when both support and direct
contradiction are explicit. It is not a natural-prevalence estimate or a
confirmatory holdout.

The corpus contains 80 development cases: the 60 previously exposed
`SUPPORTED`, `CONTRADICTED`, and `INSUFFICIENT_EVIDENCE` controls from
EXP-EL003, plus 20 newly authored synthetic `MIXED` claims using the existing
mixed-case evidence. Each synthetic claim contains one proposition directly
supported by the evidence and one proposition whose opposite is directly
stated by the evidence.

GPT authored the synthetic claims and all references remain
`GPT_AUTHORED_PROVISIONAL_REFERENCE`. No human independently reviewed or
adjudicated them. Results measure contract behavior on deliberately clear
calibration cases, not scientific or clinical validity.

JEV receives only `caseId`, `claim`, `evidence`, and `domain`. It answers two
typed questions:

1. Does the evidence directly support at least one material proposition?
2. Does the evidence directly establish the opposite of at least one material
   proposition?

Each answer is `YES`, `NO`, or `INSUFFICIENT_EVIDENCE`. `YES/YES` maps to
`MIXED`, `YES/NO` to `SUPPORTED`, non-YES support plus `YES` contradiction to
`CONTRADICTED`, and every unresolved remainder to `INSUFFICIENT_EVIDENCE`.
No probability threshold is tuned.

The complete corpus, references, questions, mapping, runner, and hashes must be
committed before the first JEV response. Results cannot justify promotion of a
contract without a new source-isolated corpus containing naturally occurring,
independently reviewed mixed relations.
