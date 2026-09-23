# EXP-EL003 case authoring guide

Case authors work from frozen EvidenceLens packets and the corpus selection
plan. The authoring record must contain:

- unique case ID;
- packet ID and packet SHA-256;
- exact claim presented for review;
- one or more exact evidence spans with span ID and verbatim text;
- domain and partition;
- source group and near-duplicate group;
- `NATURAL` or `SYNTHETIC` origin;
- excluded-context screening; and
- for synthetic cases, a parent case and one named transformation.

Allowed synthetic transformations are bounded numeric change, direction
reversal, population substitution, intervention substitution, outcome
substitution, and scope strengthening. Each transformation changes only one
material proposition. Generated transformations are candidates only and must
be reviewed by a human case author before entering a manifest.

Do not store the intended construction label inside the semantic case. Maintain
construction quotas in a separate authoring ledger that is never included in
annotation assignments or model input.
