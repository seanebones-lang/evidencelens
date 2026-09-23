# EXP-EL001-SMOKE-001 — Licensed PMC exact-span packet

**Run time:** 2026-09-23T17:00:00.000Z  
**Result:** PASS  
**Purpose:** Exercise the first complete deterministic path from an authorized scientific full-text source to a schema-valid EvidencePacket.

## Source

- PMCID: `PMC7320186`
- PMID: `32591513`
- DOI: `10.1038/s41597-020-0543-2`
- PMC version: `PMC7320186.1`
- License: `https://creativecommons.org/licenses/by/4.0/`
- Retention authority: `OPEN_LICENSE`
- Source status result: `UNKNOWN`
- Preserved XML SHA-256: `sha256:c518bad0b5164b749fc94a72c6c60e1162af0733b2abeb10a89f9ad2a0291e9d`
- PubMed status XML SHA-256: `sha256:e6464da4517c5132551c6d46e4cb3224d57269271b66bc83816466b1dff9ba87`

`UNKNOWN` is expected: the absence of a recognized correction or retraction signal is not recorded as proof that the source is current.

## Verified span

- Section: `Abstract`
- JATS path: `/article/front/article-meta/abstract[@id='Abs1']/p[@id='Par1']`
- Offsets: `0–180`
- Span ID: `span_4d8db7d99eca223786fe7910`
- Text SHA-256: `sha256:f6bc5f0a597a2f32057d94d3af13055ac0032c91656db983fb7d98ebe36ffd58`

> PubMed® is an essential resource for the medical domain, but useful concepts are either difficult to extract or are ambiguous, which has significantly hindered knowledge discovery.

## Packet

- Packet ID: `pkt_520bc870ee208609b76f55ae`
- Packet SHA-256: `sha256:520bc870ee208609b76f55ae13c18e52f846d75da6e09fd1651ce0423e0190cc`
- Schema validation: PASS
- Graph-invariant validation: PASS
- Evidence epistemic class: `OBSERVED`
- Model calls: none

## Replay

The live path was executed twice with the frozen run timestamp. Both runs produced the same packet ID, packet hash, source XML hash, status XML hash, and span hash.

Replay command:

```bash
EVIDENCELENS_RUN_AT=2026-09-23T17:00:00.000Z \
  node research/EXP-EL001-packet-validity/scripts/build-pmc-smoke-packet.mjs --summary
```

This is a smoke result, not the frozen EXP-EL001 corpus result and not evidence of semantic-model performance.
