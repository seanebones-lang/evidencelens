# EXP-EL003 JEV development pilot freeze

**Status:** Frozen; JEV execution not run

**Date:** 2026-09-23

This freeze establishes the exploratory development pilot before any JEV
prediction is requested.

## Disclosure

GPT authored the cases and the provisional reference labels. No human
independently annotated or adjudicated them. The references are suitable only
for exploratory comparison and must not be described as gold labels, ground
truth, expert annotations, or evidence of clinical validity.

## Frozen artifacts

- Pilot-labeling addendum SHA-256:
  `26b68e5e1264a443541cbb0c7176982fa2451b904e2dc3ffb3b488caa9be644d`
- JEV decision-contract SHA-256:
  `719f19c200472e207ed19f90c8d421aad9a95e145f33c0d798702cefc36f1ea1`
- GPT-authored provisional-reference file SHA-256:
  `6131e23692da440a862c5080ef72c66117c3299b7d85118dc9becf7afa956a51`
- Blinded JEV input file SHA-256:
  `f11e25ddef28c5ca965f1298faf7906dff57ff0e33b849abe2124c92bf0c9907`
- Candidate canonical hash recorded by the reference assembler:
  `sha256:0ed0090e174b3d46dc3738eee90d4a207f3fd4c79bd79fa0f8c9b0efa6abfea6`
- Blinded input canonical hash:
  `sha256:d2a6d1bfd0dd89a617aced005aea2881df7af38f3f63ce63ee10fa27733a095d`

## Frozen shape

- Cases: 80
- Provisional construction references: 20 per class
- Decisions requested from JEV per case: two
- Allowed atomic values: `YES`, `NO`, `INSUFFICIENT_EVIDENCE`
- Four-class mapping: deterministic and external to JEV
- Intended model alias: `jev-latest`; the resolved model version must be
  recorded from the actual response or SDK metadata

## Execution boundary

The repository state contains no JEV predictions. Execution requires a
configured `TYPESAFE_API_KEY`, the official SDK, and a version-recorded pilot
runner. Cases, provisional references, the decision contract, and scoring must
not be changed after a JEV response is observed.
