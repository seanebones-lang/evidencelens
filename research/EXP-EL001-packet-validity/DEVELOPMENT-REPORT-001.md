# EXP-EL001 Development Report 001

**Decision:** PASS

**Partition:** DEVELOPMENT

**Manifest version:** 1.0.0

**Manifest frozen:** yes

**Manifest SHA-256:** `5154a0ab562653f757dacc9900cd3d340a6a08d14e69dacdcaef3a40a0b1ba3a`

**Fixed run time:** 2026-09-23T19:00:00.000Z

**Runner version:** 0.1.0

## Result

- 30 of 30 claim packets passed.
- Six licensed PMC source artifacts matched their frozen PMCID, PMID, DOI,
  version, license URL, and content hash.
- Every evidence span matched exact normalized text within its expected JATS
  paragraph.
- Ambiguous text remained fail-closed unless the frozen locator selected one
  addressable paragraph.
- Every packet replay produced the same packet identifier and packet hash.
- PubMed status resolution was recorded for every source; all six returned
  `UNKNOWN`, rather than being incorrectly promoted to `CURRENT` without an
  explicit status signal.
- The live run made 12 provider requests with zero retries.

## Test baseline

The repository test suite passed 55 of 55 tests before this run:

- deterministic checks: 9;
- evaluation: 7;
- evidence schema: 6;
- packet builder: 10; and
- source adapters: 23.

## Interpretation

This passes the development engineering gate for exact, reproducible evidence
packets on the frozen licensed-PMC corpus. It is not a scientific-performance
claim and does not expose the future blind-holdout labels. The next experiment
step is to construct and freeze the 50-claim blind holdout before making any
validator changes against it.
