# Semantic Question Registry

No question is currently approved for product routing.

| ID | Version | Construct | State | Required evidence |
|---|---:|---|---|---|
| EL-Q-REL-001 | 0.1.0 | Direct relevance of supplied evidence to the claim | Draft | Claim, exact evidence span, local context |
| EL-Q-SUF-001 | 0.1.0 | Sufficiency of the packet for bounded human review | Draft | Claim, source/status facts, evidence spans, declared review scope |
| EL-Q-CAU-001 | 0.1.0 | Causal language stronger than supplied evidence | Draft | Claim, study-design span, result span, material limitation spans |
| EL-Q-SUP-001 | 0.1.0 | Supplied evidence directly supports a material part of the claim | Draft | Claim, exact evidence spans, local context |
| EL-Q-CON-001 | 0.1.0 | Supplied evidence directly contradicts a material part of the claim | Draft | Claim, exact evidence spans, local context |

## Required answer type

Every initial question uses:

```text
YES
NO
INSUFFICIENT_EVIDENCE
```

For EXP-EL003, `EL-Q-SUP-001` and `EL-Q-CON-001` are answered
independently. Their paired answers map deterministically:

| Support | Contradiction | Semantic label |
|---|---|---|
| YES | NO | `SUPPORTED` |
| NO | YES | `CONTRADICTED` |
| YES | YES | `MIXED` |
| Any other pair | Any other pair | `INSUFFICIENT_EVIDENCE` |

The mapping intentionally favors abstention. The labels describe the
relationship between the supplied packet and claim, not scientific truth.

## Promotion states

`DRAFT → LABELED → EVALUATED → APPROVED_RESEARCH → APPROVED_PRODUCT → RETIRED`

Promotion requires a versioned question card, frozen evaluation artifacts, and an explicit decision record.
