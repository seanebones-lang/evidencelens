# EXP-EL001 blind holdout freeze

**Partition:** BLIND_HOLDOUT
**Manifest:** `blind-holdout.manifest.json`
**SHA-256 of manifest file bytes:** `0be5ffb3cf2cecccbdd1332d9a8c1eeb78c6924ae4fbf37089b57d65b10b5bd5`
**Status:** Frozen before evaluation; no holdout runner output was consulted during assembly.

## Selection

On 2026-09-23, NCBI PMC ESearch was queried with
`open access[filter] AND biomedical informatics[tiab] AND 2024[dp]`,
`retmax=50`. The 50 returned IDs, in API order, are fixed in
`scripts/assemble-blind-holdout.mjs`. The first ten meeting the following
criteria were accepted: the full-text adapter recognizes a reusable CC or
public-domain license; PMCID, PMID, DOI and version are exposed; and the
abstract contains at least four distinct sentences of 55–500 characters.
No source overlapped the development partition. The first ten candidates
met the criteria; there were no exclusions.

Four sentences per source are exact source-text claims. Each has the
addressable JATS paragraph path captured during assembly. The fifth case
per source is a synthetic sentence expected to fail exact-span lookup.
Claim type is `UNKNOWN`, since no semantic labels have been adjudicated.
The expected outcome is defined by construction, before running the
evaluation code. Every source expectation includes its identifier tuple,
version, license URL and SHA-256 hash of the exact EFetch XML response.

This holdout tests packet integrity and missing-span honesty. It does not
test JEV, support/refutation classification, clinical accuracy, or a
representative sample of biomedical literature. Ten distinct source
artifacts is also less than the protocol's eventual 150–300 source-record
target. A complete EXP-EL001 decision still requires the transfer
partition and the remaining protocol gates.

## Evaluation order

1. Verify the manifest file hash above and commit this freeze.
2. Run the unchanged development runner with
   `--manifest=research/EXP-EL001-packet-validity/blind-holdout.manifest.json`
   and a recorded run time.
3. Preserve raw output, provider request count, environment and failure
   review. Do not change a validator in response to expected answers
   without recording an amendment and creating a fresh blind partition.

The assembler writes with exclusive creation and will refuse to overwrite
the frozen manifest. A re-run may encounter changed PMC bytes; source
hash drift must be reported as drift rather than silently refreshing the
expectation.
