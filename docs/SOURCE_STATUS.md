# Source-status resolution

EvidenceLens resolves source identity and source status as separate deterministic operations. A record existing in Crossref or PubMed does not establish that it is current.

## PubMed status policy

The PubMed status resolver uses the NCBI EFetch XML representation and records the exact response hash, retrieval time, resolver version, explicit status signals, and linked notice PMID when supplied.

Recognized signals in version `0.1.0`:

| PubMed XML signal | EvidenceLens status |
|---|---|
| Publication type `Retracted Publication` | `RETRACTED` |
| `RetractionIn` or `RetractedandRepublishedIn` | `RETRACTED` |
| `ExpressionOfConcernIn` | `EXPRESSION_OF_CONCERN` |
| `ErratumIn`, `CorrectedandRepublishedIn`, or `UpdateIn` | `CORRECTED` |
| No recognized explicit signal | `UNKNOWN` |

Signals ending in `Of` describe the current record as a notice or related work pointing to another publication. They do not change the status of the notice itself.

When several explicit signals exist, the resolver uses this conservative precedence:

`RETRACTED` > `WITHDRAWN` > `EXPRESSION_OF_CONCERN` > `CORRECTED` > `UNKNOWN`

## Non-claim

The resolver never returns `CURRENT`. The absence of a correction or retraction signal in a retrieved record is not proof that no such event exists or that all upstream metadata is complete. A future multi-source policy may establish a separately defined current-status claim, but it must have its own evaluation gate.

## Official references

- [NCBI EFetch documentation](https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.EFetch)
- [NLM PubMed `CommentsCorrections` element](https://dtd.nlm.nih.gov/ncbi/pubmed/doc/out/250101/el-CommentsCorrections.html)
- [NLM PubMed `RefType` values](https://dtd.nlm.nih.gov/ncbi/pubmed/doc/out/250101/att-RefType-c.html)
- [NLM `PublicationType` element](https://dtd.nlm.nih.gov/ncbi/pubmed/doc/out/250101/el-PublicationType.html)
- [NLM definition of `Retracted Publication`](https://www.ncbi.nlm.nih.gov/mesh/68016441)
