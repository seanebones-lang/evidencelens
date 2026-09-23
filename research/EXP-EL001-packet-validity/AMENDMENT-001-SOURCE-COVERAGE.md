# EXP-EL001 amendment 001 — Source coverage counting

**Date:** 2026-09-23
**Status:** Prospective interpretation rule; added after all three
partition runs. The frozen manifests and observed outcomes are unchanged.

The original protocol specified 150–300 source records without a
counting rule. For subsequent coverage decisions, one record means
one distinct, preserved, licensed PMC full-text article artifact with
PMCID, version, SHA-256 of XML bytes, PMID, DOI, and license URL,
referenced by at least one case in a frozen manifest. Reusing the same
article across cases, refetching it, or resolving its publication
status does not add a record. Search results and unused candidates
do not count. Distinct provider metadata may be tracked separately
but cannot be relabeled as additional full-text articles.

Under this rule, the completed partitions contain 20 distinct source
records, 130 below the original minimum. Their 100/100 deterministic
case score remains true for the narrow tested corpus. The overall
decision remains `CONTINUE_RESEARCH`, not `PASS`. The rule was
adopted after results, so it cannot retroactively validate the
original coverage target even if the count had been high.

To meet that target, freeze a prospective expansion before testing
and include at least 130 more distinct qualifying article artifacts,
each attached to a case with a predeclared expected outcome. This
would exceed the original 100-claim partition design and must be
reported as a separate expansion cohort or new experiment. Do not
append unused discovery results to EXP-EL001 or alter its frozen
manifests. Broader source formats require their own licensed-source
handling and validation protocol.

The reproducible read-only inventory is
`scripts/audit-source-coverage.mjs` and its preserved output is
`SOURCE-COVERAGE-AUDIT-001.json`.
From a fresh clone, run `npm ci && npm run build &&
npm run experiment:audit-coverage`.
