# EXP-EL001 transfer partition freeze

**Partition:** TRANSFER
**Manifest:** `transfer.manifest.json`
**SHA-256 of manifest file bytes:** `5950ee376b6fd549c767af0945b1688b7adb3b46f355d0853d0f84b0dd9a023a`
**Status:** Frozen before any evaluation run on this partition.

## Selection

On 2026-09-23, NCBI PMC ESearch was queried with
`open access[filter] AND synaptic plasticity[tiab] AND 2024[dp]`,
`retmax=30`. The 30 returned IDs in API order were fixed in
`scripts/assemble-transfer.mjs` before reading source content. The
first four satisfying the licensed full-text, PMCID/PMID/DOI/version,
and four distinct 55–500-character abstract-sentence rules were
accepted. The first candidate, `PMC13452708`, was excluded for
fewer than four qualifying abstract sentences. Accepted sources:
`PMC13321751`, `PMC13271256`, `PMC13108743`, and `PMC13045196`.
None occurs in the development or blind-holdout manifests.

This partition focuses on synaptic plasticity research, a narrower
biomedical subject than the informatics-centered blind-holdout query.
Each source contributes four exact abstract-text claims with frozen
JATS paragraph paths and one synthetic absent-span failure. Types
remain `UNKNOWN`, since no semantic labels have been adjudicated.
Source expectations record identifiers, PMC version, license URL, and
the SHA-256 digest of the exact EFetch XML bytes.

The assembler writes with exclusive creation and cannot overwrite the
manifest. Re-running the unchanged packet-validity runner against this
manifest will evaluate source and span identity, missing-span behavior,
and packet replay. It cannot establish semantic domain transfer or
JEV accuracy. Source hash drift is a failure to investigate, not a
reason to silently update frozen expectations.
