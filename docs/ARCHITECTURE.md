# Architecture

## System boundary

EvidenceLens is a standalone application. Witness and semantic-model providers are external dependencies behind adapters.

```text
Source identifiers/uploads
          ↓
Source adapters and immutable snapshots
          ↓
Evidence packet + exact evidence spans
          ↓
Deterministic checks
          ↓
Atomic semantic checks
          ↓
Versioned routing rules
          ↓
Human adjudication
          ↓
Witness provenance record
```

## Dependency rule

Dependencies point inward toward stable domain contracts:

- `evidence-schema` has no dependency on applications or providers.
- `source-adapters` produces evidence-schema objects without knowing about the UI.
- deterministic checks consume packet objects and emit Observed assertions.
- semantic adapters consume bounded packets and emit Generated findings.
- routing consumes facts/findings but cannot modify them.
- Witness persistence is downstream and idempotent.

## Failure behavior

- Source failures are explicit typed errors.
- Missing or ambiguous source status remains `UNKNOWN`.
- Network or provider failure cannot be interpreted as a negative finding.
- EvidenceLens writes a durable local run record before external provenance delivery.
- A failed Witness delivery enters an outbox; it does not discard the review.

## Package plan

| Package | Purpose | State |
|---|---|---|
| `evidence-schema` | Packet types, JSON Schema, JSON-LD context, graph invariants | Active |
| `source-adapters` | DOI/PubMed/PMC/ClinicalTrials/upload resolution | Active: Crossref first |
| `packet-builder` | Fail-closed assembly, snapshot preservation, status assertions, replay identity | Active |
| `deterministic-checks` | Hash, identifier, quote, date, and numeric checks | Planned |
| `semantic-review` | Provider-neutral decisions and JEV adapter | Planned after EXP-EL001 |
| `routing` | Versioned review-priority rules | Planned after question evaluation |
| `witness-adapter` | Append-only provenance delivery and outbox | Planned |
| `evaluation` | Frozen corpora, controls, scoring, reports | Planned |
