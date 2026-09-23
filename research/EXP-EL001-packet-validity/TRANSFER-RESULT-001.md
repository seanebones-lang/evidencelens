# EXP-EL001 transfer result 001

**Decision for this partition:** PASS
**Local freeze commit before evaluation:** `eab3690f13f459fbcec719cf43e6bfa27cb4eece`
**Published equivalent tree commit:** `0b887839885effe9c0be8a8e65ea6ef30e436a3b`
**Manifest file SHA-256:** `5950ee376b6fd549c767af0945b1688b7adb3b46f355d0853d0f84b0dd9a023a`
**Raw report file SHA-256:** `a3e3792cd3665eba7870ad61429b0d2156575bdce91dd4684aa53c02e5cd1d48`
**Runner version:** 0.1.0
**Run timestamp:** 2026-09-23T13:31:43.000Z
**Runtime:** Node.js v24.19.0

The frozen transfer partition matched 20/20 predeclared outcomes:
16 exact-span packets passed with equivalent replay identities, and
four synthetic absent-span cases failed with `SPAN_NOT_FOUND`.
Eight provider requests completed with no retries. All valid packet
status records were `UNKNOWN`, consistent with no explicit
publication-status signal. Per-case details are in
`TRANSFER-REPORT-001.json`.

## Experiment interpretation

The three partitions now cover 100 cases in total: 30 development,
50 blind holdout, and 20 transfer. Their deterministic outcomes each
matched their frozen expectations. There are 20 distinct licensed
PMC articles across the partitions (six, ten, and four respectively).
The protocol's 150–300 source-record target has not been met or
amended, so the **overall EXP-EL001 decision remains
`CONTINUE_RESEARCH`**. The transfer partition tests the same PMC
format on a distinct query topic; it cannot support a claim of source
format transfer or semantic domain generalization.

No JEV semantic review was run. Since positive examples are chosen as
verbatim snippets and negative examples are synthetic absent strings,
these scores measure exact-span packet integrity for this corpus.
Before a scientific performance claim, broaden independent source
coverage and predeclare the source-record counting rule, add
independently annotated support/refutation cases, and evaluate
model and human routing separately.
