# Evaluation infrastructure

`@evidencelens/evaluation` validates versioned experiment manifests, hashes their complete nested content, and scores case outcomes. Evaluation runners distinguish expected failures from unexpected failures and unexpected successes.

## Development seed

The initial `DEVELOPMENT_SEED` manifest contains five cases:

1. a complete licensed PMC packet with replay equivalence;
2. an exact span that does not exist;
3. a one-byte mutation producing a content-hash mismatch;
4. a readable PMC article without a currently recognized reusable license URL; and
5. a malformed PMCID.

Run it with:

```bash
EVIDENCELENS_RUN_AT=2026-09-23T18:00:00.000Z \
  node research/EXP-EL001-packet-validity/scripts/run-dev-seed.mjs
```

The first recorded run is `DEV-SEED-REPORT-001.json` and passed all five cases.

## Interpretation boundary

The development seed is not frozen, statistically meaningful, representative of the target domain, or part of the blind holdout. A 100% seed pass rate means only that these five engineering paths behaved as specified. It is not an EXP-EL001 pass and says nothing about JEV performance.

The development seed is separate from the frozen partitions described
below. The outstanding protocol work is a predeclared counting rule
and expansion to 150–300 source records, consolidated environment
and failure review, and a final gate decision.

## EXP-EL001 partition checkpoint

The development, blind holdout, and synaptic plasticity transfer
partitions have now run on their frozen manifests: 30/30, 50/50, and
20/20 expected deterministic outcomes respectively. See the
`research/EXP-EL001-packet-validity/` freeze records and raw reports.
These partitions use 20 distinct licensed PMC articles. The
150–300 source-record target remains unmet, and the current overall
experiment decision is `CONTINUE_RESEARCH`. None of these
deterministic case results measures JEV semantic performance.
