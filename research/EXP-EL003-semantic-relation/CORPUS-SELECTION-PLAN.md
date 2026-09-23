# EXP-EL003 corpus selection plan

**Status:** Frozen before case authoring and annotation

**Version:** 1.0.0

## Partition quotas

| Partition | Sources | Cases | Target per label | Maximum synthetic cases |
|---|---:|---:|---:|---:|
| Development | 52 | 80 | 20 | 20 |
| Blind holdout | 52 | 100 | 25 | 25 |
| Transfer | 26 | 60 | 15 | 15 |
| Total | 130 | 240 | 60 | 60 |

The target labels are quotas for corpus construction, not labels shown to
annotators. Final gold labels are created only through independent annotation
and adjudication. If adjudication changes the balance, report the observed
balance; do not relabel or discard cases to restore the target.

## Source allocation

Use the 130 frozen EXP-EL002 sources without crossing partitions:

- Development: cardiovascular batch 01 and breast-cancer batch 02.
- Blind holdout: SARS-CoV-2 batch 03 and immune-checkpoint batch 05.
- Transfer: synaptic-plasticity batch 04.

All cases from a source remain in its assigned partition. All paraphrases,
perturbations, and related claims share a near-duplicate group and remain in
one partition. The transfer partition is topic transfer within the same PMC
JATS source format; it is not source-format transfer.

## Case allocation

- Development: 28 sources contribute two cases and 24 contribute one.
- Blind holdout: 48 sources contribute two cases and four contribute one.
- Transfer: all 26 sources contribute at least two cases; eight contribute a
  third case.

Choose the sources receiving additional cases by a deterministic SHA-256 order
over `partition|pmcid`, not by model behavior or annotator outcomes.

## Authoring rules

1. Every evidence passage must already be exact-span verified against its
   frozen packet.
2. A natural case uses a claim actually made in, or faithfully reconstructed
   from, the source context without altering a material proposition.
3. A synthetic case changes one declared material proposition only. Record the
   transformation type and parent case outside the blinded assignment.
4. Do not create trivial contradictions by inserting `not` when the resulting
   sentence is unnatural or uninformative.
5. `MIXED` candidates should contain a real material qualification, population
   mismatch, outcome mismatch, or evidence tension—not merely cautious prose.
6. `INSUFFICIENT_EVIDENCE` candidates must remain plausible biomedical claims;
   nonsense or obviously unrelated text is excluded.
7. No model under evaluation may author, select, filter, or label its own cases.
8. Case authoring stops before independent annotation begins. Corrections after
   annotation require a versioned amendment and a new case identifier.

## Leakage controls

Blinded assignments contain only case ID, claim, verbatim evidence, permitted
section labels, and declared domain. They exclude partition, source identity,
packet identity, source status, intended construction label, origin, authoring
notes, other annotations, adjudication, and all model output.
