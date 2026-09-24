# EXP-EL007 lead source replay result 001

The source-replay and PubMed-status rule was committed at `f79ff40` before
execution. All 14 preselected leads replayed against the exact frozen PMC
article versions. Both recorded passage locations in every lead were verified
against the full XML; the report preserves their deterministic span IDs.
Each source exposed addressable body text, ranging from 13 to 53 paragraphs.
This count does not mean body context was reviewed.

| Replay outcome | Count |
|---|---:|
| Exact XML and both passages verified; status request completed | 14 |
| Source drift or span mismatch | 0 |
| Provider or parser error | 0 |

PubMed's explicit-signal resolver returned `UNKNOWN` for 13 articles and
`CORRECTED` for one. `UNKNOWN` means this resolver found no recognized
correction/retraction relation in the fetched record. It is not a claim that
the article is current, error-free, or independently verified.

The corrected source is `PMC12836741` (queue `EL007-SRC-038`). PubMed links
it to erratum PMID `41994012`, [PMCID `PMC13080798`](https://pmc.ncbi.nlm.nih.gov/articles/PMC13080798/).
The erratum clarifies that the original study was a compassionate-use clinical
trial. The retained original XML still describes the study in its Methods
paragraph without that qualifier. This lead is **held for explicit correction
review** before any case is authored from it. The original article and its
erratum must be read together; the automated screen does not decide whether
the proposed Conclusion/Results pairing is affected. The source remains in
the 14-lead denominator and in the raw record.

`LEAD-SOURCE-REPLAY-001.json` SHA-256:
`f36ea877247a0f20058ab699e59a90c14a85cdf644aa8d976803114b35a30b24`.

No natural claim has been admitted to EXP-EL007, and no semantic label,
proposition split, independent annotation, or JEV result has been produced.
