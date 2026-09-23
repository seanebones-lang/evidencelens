# Deterministic packet assembly

`@evidencelens/packet-builder` is the boundary between source acquisition and semantic review. It contains no model calls.

## Inputs

- a verbatim claim with an epistemic classification;
- one or more resolved source records;
- preserved identity-metadata snapshots;
- explicit source-status results when a PMID is used;
- evidence spans already verified against preserved source content;
- deterministic assertions; and
- review and creation provenance.

## Outputs

- a schema-valid `EvidencePacket`;
- separately preserved source snapshots with hashes, capture times, and producer versions;
- deterministic source-status and identifier-link assertions; and
- a reproducible packet hash and packet ID.

The packet ID is derived from canonical packet content before the ID is attached. Identical inputs therefore produce identical packet hashes and IDs.

## Fail-closed rules

Assembly stops when:

- no source is supplied;
- source identifiers are duplicated;
- a preserved snapshot does not match its recorded hash;
- a status result belongs to a different PMID;
- PubMed and Crossref disagree on a linked DOI;
- either side of a requested PMID/DOI link omits the DOI;
- an evidence span references an unresolved source;
- an evidence span is not marked as deterministically verified and `OBSERVED`; or
- the completed packet fails the canonical JSON Schema and graph invariants.

## Evidence-span boundary

Metadata resolution does not prove that a quotation exists in an article. The assembler does not create, infer, or bless evidence spans. A separate content-acquisition and span-verification component must match the exact verbatim text against an authorized preserved source artifact and provide an addressable locator and content hash.

Until that verifier exists, EvidenceLens can resolve and cross-check source metadata but cannot produce a complete research packet from an identifier alone.

## Snapshot policy

Raw snapshots remain outside the packet because they may be large and can have different retention authority. The packet contains their hashes and provenance. Snapshot records bind the preserved payload to the source ID, purpose, capture time, adapter or resolver name, and producer version.
