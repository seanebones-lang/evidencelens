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

The protocol still requires:

- 30 development claims;
- 50 frozen blind-holdout claims;
- 20 transfer claims;
- 150–300 source records;
- corpus inclusion and license rules;
- preserved expected outcomes;
- scorer and environment manifests; and
- a final `PASS`, `CONTINUE_RESEARCH`, or `FAIL` decision.
