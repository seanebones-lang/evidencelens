# EXP-EL002 batch 01 result

**Partition decision:** PASS for the predeclared deterministic cases
**Published freeze commit:** `f89f2d440dc72f9fb845f1e62ce1c53e6703dc29`
**Manifest file SHA-256:** `d77485d286ec0c062099ab92fe83037340d4d2d28d77e973bb9407d52e10eccf`
**Raw report file SHA-256:** `e71a11a3cc45f71e4eaca8adc21094f7bfd3e113fb696d5b104f858328112aab`
**Run timestamp:** 2026-09-23T13:45:02.000Z
**Runtime:** Node.js v24.19.0

The frozen batch matched 31/31 expected outcomes: 26 valid
licensed-PMC packets with exact spans and stable replay identity,
and five synthetic missing-span cases returning `SPAN_NOT_FOUND`.
Twenty-five status lookups returned `UNKNOWN`; case `EL002-CV-010`
returned `CORRECTED`. A separate PubMed resolver check for PMID
`38890752` found an `ErratumIn` relation to PMID `39472991`
(status XML SHA-256 `bef8c9ea7a1c4630f383fb32eda375c2cdc105bfaed1968c16d2f6b8c4327ee3`).
There were 52 provider requests, zero retries, and no
observed source hash drift. Case-level details are preserved in
`BATCH-01-REPORT.json`.

This adds 26 distinct preserved article versions to the 20 in
EXP-EL001, for 46 unique articles across both studies. It does not
retroactively satisfy EXP-EL001's original source target. The
prospective expansion has 104 additional distinct articles to
collect in four planned batches. The heart-failure search query
returned mixed biomedical topics and languages; no topic relevance
or semantic support judgments were made. Neither the batch PASS
nor the combined 131 deterministic case outcomes evaluates JEV.
