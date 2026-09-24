# EXP-EL007 source-pool checkpoint

The reproducible metadata audit reconciles all five frozen EXP-EL002 manifests
with every structured JSON/JSONL authoring record under EXP-EL003. It finds
130 distinct EXP-EL002 article versions, 52 article IDs exposed during
EXP-EL003 authoring, and **78 remaining candidate versions**. EXP-EL004 through
EXP-EL006 reuse EXP-EL003 material and add no recorded PMC article IDs.

All 78 candidates come from EXP-EL002 batches 03–05, with 26 per batch. The
recorded licenses are 41 CC BY (40 version 4.0 and one version 2.0), 13 CC
BY-NC, and 24 CC BY-NC-ND. These are metadata observations, not a legal
decision about how any text may be reused.

This audit does not establish claim suitability, true source isolation beyond
the repository records, current source-version availability, complete
article context, or independent labels. No case has been admitted to EXP-EL007
and no model request has been made. The target of 40 distinct article versions
may require additional discovery if too few candidates pass screening.

Replay with:

```bash
node research/EXP-EL007-prospective-propositions/scripts/audit-source-pool.mjs --check
```
