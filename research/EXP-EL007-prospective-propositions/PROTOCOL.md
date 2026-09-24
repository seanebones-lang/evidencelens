# EXP-EL007 prospective proposition evaluation

**Status:** Protocol only. No corpus frozen, model requests made, or result claimed.

## Question

On previously unused, source-isolated natural scientific claims, does an
explicit proposition split improve detection of concurrent direct support and
direct contradiction over the frozen EXP-EL005 compound-claim contract?

EXP-EL006 supplies the hypothesis, not cases or expected answers. No EXP-EL003
through EXP-EL006 claim, evidence passage, article version, source group, or
near-duplicate claim may enter this experiment. Source identity and overlap
checks must be retained in the private construction record and excluded from
model input.

## Case construction and references

Collect natural, attributable claim-and-evidence pairs from openly reusable
article versions. The initial metadata pool is recorded in
`SOURCE-POOL-AUDIT-001.json`: 78 EXP-EL002 article versions absent from all
EXP-EL003 structured authoring records. Its membership is only a starting
point; article content, rights for the intended use, natural claim suitability,
and near-duplicate claims still require screening. Preserve exact source
versions, licenses, passage hashes, retrieval times, and the original claim
wording. Do not rewrite a claim to force a class. Screen excluded context and
near duplicates before assignment.

Two independent reviewers, blind to JEV outputs and to each other's decisions,
must annotate each case using the strict direct-support/direct-contradiction
rubric. A third reviewer adjudicates disagreements. Record `SUPPORTED`,
`CONTRADICTED`, `MIXED`, or `INSUFFICIENT_EVIDENCE`; missing coverage alone is
insufficient evidence, not contradiction. Store proposition boundaries and
whether each split faithfully preserves the original claim. Reject or repair
unfaithful splits before freezing, without using JEV feedback. Reviewers must
have suitable domain expertise for consequential biomedical interpretation.

Target at least 20 adjudicated cases per class, including 20 genuine `MIXED`
cases, from at least 40 distinct article versions. A case can be counted only
once. If this minimum is not met, report a construction shortfall and do not
call the result confirmatory. The source set and all case labels must be frozen
before model requests.

## Paired predictions

Every case receives both contracts. The compound arm uses the exact
EXP-EL005 questions and mapping. The proposition arm sends neutrally named
`P1`, `P2`, ... fields in original claim order. For **each** proposition it
asks the same two atomic questions: whether the evidence directly supports
that proposition and whether it directly establishes its opposite. An arm has
support if any proposition yields direct-support `YES`, and contradiction if
any yields direct-contradiction `YES`. Both signals map to `MIXED`;
contradiction without support maps to `CONTRADICTED`; support without
contradiction maps to `SUPPORTED` only when every atomic answer is resolved;
all remaining patterns map to `INSUFFICIENT_EVIDENCE`. A proposition returning `YES` to both
questions is flagged for reviewer audit, without altering the frozen score.

EXP-EL006 used fields named `supportedProposition` and
`contradictedProposition`; those names disclosed the expected direction and
must not be reused in this confirmatory arm. Freeze exact question bytes,
model alias and resolved model version, request schema, answer mapping, retry
policy, and case order before execution. Randomize arm order per case with a
recorded seed. Neither arm receives the reference label, reviewer notes,
source identity, or expected answer. Do not tune either arm after seeing any
EXP-EL007 response.

Preserve request and response metadata, raw answers, probabilities if supplied,
latency, retry attempts, errors, and model version. A failed request is a
failure, not a dropped case. Any retry follows the frozen policy and is shown
separately. Do not substitute generated answers for missing responses.

## Primary and secondary endpoints

Primary endpoint: paired `MIXED` recall on adjudicated `MIXED` cases, defined
as the number mapped to `MIXED` divided by all adjudicated `MIXED` cases for
each arm. Report the paired difference in percentage points and the case-level
rescue and regression counts. The proposition arm supports the hypothesis only
if its recall exceeds the compound arm by at least 15 percentage points and
there are more rescues than regressions. This threshold is a research decision
rule, not an estimate of clinical benefit.

Secondary endpoints: four-class accuracy, macro F1, per-class recall,
`CONTRADICTED` plus `MIXED` false reassurance mapped to `SUPPORTED`,
abstention rate, request failure rate, and performance by source article.
Report exact numerators and denominators and uncertainty intervals. No
threshold selection or post-hoc exclusion may alter the frozen primary result.

## Freeze and decision

Before the first model request, commit the protocol, case manifest, source
overlap audit, reviewer and adjudication records, faithful-split decisions,
question bytes, runner, scoring code, environment versions, randomization
seed, and SHA-256 hashes of each artifact. Record the freeze commit and remote
state. Keep private source/reviewer records outside public model payloads and
publish only what licenses and consent permit.

The protocol alone does not authorize a run. If independent review or source
isolation cannot be established, preserve the work as exploratory and report
the unmet gate. A positive result supports further bounded evaluation; it does
not approve JEV for autonomous scientific or medical judgment.
