# EXP-EL002 batch 01 freeze

**Status:** Frozen before executing the batch evaluator
**Manifest:** `batch-01.manifest.json`
**Manifest file SHA-256:** `d77485d286ec0c062099ab92fe83037340d4d2d28d77e973bb9407d52e10eccf`
**Batch:** Heart-failure-query discovery cohort, with no article-level topic adjudication

The predeclared ESearch pool was read in fixed order. Twenty-six
licensed PMC article versions with PMCID, PMID, DOI, explicit version,
and XML hash qualified. `PMC13417762` was excluded because no
abstract sentence met the mechanical length rule. Each included
article appears in one positive exact-span packet case; five of
those articles also have a synthetic missing-span case. None of
these PMCID values occurs in the three EXP-EL001 partitions.

Before this freeze, the first selection pass revealed Chinese
abstracts whose punctuation was not split correctly. The selector
was corrected and run again using the same candidate order and
inclusion rules. No evaluation output was inspected or validator
changed. The fixed selector and this manifest were committed
together; the first draft manifest was never frozen or evaluated.

The batch runner requires the exact file hash above. Article hash
drift fails the case instead of refreshing a frozen expectation.
No semantic labels or model judgments are present.
