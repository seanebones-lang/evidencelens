# JEV pilot decision contract

**Status:** Frozen before any JEV prediction

JEV receives one case at a time with only `caseId`, `claim`, `evidence`, and
`domain`. Evidence items contain verbatim text and, when permitted, a generic
section label. Packet IDs, source identities, partition, origin, authoring
rationales, construction targets, provisional references, and all prior model
output are excluded.

The task is split into two bounded decisions rather than asking JEV to generate
an explanation or directly imitate the four-class construction target.

## Decision 1: material support

Question: Does the supplied evidence directly support at least one material
proposition in the claim?

Allowed typed values:

- `YES`
- `NO`
- `INSUFFICIENT_EVIDENCE`

## Decision 2: material contradiction or qualification

Question: Does the supplied evidence directly contradict, materially qualify,
or materially mismatch the population, intervention, outcome, scope, or
certainty of at least one proposition in the claim?

Allowed typed values:

- `YES`
- `NO`
- `INSUFFICIENT_EVIDENCE`

JEV's probabilities and confidence metadata must be retained exactly as
returned. The four-class result is produced only by the frozen deterministic
mapping in `@evidencelens/semantic-evaluation`; JEV is not asked to generate a
free-form label or rationale.

No probability threshold is tuned in the first pilot. If the official SDK
requires a choice among the declared values, the returned choice is mapped
directly. Any malformed, missing, transport-failed, or unrecognized response is
recorded as an integration error rather than silently coerced.
