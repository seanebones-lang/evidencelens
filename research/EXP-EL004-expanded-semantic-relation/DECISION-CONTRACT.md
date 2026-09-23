# EXP-EL004 expanded JEV decision contract

**Status:** Development contract; must be frozen before execution

JEV receives one blinded case at a time containing only `caseId`, `claim`,
`evidence`, and `domain`. It does not receive source identity, construction
target, provisional reference, authoring rationale, prior model output, or the
EXP-EL003 disagreement audit.

Each question returns exactly one of `YES`, `NO`, or
`INSUFFICIENT_EVIDENCE`. A `YES` requires direct support in the supplied text.
Missing information is not a contradiction or qualification.

## Decision 1: direct support

Does the supplied evidence directly support at least one material proposition
in the claim?

## Decision 2: direct contradiction

Does the supplied evidence directly establish the opposite of at least one
material proposition in the claim?

This question excludes missing evidence, generic uncertainty, study-design
limitations, and scope mismatch; those are evaluated separately.

## Decision 3: explicit scope mismatch

Does the supplied evidence explicitly address a materially different
population, intervention, comparator, outcome, timeframe, setting, or certainty
level than a proposition asserted by the claim?

The mismatch must be identifiable from the supplied text. An unmeasured claim
component can count only when the evidence instead measures or establishes a
materially different component. Mere silence is `INSUFFICIENT_EVIDENCE`, not
`YES`.

## Decision 4: explicit study-design limitation

Does the supplied evidence explicitly describe a study-design or evidence-base
limitation that materially narrows a proposition supported by the evidence
beyond the scope already stated in the claim?

Examples can include a materially narrower sample, setting, design, or
validation boundary. Do not count a limitation already expressed in the claim,
an unspecified generic caveat, or the mere need for future research.

## Frozen deterministic mapping

The public label is derived outside JEV by
`mapExpandedAtomicAnswers` in `@evidencelens/semantic-evaluation`:

1. Support `YES` plus any `YES` contradiction, scope mismatch, or design
   limitation → `MIXED`.
2. Direct contradiction `YES` without support `YES` → `CONTRADICTED`.
3. Support `YES` with all other decisions `NO` → `SUPPORTED`.
4. Every other combination → `INSUFFICIENT_EVIDENCE`.

An unresolved (`INSUFFICIENT_EVIDENCE`) qualification decision prevents a
`SUPPORTED` result. A scope mismatch or design limitation without direct
support does not by itself become `CONTRADICTED`.

No probability threshold is used in the first development run. Choices map
directly; probabilities and confidence are preserved for later analysis.
