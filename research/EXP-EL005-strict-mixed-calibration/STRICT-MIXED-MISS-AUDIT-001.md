# EXP-EL005 strict-mixed miss audit 001

**Status:** GPT-authored post-hoc diagnostic; not human adjudicated

This audit examines the seven synthetic `MIXED` cases that JEV did not map to
`YES/YES`. It does not change the frozen claims, references, mapping, or score.

## Finding

The misses are strongly asymmetric. In six cases JEV recognized the directly
contradicted proposition but answered `NO` to direct support. In one case it
recognized the supported proposition but answered `NO` to direct contradiction.
None of the seven misses was an abstention on both questions.

| Case | Support | Contradiction | Predicted | Miss type |
|---|---|---|---|---|
| `EL005-DEV-MIX-001` | NO | YES | CONTRADICTED | Support omitted |
| `EL005-DEV-MIX-006` | YES | NO | SUPPORTED | Contradiction omitted |
| `EL005-DEV-MIX-008` | NO | YES | CONTRADICTED | Support omitted |
| `EL005-DEV-MIX-014` | NO | YES | CONTRADICTED | Support omitted |
| `EL005-DEV-MIX-016` | NO | YES | CONTRADICTED | Support omitted |
| `EL005-DEV-MIX-017` | NO | YES | CONTRADICTED | Support omitted |
| `EL005-DEV-MIX-020` | NO | YES | CONTRADICTED | Support omitted |

## Evidence check

- `MIX-001`: the evidence says fluorescence imaging can measure dissolved
  oxygen, while also stating that two ratiometric microsensors were created.
- `MIX-006`: the evidence calls host immunometabolism an attractive target, but
  says the infectious-disease association remained underappreciated rather than
  extensively studied.
- `MIX-008`: the evidence identifies RHE-334 and EA-11 as promising inhibitors
  and says both were tested against MCF-7 human breast-cancer cells.
- `MIX-014`: the review discusses biomedical uses and explicitly discusses
  drawbacks and implementation difficulties.
- `MIX-016`: the evidence characterizes cardiac abnormalities as a laminopathy
  feature and says the 12-year-old patient presented with cardiac failure.
- `MIX-017`: the evidence says Rab27B loss blocked fusion but that deficient
  cells remained proficient in two-dimensional growth.
- `MIX-020`: the evidence calls the protocol safe and feasible but reports lower,
  not higher, symptom reporting at 60 minutes.

## Interpretation

All seven frozen references remain defensible under the deliberately literal
calibration rule. The observed pattern suggests that, for some compound claims,
JEV collapses the whole claim toward the more salient conflicting proposition
instead of independently answering whether any other material proposition is
supported. This is a hypothesis from synthetic development data, not a claim
about naturalistic behavior.

The next contract experiment, if pursued, should test proposition-level
decomposition against the same frozen cases without changing their wording or
references. Any such result would remain tuned development evidence. Promotion
still requires a new source-isolated corpus with independent human review.
