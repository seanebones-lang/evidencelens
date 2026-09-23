# EXP-EL001 — Evidence-Packet Validity

**Status:** Frozen protocol; development partition passed 30/30
**Protocol version:** 0.1.0
**Date:** 2026-09-23

## Research question

Can EvidenceLens construct exact, reproducible, provenance-preserving evidence packets from authorized scientific sources without fabricating or misattributing identifiers, content, source status, or deterministic assertions?

## Hypothesis

A strict source-resolution and span-verification pipeline can meet the packet-integrity gates required before any semantic-model performance claim is meaningful.

## Scope

- 100 explicit scientific claims;
- 150–300 source records;
- DOI and PubMed/PMC paths;
- optional ClinicalTrials.gov identifiers when naturally present;
- authorized uploaded documents;
- exact source-span addressability;
- source-status snapshots; and
- deterministic assertion replay.

No JEV decision affects the primary EXP-EL001 outcomes.

## Corpus partitions

- 30 development claims;
- 50 frozen blind-holdout claims;
- 20 transfer claims from a distinct biomedical subdomain or source format.

The final manifest will record inclusion rules, licenses, identifiers, expected locators, and SHA-256 hashes. Holdout expected results must not be inspected while changing validators.

The 30-claim development manifest was frozen at
`sha256:5154a0ab562653f757dacc9900cd3d340a6a08d14e69dacdcaef3a40a0b1ba3a`
after a 30/30 deterministic packet-validity run. The 50-claim blind holdout
was assembled and frozen at file SHA-256
`0be5ffb3cf2cecccbdd1332d9a8c1eeb78c6924ae4fbf37089b57d65b10b5bd5`
before evaluation; see `BLIND-HOLDOUT-FREEZE.md`. The transfer partition
remains unbuilt.

## Primary outcomes

1. Identifier-resolution correctness.
2. Exact-span/source-version correctness.
3. Source-status correctness at retrieval time.
4. Deterministic-assertion reproducibility.
5. Missing-data honesty.
6. Replay equivalence.

## Proposed gates

- 100% of displayed spans resolve to the preserved source version.
- 100% of deterministic assertions identify code version and input references.
- At least 99.5% identifier and locator correctness across the frozen set.
- Zero fabricated identifiers, passages, or source-status records.
- Replay yields byte-equivalent semantic input for unchanged packets.
- Transfer performance degrades by no more than one percentage point on identifier and locator correctness.

These are engineering gates, not performance claims.

## Failure taxonomy

- `IDENTIFIER_UNRESOLVED`
- `IDENTIFIER_MISMATCH`
- `SOURCE_UNAVAILABLE`
- `SOURCE_UNAUTHORIZED`
- `SOURCE_VERSION_UNKNOWN`
- `SOURCE_STATUS_UNKNOWN`
- `SPAN_NOT_FOUND`
- `SPAN_AMBIGUOUS`
- `HASH_MISMATCH`
- `PARSER_FAILURE`
- `DETERMINISTIC_ASSERTION_NOT_REPRODUCIBLE`
- `PACKET_SCHEMA_INVALID`
- `PROVENANCE_INCOMPLETE`

## Artifacts to preserve

- protocol and amendments;
- corpus manifest and hash;
- source adapter versions;
- allowed source snapshots or stable references;
- expected outcomes;
- raw run outputs and hashes;
- scoring implementation;
- environment manifest;
- failure review;
- final report; and
- `PASS`, `CONTINUE_RESEARCH`, or `FAIL` decision.

## Stop rule

Stop semantic integration work if any displayed source content cannot be traced exactly to the preserved authorized artifact, or if the system fabricates an identifier, passage, or status.
