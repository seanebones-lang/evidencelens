# EXP-EL002 batches 02–05 result

**Decision for all four partitions:** PASS

| Batch | Stratum | Result | Requests | Retries | Raw report SHA-256 |
|---|---|---:|---:|---:|---|
| 02 | Breast cancer | 31/31 | 52 | 0 | `3efd5762d198c16dc20eebedb24fffd7a514c10b587d419baf0d7d91a65da71a` |
| 03 | SARS-CoV-2 | 31/31 | 52 | 0 | `d33081a424625fe84814b2584dffbfcc60b430b9ecc82418fe51ca3b39db9042` |
| 04 | Synaptic plasticity | 31/31 | 52 | 0 | `0dbfe3ce0d834090479ac586a0876f61c85f4193bf764eeaeeab7424e7608716` |
| 05 | Immune checkpoint | 31/31 | 52 | 0 | `c065befc37d9c5ce398717dcc74bd69850496cf2ad4e581daa28db7130123954` |

Each frozen partition contained 26 valid exact-span packet cases and five
synthetic missing-span cases. All 104 valid cases produced stable packet
identity on replay, and all 20 negative cases failed with the predeclared
`SPAN_NOT_FOUND` code. No source identity, license, version, or content-hash
drift was observed.

Batch 02 returned 26 `UNKNOWN` publication statuses. Batches 03, 04, and 05
each returned one `CORRECTED` status and 25 `UNKNOWN` statuses. The corrected
cases were `EL002-03-011`, `EL002-04-023`, and `EL002-05-020`. These outcomes
were observed by the unchanged deterministic PubMed status resolver and did
not alter the pass criteria.

Together with batch 01, EXP-EL002 matched 155/155 predeclared deterministic
outcomes over 130 distinct licensed PMC article versions. The result establishes
the prospective source-diversity engineering gate only. It does not evaluate
semantic claim support, article relevance, scientific truth, or JEV.
