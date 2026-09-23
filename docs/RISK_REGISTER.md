# Risk Register

**Version:** 0.1.0  
**Review cadence:** At every experiment close and before every release

| ID | Risk | Initial severity | Primary control | Stop condition |
|---|---|---:|---|---|
| R-001 | False reassurance: an unflagged claim is treated as correct | Critical | No truth/approval language; show enabled checks and limitations; measure false reassurance | Users systematically interpret routine review as verification |
| R-002 | Wrong or fabricated source/span | Critical | Canonical identifiers, source hashes, exact locators, byte verification | Any displayed span cannot resolve to its preserved source version |
| R-003 | Stale correction or retraction status | High | Timestamped status checks and refresh on reopen/export | Status cannot be refreshed or conflicts remain unresolved |
| R-004 | Model output becomes authority | Critical | Store semantic outputs as Generated; require human adjudication | A workflow grants permission or rejects work solely from a semantic finding |
| R-005 | Extraction error presented as observation | High | Preserve verbatim content; verify candidate spans; label extraction method | Generated content appears as verbatim source content |
| R-006 | Domain-transfer collapse | High | Domain-scoped releases, blind transfer sets, abstain by default | Transfer metric exceeds approved degradation limit |
| R-007 | Question wording drift | High | Immutable question registry and frozen replay | Production wording differs from evaluated wording |
| R-008 | Model-version drift | High | Pin exact model; rerun gates for upgrades | Provider changes behavior without an identifiable reproducible version |
| R-009 | Privacy or IP misuse | Critical | Authorized inputs, minimum retention, license metadata, deletion policy | Unauthorised content is retained, transmitted, or redistributed |
| R-010 | Aggregate metrics hide critical misses | High | Per-class confusion matrices, false-reassurance metrics, coverage | Release decision lacks critical-class and coverage reporting |
| R-011 | Witness outage loses provenance | High | Local durable outbox, idempotent writes, later reconciliation | A run can complete without a durable local provenance record |
| R-012 | Automation bias from polished explanations | High | Structural explanations; no generated rationale by default; UX study | Review quality declines or override reluctance becomes material |

## Risk acceptance rule

EvidenceLens is appropriate only when errors create review rather than irreversible action, qualified humans remain downstream, underlying sources remain inspectable, and residual risk has been accepted for the exact evaluated context.

