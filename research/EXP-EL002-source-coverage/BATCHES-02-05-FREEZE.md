# EXP-EL002 batches 02–05 freeze

**Status:** Frozen before any batch 02–05 evaluation
**Candidate-pool file SHA-256:** `e7559e28ab62720535aa94abe2ba25d4ad41c88625909e10056d17765ff3dcce`

| Batch | Query stratum | Manifest file SHA-256 | Sources | Cases | Exclusions |
|---|---|---|---:|---:|---:|
| 02 | Breast cancer | `735dc31c9b9a9ffbd4e64a5b4e0cc6fb0cc1cf677ffc5bb17b9780c3b112b40e` | 26 | 31 | 2 |
| 03 | SARS-CoV-2 | `a210e38aa744baf4e221e8bb68743e9777cac0663aad3275cea77d1066dbd090` | 26 | 31 | 3 |
| 04 | Synaptic plasticity | `c80ccf1331dbf2d36a09b87c68424d1f10ad6d6cb2035f133b31e4536827f122` | 26 | 31 | 6 |
| 05 | Immune checkpoint | `7440354cca920e9ca0fe23dbdf009f04dcb5383aa23de750a73e5fcb6672bc45` | 26 | 31 | 1 |

Each accepted source has one valid exact abstract-span case; every
fifth also has one synthetic absent-span case. The source and case
lists are frozen in each manifest. Exclusions, including missing
metadata, no qualifying abstract sentence, overlap with an earlier
partition, and unrecognized licenses, remain in those manifests.
The 130 EXP-EL002 article IDs are disjoint from each other and
from the 20 EXP-EL001 article IDs. Thus 150 distinct article
records are **assembled**, pending the 124 expected outcomes in
these four batches.

Run each unchanged batch evaluator with both its manifest path and
the exact file hash from the table, for example:

```bash
node research/EXP-EL002-source-coverage/scripts/run-next-batch.mjs \
  --manifest=research/EXP-EL002-source-coverage/batch-02.manifest.json \
  --expected-sha256=735dc31c9b9a9ffbd4e64a5b4e0cc6fb0cc1cf677ffc5bb17b9780c3b112b40e
```

Source content drift or an unexpected status/provider error must
remain visible in the raw case report. Do not update a frozen
manifest to repair a failed outcome.
