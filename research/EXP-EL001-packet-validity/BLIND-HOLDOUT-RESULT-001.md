# EXP-EL001 blind holdout result 001

**Decision for this partition:** PASS
**Local freeze commit before evaluation:** `51382eec8e33f0c879f53162ac242527f6cba7e3`
**Published equivalent tree commit:** `cb56d90eafca6036ccab2290028953786994c530`
**Manifest file SHA-256:** `0be5ffb3cf2cecccbdd1332d9a8c1eeb78c6924ae4fbf37089b57d65b10b5bd5`
**Raw report file SHA-256:** `6500d683e219a24fbb3c6996714f45956a969b2b3d82d82400c7ca58ec82bad3`
**Runner version:** 0.1.0
**Run timestamp:** 2026-09-23T13:27:30.000Z
**Runtime:** Node.js v24.19.0

The frozen holdout produced 50/50 expected outcomes: 40 valid packets
with exact addressable spans and byte-equivalent packet identity on replay,
plus 10 missing-span cases rejected with `SPAN_NOT_FOUND`. There were
20 provider requests and zero retries. The status resolver conservatively
returned `UNKNOWN` for all 40 valid cases.

The runner's `PASS` means only that this frozen partition matched its
predeclared deterministic outcomes. It does not complete the EXP-EL001
protocol: the 20-claim transfer partition, 150–300 source-record target
and full final gate review remain. No JEV model or semantic support
judgment was evaluated. The raw per-case output is preserved in
`BLIND-HOLDOUT-REPORT-001.json`.
