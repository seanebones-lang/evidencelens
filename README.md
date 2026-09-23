# EvidenceLens

EvidenceLens is an open-source research build for testing what we believe may be JEV's ideal use: **bounded semantic evidence review and human-review triage**.

Our goal is to determine whether a system can reliably reduce large volumes of claims and evidence into a smaller, traceable review queue without allowing the model to become the authority. Deterministic software establishes objective facts. JEV receives tightly bounded claim-and-evidence packets and answers narrow semantic questions. Humans remain responsible for the final judgment.

> EvidenceLens shows reviewers where a claim and its evidence may not line up—and shows its work.

## Research purpose

We are building EvidenceLens to test this hypothesis honestly.

The project is not intended to prove that JEV works, promote a predetermined result, or turn an experimental model into a truth engine. Questions, corpora, controls, thresholds, failures, and negative results will be preserved as part of the research record. If an attempted use fails its gate, it will not be integrated merely because the demo looks promising.

The initial research vertical is scientific claim-and-evidence review. The architecture is designed around:

- deterministic verification of identifiers, source state, hashes, exact spans, dates, and reproducible calculations;
- atomic JEV questions with an explicit `INSUFFICIENT_EVIDENCE` outcome;
- state-blind, shuffled-evidence, deterministic, and alternate-model controls;
- versioned questions, model calls, thresholds, and routing rules;
- provenance through Witness-compatible records; and
- review escalation rather than autonomous acceptance or rejection.

## Open source and participation

EvidenceLens is open source under the [MIT License](LICENSE).

Contributors are welcome. Researchers, engineers, reviewers, and domain experts are invited to inspect the methodology, challenge assumptions, reproduce experiments, propose controls, contribute adapters or evaluation cases, and document failures.

Anyone who wants to use, fork, or adapt the build may do so under the license. Please preserve the distinction between experimental semantic findings and established facts, and do not represent unevaluated behavior as scientific or medical verification.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the current development and research requirements.

## Truth boundary

EvidenceLens does **not** determine whether a claim is true. A low-priority result means only that the enabled checks did not detect a configured review condition in the supplied packet. It is not approval, verification, medical advice, or scientific certification.

## Current phase

The repository is in Phase 0/1:

- product and risk boundaries are frozen;
- EXP-EL001 defines the first evidence-packet validity experiment;
- `@evidencelens/evidence-schema` provides the canonical TypeScript model, JSON Schema, JSON-LD context, runtime invariants, and tests;
- `@evidencelens/source-adapters` begins EXP-EL001 with conservative, reproducible DOI and PubMed metadata resolution;
- PubMed source status is resolved separately from identity using explicit NLM correction and retraction signals;
- `@evidencelens/packet-builder` assembles validated packets while preserving hashed source snapshots and refusing unverified evidence;
- `@evidencelens/deterministic-checks` verifies exact spans against hash-matched, openly licensed PMC XML;
- no JEV question is approved for product use yet.

## Repository map

```text
docs/                         Product, governance, and question records
packages/evidence-schema/     Canonical packet types, schema, validation, provenance context
packages/source-adapters/     Authoritative source metadata resolution and snapshots
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
See [`docs/SOURCE_STATUS.md`](docs/SOURCE_STATUS.md) for the deterministic publication-status policy.
See [`docs/PACKET_ASSEMBLY.md`](docs/PACKET_ASSEMBLY.md) for fail-closed assembly and replay rules.
See [`docs/PMC_CONTENT.md`](docs/PMC_CONTENT.md) for licensed full-text acquisition and exact-span verification.
