# EXP-EL002 — Prospective source diversity expansion

**Status:** Protocol and first candidate pool frozen before article-content selection
**Date:** 2026-09-23

**Pre-freeze implementation note:** The first selection pass exposed
abstracts in Chinese. Before freezing a manifest or running evaluation,
the sentence splitter was corrected to recognize Chinese full stops
and question/exclamation marks. The candidate order, inclusion
thresholds, and source selection rule were not changed. The query
also returns articles whose first abstract sentence is not about
heart failure; stratum names describe discovery queries, not
adjudicated article topics.

## Purpose and boundary

Expand the tested source coverage without modifying EXP-EL001's
frozen 100 claims or interpreting its 100/100 result as a full pass.
EXP-EL002 is a separate prospective engineering study of source
identity, authorized exact spans, source status, and packet replay.
It does not evaluate semantic truth or JEV.

## Sampling plan

Five discovery-query strata will each contribute 26 distinct, licensed PMC
full-text article versions (130 new records total): cardiovascular,
cancer, infectious disease, neuroscience, and immunology. Each
accepted source supplies one addressable abstract sentence for a
valid packet. The first candidate IDs in each predeclared ESearch
order meeting these rules are accepted:

1. A recognizable reusable Creative Commons or public-domain license.
2. PMCID, PMID, DOI, explicit PMC version, and hashable EFetch XML.
3. An abstract paragraph containing at least one distinct sentence
   of 55–500 characters.
4. No PMCID already in EXP-EL001 or an earlier EXP-EL002 batch.

Source text is selected mechanically from the first qualifying
abstract sentence; its JATS field path, identifiers, license,
version, and XML SHA-256 are frozen before execution. The expected
outcome for a valid packet is PASS. Every fifth source also supplies
one synthetic absent-span case expected to return SPAN_NOT_FOUND.
The splitter recognizes whitespace-separated Latin sentence
boundaries and Chinese full stops/question/exclamation marks; it
does not claim perfect linguistic sentence segmentation.
Exclude candidates with typed reason codes, preserve all attempted
IDs in order, and stop rather than changing a frozen pool if fewer
than 26 qualify.

## Batch 01: cardiovascular

NCBI PMC ESearch query on 2026-09-23:
`open access[filter] AND heart failure[tiab] AND 2024[dp]`,
`retmax=60`. The ordered result list is embedded verbatim in
`scripts/assemble-batch-01.mjs`. The query and this selection rule
were committed before fetching any candidate full text.

## Decision

For each batch, freeze the manifest and file hash in a commit
before running the unchanged source, span, status, and packet
components. Compare all 26 valid outcomes and five or six
predeclared negative outcomes to the frozen labels. Source drift
fails closed. A batch PASS is only an engineering result on that
batch; the 150 distinct source-record target can be checked only
after all five batches and an overlap audit. Missing strata,
provider failures, or unreviewed deviations yield CONTINUE_RESEARCH.
