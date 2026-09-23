# EvidenceLens

EvidenceLens is a provenance-first semantic review and triage system for claims and evidence.

It resolves and preserves sources, verifies objective facts in code, packages exact evidence spans, applies narrow semantic questions, exposes uncertainty, and routes claims to qualified human review.

> EvidenceLens shows reviewers where a claim and its evidence may not line up—and shows its work.

## Truth boundary

EvidenceLens does **not** determine whether a claim is true. A low-priority result means only that the enabled checks did not detect a configured review condition in the supplied packet. It is not approval, verification, medical advice, or scientific certification.

## Current phase

The repository is in Phase 0/1:

- product and risk boundaries are frozen;
- EXP-EL001 defines the first evidence-packet validity experiment;
- `@evidencelens/evidence-schema` provides the canonical TypeScript model, JSON Schema, JSON-LD context, runtime invariants, and tests;
- no JEV question is approved for product use yet.

## Repository map

```text
docs/                         Product, governance, and question records
packages/evidence-schema/     Canonical packet types, schema, validation, provenance context
research/EXP-EL001-*/         Frozen packet-validity protocol and future artifacts
```

## Development

Requirements: Node.js 22 or newer.

```bash
npm install
npm run check
```

## Planned boundaries

- JEV is accessed through a provider-neutral semantic-review adapter.
- Witness is accessed through a provenance adapter; EvidenceLens remains operable if Witness is temporarily unavailable.
- Source adapters must preserve authoritative identifiers, retrieval times, source versions, hashes, and missing-data states.
- Semantic findings are Generated records, never Observed facts.

See [`docs/PRODUCT_CHARTER.md`](docs/PRODUCT_CHARTER.md) before implementing product behavior.
