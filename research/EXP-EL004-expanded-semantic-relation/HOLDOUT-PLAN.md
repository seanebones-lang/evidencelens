# EXP-EL004 confirmatory holdout plan

**Status:** Prospective plan; corpus not yet constructed

## Size and balance

- 80 cases total;
- 20 provisional `SUPPORTED`;
- 20 provisional `CONTRADICTED`;
- 20 provisional `MIXED`; and
- 20 provisional `INSUFFICIENT_EVIDENCE`.

## Isolation

- no source group used in EXP-EL001, EXP-EL002, or EXP-EL003;
- no near-duplicate claim, abstract, or transformation family from development;
- all source snapshots and exact spans pinned before JEV exposure;
- authoring ledger stored separately from blinded inputs; and
- JEV must not select, author, filter, or label holdout cases before freeze.

## Mixed-case construction

Each provisional `MIXED` case must identify both:

1. the exact material proposition directly supported; and
2. an exact text span establishing direct contradiction, explicit scope
   mismatch, or an explicit design limitation that extends beyond the claim's
   already stated scope.

Missing evidence alone cannot establish `MIXED`. Generic statements such as
“limitations exist,” “more research is needed,” or a small sample size do not
qualify unless the claim materially generalizes beyond the evidence and the
limitation is explicit in the supplied text.

## Pre-execution audit

Before freeze, mechanically verify class balance, unique case IDs, source and
near-duplicate isolation, exact-span retention authority, blinded-field shape,
and zero provisional-reference leakage. Record canonical hashes for candidates,
references, blinded inputs, contract, mapping implementation, and runner.

## Interpretation

If the references remain GPT-authored, the holdout estimates compatibility
with a prospectively frozen synthetic construction standard. It does not
estimate agreement with clinicians, domain experts, or independent human
annotators.
