# EXP-EL007 first-pass source screen

**Status:** Pre-run rule. No source passes implied by this document.

From `SOURCE-POOL-AUDIT-001.json`, screen every candidate whose recorded
license URL is Creative Commons Attribution (`by/4.0/` or `by/2.0/`), in the
audit's existing order. This produces 41 attempts; do not replace a failed
source with one selected after viewing the result. The narrower license set
avoids relying on the additional conditions attached to the pool's NC and ND
records during this public first pass. It does not replace a rights review.

For each source, resolve PMC XML once using the existing source adapter and
compare PMCID, PMID, DOI, version, license, and complete XML SHA-256 with the
frozen EXP-EL002 record. Preserve a typed error on fetch or mismatch. For an
exact match, extract addressable abstract paragraphs and record their field
paths and text. Require at least one nonempty abstract paragraph. The screen
does not evaluate claim suitability, source context, near duplicates, or
scientific meaning. Do not use it to assign a semantic label.

Pace requests at 400 ms or more, run all 41 in order, and record retrieval
time, failures, and exact output. A transient failure remains a failure in the
first-pass report; any later retry must be a separate documented pass. The
report is an authoring queue, not a frozen EXP-EL007 corpus.
