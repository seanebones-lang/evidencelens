# Semantic Question Registry

No question is currently approved for product routing.

| ID | Version | Construct | State | Required evidence |
|---|---:|---|---|---|
| EL-Q-REL-001 | 0.1.0 | Direct relevance of supplied evidence to the claim | Draft | Claim, exact evidence span, local context |
| EL-Q-SUF-001 | 0.1.0 | Sufficiency of the packet for bounded human review | Draft | Claim, source/status facts, evidence spans, declared review scope |
| EL-Q-CAU-001 | 0.1.0 | Causal language stronger than supplied evidence | Draft | Claim, study-design span, result span, material limitation spans |

## Required answer type

Every initial question uses:

```text
YES
NO
INSUFFICIENT_EVIDENCE
```

## Promotion states

`DRAFT → LABELED → EVALUATED → APPROVED_RESEARCH → APPROVED_PRODUCT → RETIRED`

Promotion requires a versioned question card, frozen evaluation artifacts, and an explicit decision record.

